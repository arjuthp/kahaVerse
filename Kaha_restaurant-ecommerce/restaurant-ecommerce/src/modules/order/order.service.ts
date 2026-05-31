import { ISuccessReponse } from "common/responses";
import { endOfDay, startOfDay } from "date-fns";
import { Between } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

import {
  OrderItemEntity,
  OrderItemAddonEntity,
  OrderEntity,
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
    private readonly serviceCommunicationService: ServiceCommunicationService
  ) {}

  async createOrder(
    body: CreateOrderDto,
    userId: string
  ): Promise<any> {
    const { orderItems, ...rest } = body;
    const orderNumber = `ORD-${Date.now()}`;
    
    const order = await this.orderRepository.save({ ...rest, userId, orderNumber });

    const orderItemTotals = await Promise.all(
      orderItems?.map(async (item) => {
        const { quantity, menuId, menuVariantId, itemAddons } = item;

        const menu = await this.menuRepository.findOne({
          where: { id: menuId },
        });

        if (!menu) {
          throw new NotFoundException(`Menu item ${menuId} not found`);
        }

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

        const savedOrderItem = await this.orderItemRepository.save({
          quantity,
          menuNameSnapshot: menu.name,
          variantNameSnapshot: variant ? variant.name : null,
          unitPriceSnapshot,
          addonsTotal,
          lineTotal,
          menu: { id: menuId },
          menuVariant: variant ? { id: variant.id } : null,
          order,
        });

        for (const addon of addons) {
          await this.orderItemAddonRepository.save({
            ...addon,
            orderItem: savedOrderItem,
          });
        }

        return lineTotal;
      })
    );

    // Calculate order totals
    const subtotal = orderItemTotals?.reduce((sum, value) => sum + value, 0);
    const taxAmount = subtotal * 0.13; // 13% tax
    const deliveryFee = body.serviceType === ServiceTypeEnum.DELIVERY ? 5 : 0;
    
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.deliveryFee = deliveryFee;
    order.serviceCharge = body.serviceCharge || 0;
    order.discountAmount = body.discountAmount || 0;
    order.tipAmount = body.tipAmount || 0;
    order.totalAmount = subtotal + taxAmount + deliveryFee + Number(order.serviceCharge) - Number(order.discountAmount) + Number(order.tipAmount);

    await this.orderRepository.save(order);

    await this.orderStatusRepository.save({
      order: order,
      status: OrderStatusEnum.PENDING,
      updatedBy: userId,
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
    const { businessId, cartItemIds, serviceType, tableNumber, remarks, paymentMethod, deliveryFee, serviceCharge, tipAmount, discountAmount } = body;

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

    // Create order
    const orderNumber = `ORD-${Date.now()}`;
    const order = await this.orderRepository.save({
      userId,
      businessId: resolvedBusinessId,
      orderNumber,
      serviceType,
      tableNumber,
      remarks,
      paymentMethod,
      subtotal: 0,
      taxAmount: 0,
      deliveryFee: deliveryFee || (serviceType === ServiceTypeEnum.DELIVERY ? 5 : 0),
      serviceCharge: serviceCharge || 0,
      discountAmount: discountAmount || 0,
      tipAmount: tipAmount || 0,
      totalAmount: 0,
    });

    // Convert cart items to order items with accurate price calculation
    const orderItemTotals = await Promise.all(
      itemsToOrder.map(async (cartItem) => {
        const { quantity, menu, menuVariant, addOns, unitPriceSnapshot } = cartItem;

        // Validate menu item still exists and is available
        const currentMenu = await this.menuRepository.findOne({
          where: { id: menu.id }
        });

        if (!currentMenu || !currentMenu.isAvailable) {
          throw new BadRequestException(`Menu item "${menu.name}" is no longer available`);
        }

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
        // Use snapshot price from cart (price when item was added to cart)
        const itemUnitPrice = Number(unitPriceSnapshot);
        const itemSubtotal = itemUnitPrice * quantity;
        const lineTotal = itemSubtotal + addonsTotal;

        // Create order item
        const savedOrderItem = await this.orderItemRepository.save({
          quantity,
          menuNameSnapshot: menu.name,
          variantNameSnapshot: menuVariant?.name || null,
          unitPriceSnapshot: itemUnitPrice,
          addonsTotal,
          lineTotal,
          menu: { id: menu.id },
          menuVariant: menuVariant ? { id: menuVariant.id } : null,
          order,
        });

        // Create order item addons
        for (const addon of addonDetails) {
          await this.orderItemAddonRepository.save({
            ...addon,
            orderItem: savedOrderItem,
          });
        }

        return lineTotal;
      })
    );

    // Calculate order totals
    const subtotal = orderItemTotals.reduce((sum, value) => sum + value, 0);
    const taxAmount = subtotal * 0.13; // 13% tax
    const finalDeliveryFee = Number(order.deliveryFee || 0);
    const finalServiceCharge = Number(order.serviceCharge || 0);
    const finalDiscountAmount = Number(order.discountAmount || 0);
    const finalTipAmount = Number(order.tipAmount || 0);
    
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.totalAmount = subtotal + taxAmount + finalDeliveryFee + finalServiceCharge - finalDiscountAmount + finalTipAmount;

    await this.orderRepository.save(order);

    // Create initial order status
    await this.orderStatusRepository.save({
      order: order,
      status: OrderStatusEnum.PENDING,
      updatedBy: userId,
    });

    // Remove ordered items from cart
    await this.cartItemRepository.remove(itemsToOrder);

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
  ): Promise<ISuccessReponse> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    await this.orderStatusRepository.save({
      order: order,
      status: newStatus,
      updatedBy: userId,
    });

    return { message: "Order status updated successfully." };
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
    const { id, userId, businessId, totalAmount, remarks } = orders;

    return {
      id,
      userId,
      businessId,
      totalAmount,
      remarks,
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
      const userData = await this.serviceCommunicationService.getUser(userId);
      
      return {
        name: userData.fullName,
        email: userData.email,
        contact: userData.contactNumber,
        avatar: userData.avatar || '',
      };
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }
}
