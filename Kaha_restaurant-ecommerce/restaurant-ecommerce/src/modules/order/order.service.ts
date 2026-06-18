import { ISuccessReponse } from "common/responses";
import { endOfDay, startOfDay } from "date-fns";
import { Between, DataSource, EntityManager } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

import {
  OrderItemEntity,
  OrderItemAddonEntity,
  OrderEntity,
  OrderStatusEntity,
  CartItemEntity,
} from "entities/index.entity";

import {
  AddonsRepository,
  MenuRepository,
  OrderItemAddonRepository,
  OrderItemRepository,
  OrderRepository,
  OrderStausRepository,
  MenuVariantRepository,
  CartRepository,
  CartItemRepository,
  UserRepository,
} from "src/repositories/index";

import { CreateOrderDto, FilterOrderDto } from "./dto";
import { CreateOrderFromCartDto } from "./dto/create-order-from-cart.dto";

import {
  IOrderItemResponse,
  IOrderResponse,
  IOrderSummaryResponse,
  IBusinessInfo,
  IUserInfo,
} from "./response";
import { OrderStatusEnum, ServiceTypeEnum } from "common/enums";
import { Injectable } from "@nestjs/common";
import { ServiceCommunicationService } from "src/modules/service-communication/service-communication.service";
import { LoyaltyService } from '../loyalty/loyalty.service';

const MAX_VOUCHERS_PER_ORDER = 3;

@Injectable()
export class OrderService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly addonsRepository: AddonsRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly orderItemAddonRepository: OrderItemAddonRepository,
    private readonly orderStatusRepository: OrderStausRepository,
    private readonly menuVariantRepository: MenuVariantRepository,
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly serviceCommunicationService: ServiceCommunicationService,
    private readonly loyaltyService: LoyaltyService,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(
    body: CreateOrderDto,
    userId: string
  ): Promise<any> {
    const { orderItems, ...rest } = body;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // 1. Calculate order items in memory
    let subtotal = 0;
    const cartItemsForValidation: Array<{ menuItemId: string; categoryId: string }> = [];
    const resolvedItems = await Promise.all(
      orderItems?.map(async (item) => {
        const { quantity, menuId, menuVariantId, itemAddons } = item;

        const menu = await this.menuRepository.findOne({
          where: { id: menuId },
        });

        if (!menu) {
          throw new NotFoundException(`Menu item ${menuId} not found`);
        }

        cartItemsForValidation.push({
          menuItemId: menu.id,
          categoryId: menu.category?.id || '',
        });

        const variant = await this.menuVariantRepository.findOne({
          where: { id: menuVariantId },
        });

        if (!variant) {
          throw new NotFoundException(`Menu variant ${menuVariantId} not found`);
        }

        // Calculate addon prices
        const addons = await Promise.all(
          itemAddons?.map(async (addon) => {
            const { quantity, addonId } = addon;
            const itemAddon = await this.addonsRepository.findOne({
              where: { id: addonId }, relations: ['addonGroup']
            });

            if (!itemAddon) {
              throw new NotFoundException(`Addon ${addonId} not found`);
            }

            const addonUnitPrice = Number(itemAddon.price);
            const addonLineTotal = quantity * addonUnitPrice;

            return {
              quantity,
              addonNameSnapshot: itemAddon.name,
              addonGroupNameSnapshot: itemAddon.addonGroup?.name || "Addon",
              unitPriceSnapshot: addonUnitPrice,
              lineTotal: addonLineTotal,
              addon: { id: addonId },
            };
          }) || []
        );

        // Calculate totals
        const addonsTotal = addons.reduce((sum, a) => sum + Number(a.lineTotal), 0);
        const unitPriceSnapshot = variant ? Number(variant.price) : Number(menu.price);
        const itemSubtotal = unitPriceSnapshot * quantity;
        const lineTotal = itemSubtotal + addonsTotal;

        subtotal += lineTotal;

        return {
          item: {
            quantity,
            menuNameSnapshot: menu.name,
            variantNameSnapshot: variant ? variant.name : null,
            unitPriceSnapshot,
            addonsTotal,
            lineTotal,
            menu: { id: menuId },
            menuVariant: variant ? { id: variant.id } : null,
          },
          addons,
        };
      }) || []
    );

    // 2. Validate voucher(s) BEFORE saving anything
    const voucherCodes = body.voucherCodes || (body.voucherCode ? [body.voucherCode] : []);
    if (voucherCodes.length > MAX_VOUCHERS_PER_ORDER) {
      throw new BadRequestException('TOO_MANY_VOUCHERS');
    }

    const validatedVouchers: Array<{ voucher: any; discountAmount: number }> = [];
    for (const code of voucherCodes) {
      const result = await this.loyaltyService.validateVoucherForCheckout(
        code,
        userId,
        body.businessId,
        subtotal,
        body.serviceType || '',
        cartItemsForValidation,
      );
      validatedVouchers.push(result);
    }

    // Stacking validation: At most ONE voucher per discount class
    const seenDiscountClasses = new Set<string>();
    for (const item of validatedVouchers) {
      const discountClass = item.voucher.discountClass || 'ORDER_TOTAL';
      if (seenDiscountClasses.has(discountClass)) {
        throw new BadRequestException(`DUPLICATE_DISCOUNT_CLASS:${discountClass}`);
      }
      seenDiscountClasses.add(discountClass);
    }

    // 3. Compute final totals and split discounts
    const taxAmount = subtotal * 0.13; // 13% tax
    const deliveryFee = Number(body.deliveryFee !== undefined && body.deliveryFee !== null ? body.deliveryFee : (body.serviceType === ServiceTypeEnum.DELIVERY ? 5 : 0));
    const serviceCharge = body.serviceCharge || 0;
    const tipAmount = body.tipAmount || 0;

    let orderDiscountAmount = 0;
    let deliveryDiscountAmount = 0;
    let serviceChargeDiscountAmount = 0;
    let itemDiscountAmount = 0;

    for (const { voucher, discountAmount: vDiscount } of validatedVouchers) {
      const discountClass = voucher.discountClass || 'ORDER_TOTAL';
      switch (discountClass) {
        case 'ORDER_TOTAL':
          orderDiscountAmount += vDiscount;
          break;
        case 'DELIVERY_FEE':
          deliveryDiscountAmount = Math.min(
            deliveryDiscountAmount + vDiscount,
            deliveryFee
          );
          break;
        case 'SERVICE_CHARGE':
          serviceChargeDiscountAmount = Math.min(
            serviceChargeDiscountAmount + vDiscount,
            Number(serviceCharge)
          );
          break;
        case 'ITEM_SPECIFIC':
          itemDiscountAmount += vDiscount;
          break;
      }
    }

    const discountAmount = orderDiscountAmount + deliveryDiscountAmount
      + serviceChargeDiscountAmount + itemDiscountAmount;

    const rawTotalAmount = subtotal + taxAmount + deliveryFee + Number(serviceCharge) - Number(discountAmount) + Number(tipAmount);
    const totalAmount = Math.max(0, rawTotalAmount);

    // 4. Save order ONCE within transaction
    const order = await this.dataSource.transaction(async (manager) => {
      const savedOrder = await manager.save(OrderEntity, {
        ...rest,
        userId,
        orderNumber,
        subtotal,
        taxAmount,
        deliveryFee,
        serviceCharge,
        discountAmount,
        orderDiscountAmount,
        deliveryDiscountAmount,
        serviceChargeDiscountAmount,
        itemDiscountAmount,
        appliedVoucherIds: validatedVouchers.map(v => v.voucher.id),
        tipAmount,
        totalAmount,
      });

      // 5. Save order items and addons
      for (const resolved of resolvedItems) {
        const savedOrderItem = await manager.save(OrderItemEntity, {
          ...resolved.item,
          order: savedOrder,
        });

        for (const addon of resolved.addons) {
          await manager.save(OrderItemAddonEntity, {
            ...addon,
            orderItem: savedOrderItem,
          });
        }
      }

      // 6. Redeem/consume voucher after successful order creation
      for (const { voucher, discountAmount: vDiscount } of validatedVouchers) {
        await this.loyaltyService.redeemVoucher(
          voucher.id,
          savedOrder.id,
          voucher,
          vDiscount,
          manager
        );
      }

      // 7. Save initial order status
      await manager.save(OrderStatusEntity, {
        order: savedOrder,
        status: OrderStatusEnum.PENDING,
        updatedBy: userId,
      });

      return savedOrder;
    });

    return { message: "Order created successfully", orderId: order.id, order };
  }

  /**
   * Create order from cart items (partial or full cart checkout)
   * 
   * @param body - Order details with optional cartItemIds for partial checkout
   * @param userId - User ID from JWT
   * @returns Success message
   * 
   * Features:
   * - Full cart checkout: If cartItemIds not provided, converts entire cart
   * - Partial checkout: If cartItemIds provided, converts only selected items
   * - Accurate pricing: Calculates menu price × quantity + addons
   * - Cart cleanup: Removes ordered items from cart after successful order
   * - Business validation: Ensures all cart items belong to same business
   */
  async createOrderFromCart(
    body: CreateOrderFromCartDto,
    userId: string
  ): Promise<any> {
    const { businessId, cartItemIds, serviceType, tableNumber, remarks, paymentMethod, deliveryFee, serviceCharge, tipAmount, discountAmount, voucherCode, voucherCodes: bodyVoucherCodes } = body;

    // Find user's cart
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: {
        cartItems: {
          menu: true,
          menuVariant: true,
          addOns: { menuAddOn: true }
        }
      }
    });

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Derive businessId from cart if not provided by client
    const resolvedBusinessId = businessId || cart.businessId;

    // Filter cart items: either selected items or all items for the business
    let itemsToOrder = cart.cartItems;

    // If specific cart items selected (partial checkout)
    if (cartItemIds && cartItemIds.length > 0) {
      itemsToOrder = cart.cartItems.filter(item => cartItemIds.includes(item.id));
      
      if (itemsToOrder.length === 0) {
        throw new BadRequestException('No valid cart items found for the provided IDs');
      }
    }

    // Validate all items belong to the same business (only if businessId was explicitly provided)
    if (businessId) {
      const invalidItems = itemsToOrder.filter(item => item.menu.businessId !== businessId);
      if (invalidItems.length > 0) {
        throw new BadRequestException(`Some cart items do not belong to business ${businessId}`);
      }
    }

    // 1. Calculate items in memory
    let subtotal = 0;
    const cartItemsForValidation: Array<{ menuItemId: string; categoryId: string }> = [];
    const resolvedItems = await Promise.all(
      itemsToOrder.map(async (cartItem) => {
        const { quantity, menu, menuVariant, addOns, unitPriceSnapshot } = cartItem;

        // Validate menu item still exists and is available
        const currentMenu = await this.menuRepository.findOne({
          where: { id: menu.id }
        });

        if (!currentMenu || !currentMenu.isAvailable) {
          throw new BadRequestException(`Menu item "${menu.name}" is no longer available`);
        }

        cartItemsForValidation.push({
          menuItemId: currentMenu.id,
          categoryId: currentMenu.category?.id || '',
        });

        // Validate variant if exists
        if (menuVariant) {
          const currentVariant = await this.menuVariantRepository.findOne({
            where: { id: menuVariant.id }
          });

          if (!currentVariant || !currentVariant.isAvailable) {
            throw new BadRequestException(`Variant "${menuVariant.name}" is no longer available`);
          }
        }

        // Calculate addon totals
        let addonsTotal = 0;
        const addonDetails = [];

        for (const cartAddon of addOns || []) {
          const { menuAddOn, quantity: addonQuantity, unitPriceSnapshot: addonPrice } = cartAddon;

          // Validate addon still exists
          const currentAddon = await this.addonsRepository.findOne({
            where: { id: menuAddOn.id },
            relations: ['addonGroup']
          });

          if (!currentAddon) {
            throw new BadRequestException(`Addon "${menuAddOn.name}" is no longer available`);
          }

          const addonUnitPrice = Number(addonPrice || currentAddon.price);
          const addonLineTotal = addonQuantity * addonUnitPrice;
          addonsTotal += addonLineTotal;

          addonDetails.push({
            quantity: addonQuantity,
            addonNameSnapshot: currentAddon.name,
            addonGroupNameSnapshot: currentAddon.addonGroup?.name || "Addon",
            unitPriceSnapshot: addonUnitPrice,
            lineTotal: addonLineTotal,
            addon: { id: currentAddon.id },
          });
        }

        // Calculate item total
        const itemUnitPrice = Number(unitPriceSnapshot);
        const itemSubtotal = itemUnitPrice * quantity;
        const lineTotal = itemSubtotal + addonsTotal;

        subtotal += lineTotal;

        return {
          item: {
            quantity,
            menuNameSnapshot: menu.name,
            variantNameSnapshot: menuVariant?.name || null,
            unitPriceSnapshot: itemUnitPrice,
            addonsTotal,
            lineTotal,
            menu: { id: menu.id },
            menuVariant: menuVariant ? { id: menuVariant.id } : null,
          },
          addons: addonDetails,
        };
      })
    );

    // 2. Validate voucher(s) BEFORE saving anything
    const voucherCodes = bodyVoucherCodes || (voucherCode ? [voucherCode] : []);
    if (voucherCodes.length > MAX_VOUCHERS_PER_ORDER) {
      throw new BadRequestException('TOO_MANY_VOUCHERS');
    }

    const validatedVouchers: Array<{ voucher: any; discountAmount: number }> = [];
    for (const code of voucherCodes) {
      const result = await this.loyaltyService.validateVoucherForCheckout(
        code,
        userId,
        resolvedBusinessId,
        subtotal,
        serviceType,
        cartItemsForValidation,
      );
      validatedVouchers.push(result);
    }

    // Stacking validation: At most ONE voucher per discount class
    const seenDiscountClasses = new Set<string>();
    for (const item of validatedVouchers) {
      const discountClass = item.voucher.discountClass || 'ORDER_TOTAL';
      if (seenDiscountClasses.has(discountClass)) {
        throw new BadRequestException(`DUPLICATE_DISCOUNT_CLASS:${discountClass}`);
      }
      seenDiscountClasses.add(discountClass);
    }

    // 3. Compute final totals and split discounts
    const taxAmount = subtotal * 0.13; // 13% tax
    const finalDeliveryFee = Number(deliveryFee || (serviceType === ServiceTypeEnum.DELIVERY ? 5 : 0));
    const finalServiceCharge = Number(serviceCharge || 0);
    const finalTipAmount = Number(tipAmount || 0);

    let orderDiscountAmount = 0;
    let deliveryDiscountAmount = 0;
    let serviceChargeDiscountAmount = 0;
    let itemDiscountAmount = 0;

    for (const { voucher, discountAmount: vDiscount } of validatedVouchers) {
      const discountClass = voucher.discountClass || 'ORDER_TOTAL';
      switch (discountClass) {
        case 'ORDER_TOTAL':
          orderDiscountAmount += vDiscount;
          break;
        case 'DELIVERY_FEE':
          deliveryDiscountAmount = Math.min(
            deliveryDiscountAmount + vDiscount,
            finalDeliveryFee
          );
          break;
        case 'SERVICE_CHARGE':
          serviceChargeDiscountAmount = Math.min(
            serviceChargeDiscountAmount + vDiscount,
            finalServiceCharge
          );
          break;
        case 'ITEM_SPECIFIC':
          itemDiscountAmount += vDiscount;
          break;
      }
    }

    const finalDiscountAmount = orderDiscountAmount + deliveryDiscountAmount
      + serviceChargeDiscountAmount + itemDiscountAmount;

    const rawTotalAmount = subtotal + taxAmount + finalDeliveryFee + finalServiceCharge - finalDiscountAmount + finalTipAmount;
    const totalAmount = Math.max(0, rawTotalAmount);

    // 4. Save order ONCE within transaction
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = await this.dataSource.transaction(async (manager) => {
      const savedOrder = await manager.save(OrderEntity, {
        userId,
        businessId: resolvedBusinessId,
        orderNumber,
        serviceType,
        tableNumber,
        remarks,
        paymentMethod,
        subtotal,
        taxAmount,
        deliveryFee: finalDeliveryFee,
        serviceCharge: finalServiceCharge,
        discountAmount: finalDiscountAmount,
        orderDiscountAmount,
        deliveryDiscountAmount,
        serviceChargeDiscountAmount,
        itemDiscountAmount,
        appliedVoucherIds: validatedVouchers.map(v => v.voucher.id),
        tipAmount: finalTipAmount,
        totalAmount,
      });

      // 5. Save order items and addons
      for (const resolved of resolvedItems) {
        const savedOrderItem = await manager.save(OrderItemEntity, {
          ...resolved.item,
          order: savedOrder,
        });

        for (const addon of resolved.addons) {
          await manager.save(OrderItemAddonEntity, {
            ...addon,
            orderItem: savedOrderItem,
          });
        }
      }

      // 6. Redeem/consume voucher after successful order creation
      for (const { voucher, discountAmount: vDiscount } of validatedVouchers) {
        await this.loyaltyService.redeemVoucher(
          voucher.id,
          savedOrder.id,
          voucher,
          vDiscount,
          manager
        );
      }

      // 7. Create initial order status
      await manager.save(OrderStatusEntity, {
        order: savedOrder,
        status: OrderStatusEnum.PENDING,
        updatedBy: userId,
      });

      // Remove ordered items from cart
      await manager.remove(CartItemEntity, itemsToOrder);

      return savedOrder;
    });

    return { 
      message: `Order created successfully. ${itemsToOrder.length} item(s) ordered. Order #${order.orderNumber}, Total: ${order.totalAmount}`,
      orderId: order.id,
      order
    };
  }

  async findOneOrder(id: string, userId: string): Promise<IOrderResponse> {
    const orders = await this.orderRepository.findOne({
      where: { id, userId },
      relations: { 
        orderItems: { addons: true, menu: true },
        orderStatus: true
      },
    });

    return this.transformToSingleOrderResponse(orders);
  }

  async findBusinessOrders(
    businessId: string,
    query?: FilterOrderDto
  ): Promise<IOrderSummaryResponse[]> {
    const { startDate, endDate, status } = query;

    const whereClause = {};

    whereClause["businessId"] = businessId;

    if (startDate && endDate) {
      const [dailyStart, dailyEnd] = this.getDailyStartAndEndDates(
        startDate,
        endDate
      );

      whereClause["createdAt"] = Between(dailyStart, dailyEnd);
    }
    const orders = await this.orderRepository.find({
      where: whereClause,
      relations: { orderStatus: true },
      order: {
        createdAt: "DESC",
      },
    });

    let filterOrder = orders;

    if (status) {
      filterOrder = orders.filter((order) => {
        const sortedOrderStatus = order?.orderStatus?.sort((a, b) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        return sortedOrderStatus[0].status === status;
      });
    }

    // Fetch business information
    const businessInfo = await this.getBusinessInfo(businessId);

    return Promise.all(
      filterOrder?.map(async (order) => {
        const orderResponse = this.transformToAllOrderResponse(order);
        
        // Add business info
        orderResponse.businessInfo = businessInfo;
        
        // Add user info if available
        if (order.userId) {
          orderResponse.userInfo = await this.getUserInfo(order.userId);
        }
        
        return orderResponse;
      })
    );
  }

  async findUserOrders(
    userId: string,
    query?: FilterOrderDto
  ): Promise<IOrderSummaryResponse[]> {
    const { startDate, endDate, status } = query;

    const whereClause = {};

    whereClause["userId"] = userId;

    if (startDate && endDate) {
      const [start, end] = this.getDailyStartAndEndDates(startDate, endDate);
      whereClause["createdAt"] = Between(start, end);
    }

    const orders = await this.orderRepository.find({
      where: whereClause,
      relations: { orderStatus: true },
      order: {
        createdAt: "DESC",
      },
    });

    let filterOrder = orders;

    if (status) {
      filterOrder = orders.filter((order) => {
        const sortedOrderStatus = order?.orderStatus?.sort((a, b) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        return sortedOrderStatus[0].status === status;
      });
    }

    // Fetch user information once
    const userInfo = await this.getUserInfo(userId);

    return Promise.all(
      filterOrder?.map(async (order) => {
        const orderResponse = this.transformToSingleOrderResponse(order);
        
        // Add user info
        orderResponse.userInfo = userInfo;
        
        // Add business info if available
        if (order.businessId) {
          orderResponse.businessInfo = await this.getBusinessInfo(order.businessId);
        }
        
        return orderResponse;
      })
    );
  }

  async changeOrderStatus(
    orderId: string,
    userId: string,
    newStatus: OrderStatusEnum
  ): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    await this.orderStatusRepository.save({
      order: order,
      status: newStatus,
      updatedBy: userId,
    });

    // ── AUTO-EARN LOYALTY POINTS on delivery/completion ────────────
    const completionStatuses: OrderStatusEnum[] = [OrderStatusEnum.DELIVERED];
    if (completionStatuses.includes(newStatus) && order.userId && order.businessId) {
      try {
        await this.loyaltyService.earnPoints(
          order.userId,
          order.businessId,
          order.id,
          Number(order.totalAmount),  // orderAmount (full amount for spend calculation)
          Number(order.subtotal),     // subtotal (pre-tip for visit qualification)
        );
      } catch (err) {
        // Non-blocking: loyalty failure must never break the status update
        console.error('[LoyaltyService] earnPoints failed:', err?.message);
      }
    }

    // ── Reload the order with fresh status history so the frontend can
    //    surgically update exactly this one order without re-fetching all orders.
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { orderStatus: true },
    });

    const orderResponse = this.transformToAllOrderResponse(updatedOrder);

    // Enrich with user info
    if (updatedOrder.userId) {
      orderResponse.userInfo = await this.getUserInfo(updatedOrder.userId);
    }
    // Enrich with business info
    if (updatedOrder.businessId) {
      orderResponse.businessInfo = await this.getBusinessInfo(updatedOrder.businessId);
    }

    return {
      message: 'Order status updated successfully.',
      order: orderResponse,
    };
  }

  getDailyStartAndEndDates(inputStartDate: Date, inputEndDate: Date) {
    const startDate = startOfDay(new Date(inputStartDate));
    const endDate = endOfDay(new Date(inputEndDate));

    return [startDate, endDate];
  }

  private transformToOrderItemAddonsResponse(
    orderItemAddons: OrderItemAddonEntity
  ) {
    const { id, quantity, addonNameSnapshot, unitPriceSnapshot, lineTotal } = orderItemAddons;

    return { id, quantity, name: addonNameSnapshot, price: unitPriceSnapshot, lineTotal };
  }

  private transformToOrderItemResponse(
    orderItem: OrderItemEntity
  ): IOrderItemResponse | any {
    const { id, quantity, unitPriceSnapshot, menuNameSnapshot, variantNameSnapshot, lineTotal, addons } = orderItem;

    const addonsInfo = addons?.map((orderItemAddon) =>
      this.transformToOrderItemAddonsResponse(orderItemAddon)
    );

    return { id, quantity, menuName: menuNameSnapshot, variantName: variantNameSnapshot, price: unitPriceSnapshot, lineTotal, addonsInfo };
  }

  private transformToSingleOrderResponse(order: OrderEntity): IOrderResponse {
    if (!order) return null;
    const { 
      id, userId, businessId, totalAmount, remarks, orderItems,
      orderNumber, serviceType, tableNumber, subtotal, taxAmount,
      deliveryFee, serviceCharge, discountAmount, tipAmount, paymentStatus,
      paymentMethod, orderStatus, createdAt, updatedAt
    } = order;

    const orderItemsInfo = orderItems?.map((items) =>
      this.transformToOrderItemResponse(items)
    );

    return {
      id,
      userId,
      businessId,
      totalAmount: Number(totalAmount),
      remarks,
      orderNumber,
      serviceType,
      tableNumber,
      subtotal: Number(subtotal),
      taxAmount: Number(taxAmount),
      deliveryFee: Number(deliveryFee),
      serviceCharge: Number(serviceCharge),
      discountAmount: Number(discountAmount),
      tipAmount: Number(tipAmount),
      paymentStatus,
      paymentMethod,
      createdAt: createdAt as any,
      updatedAt: updatedAt as any,
      orderStatus: orderStatus as any,
      orderItemsInfo,
    } as any;
  }

  private transformToAllOrderResponse(
    orders: OrderEntity
  ): IOrderSummaryResponse {
    const { id, userId, businessId, totalAmount, remarks, orderNumber, serviceType, paymentMethod, paymentStatus, orderStatus, createdAt, updatedAt } = orders;

    return {
      id,
      userId,
      businessId,
      totalAmount: Number(totalAmount),
      remarks,
      orderNumber,
      serviceType,
      paymentMethod,
      paymentStatus,
      orderStatus: orderStatus as any,
      createdAt: createdAt as any,
      updatedAt: updatedAt as any,
    };
  }

  private async getBusinessInfo(businessId: string): Promise<IBusinessInfo> {
    try {
      const businessData = await this.serviceCommunicationService.getBusiness(businessId);
      
      return {
        name: businessData.name,
        category: businessData.category?.name || '',
        address: businessData.address || '',
        avatar: businessData.avatar || '',
      };
    } catch (error) {
      console.error('Failed to fetch business info:', error);
      return null;
    }
  }

  private async getUserInfo(userId: string): Promise<IUserInfo> {
    try {
      // First try to find user in our local database (for customers registered directly)
      const localUser = await this.userRepository.findOne({ where: { id: userId } });
      if (localUser) {
        return {
          name: `${localUser.firstName || ''} ${localUser.lastName || ''}`.trim() || 'Kaha Customer',
          email: localUser.email || '',
          contact: localUser.phone || '',
          avatar: '',
        };
      }

      // Fallback to Kaha Main V3 API for external/kaha users
      const userData = await this.serviceCommunicationService.getUser(userId);
      return {
        name: userData?.fullName || 'Kaha Customer',
        email: userData?.email || '',
        contact: userData?.contactNumber || '',
        avatar: userData?.avatar || '',
      };
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return {
        name: 'Kaha Customer',
        email: '',
        contact: '',
        avatar: '',
      };
    }
  }
}
