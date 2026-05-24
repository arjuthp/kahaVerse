import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ISuccessReponse } from "common/responses";

import {
  CreateCartItemDto,
  FilterCartDto,
  UpdateCartItemDto,
} from "./dtos/index";
import { CartEntity, CartItemEntity, MenuEntity } from "entities/index.entity";

import {
  ICartItemResponse,
  ICartItemWithAdditionalInfo,
  ICartResponse,
} from "./responses/index";
import {
  CartItemRepository,
  CartItemAddOnsRepository,
  CartRepository,
  MenuVariantRepository,
  AddonsRepository,
} from "src/repositories/index";

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly cartItemAddonsRepository: CartItemAddOnsRepository,
    private readonly menuVariantRepository: MenuVariantRepository,
    private readonly addonsRepository: AddonsRepository,
  ) {}

  async createCart(userId: string, businessId: string): Promise<any> {
    const existingCart = await this.cartRepository.findOne({
      where: { userId, businessId },
    });
    if (existingCart) {
      throw new ConflictException(
        `A cart with the specified userId and businessId already exists.`
      );
    }
    return this.cartRepository.save({ userId, businessId });
  }

  async createCartItem(body: CreateCartItemDto): Promise<ISuccessReponse> {
    const { menuId, menuVariantId, userId, addonInfo, ...rest } = body;

    const selectedAddonIds = addonInfo?.map((a) => a.addonsId) || [];
    const variantOrMenu = await this.validateAddons(menuVariantId, menuId, selectedAddonIds);
    const businessId = variantOrMenu.menu.businessId;

    let existingCart = await this.cartRepository.findOne({
      where: { userId, businessId },
      relations: { cartItems: { menu: true } },
    });

    if (!existingCart) {
      existingCart = await this.createCart(userId, businessId);
    }

    const cartItem = await this.cartItemRepository.save({
      ...rest,
      cart: existingCart,
      menu: { id: menuId },
      menuVariant: menuVariantId && menuVariantId !== menuId ? { id: menuVariantId } : null,
      unitPriceSnapshot: variantOrMenu.price,
    });

    if (addonInfo?.length) {
      await Promise.all(
        addonInfo.map(async ({ addonsId, quantity }) => {
          const addon = await this.addonsRepository.findOne({ where: { id: addonsId } });
          await this.cartItemAddonsRepository.save({
            cartItem,
            menuAddOn: { id: addonsId },
            quantity,
            unitPriceSnapshot: addon?.price || 0,
          });
        })
      );
    }

    return { message: "CartItem successfully created." };
  }

  async findUserCart(
    query: FilterCartDto,
    userId: string
  ): Promise<ICartResponse[] | any> {
    const { groupBy } = query;

    let whereClause = {};

    if (userId) {
      whereClause["userId"] = userId;
    }

    const userCart = await this.cartRepository.findOne({
      where: { userId: userId },
      relations: {
        cartItems: {
          menu: true,
          addOns: { menuAddOn: true },
        },
      },
    });

    if (groupBy === "business") {
      const userCartsByBusiness = userCart?.cartItems.reduce(
        (acc, cartitem) => {
          const businessId = cartitem?.menu?.businessId;
          if (!acc[businessId]) {
            acc[businessId] = [];
          }
          acc[businessId].push(this.transformToCartItemResponse(cartitem));
          return acc;
        },
        {}
      );

      return {
        cartId: userCart.id,
        userId: userCart.userId,
        business: userCartsByBusiness,
      };
    }

    if (!userCart) {
      throw new NotFoundException("Cart not found");
    }

    return this.transformToCartResponse(userCart);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    body: UpdateCartItemDto
  ): Promise<ISuccessReponse> {
    const { quantity, addonInfo } = body;

    if (quantity && quantity < 1) {
      throw new BadRequestException("Quantity must be at least 1");
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cart: { userId } },
      relations: { addOns: true, menu: true, menuVariant: true },
    });

    if (!cartItem) {
      throw new NotFoundException("Cart item not found");
    }

    const selectedAddonIds = addonInfo?.map(a => a.addOnId) || [];
    await this.validateAddons(cartItem.menuVariant?.id || cartItem.menu.id, cartItem.menu.id, selectedAddonIds);

    cartItem.quantity = quantity || cartItem.quantity;

    await this.cartItemAddonsRepository.remove(cartItem.addOns);

    if (addonInfo && addonInfo.length) {
      const newAddons = addonInfo.map((addon) =>
        this.cartItemAddonsRepository.create({
          cartItem,
          menuAddOn: { id: addon.addOnId },
          quantity: addon.quantity,
        })
      );

      cartItem.addOns = await this.cartItemAddonsRepository.save(newAddons);
    }

    await this.cartItemRepository.save(cartItem);

    return { message: "The menu item was successfully updated." };
  }

  async deleteCart(cartId: string, userId: string): Promise<ISuccessReponse> {
    await this.cartRepository.delete({ id: cartId, userId: userId });
    return { message: "Cart was successfully deleted." };
  }

  async deleteCartItem(
    userId: string,
    cartItemId: string
  ): Promise<ISuccessReponse> {
    const checkCartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cart: { userId } },
    });

    if (!checkCartItem) {
      throw new NotFoundException("The requested resource was not found");
    }

    await this.cartItemRepository.delete(cartItemId);

    return { message: "Cartitem was successfully deleted." };
  }

  private transformToCartItemResponse(
    cartItem: CartItemEntity
  ): ICartItemResponse {
    const { id, quantity, addOns, menu, menuVariant, unitPriceSnapshot } = cartItem;

    const addOnsList = addOns?.map((each) => {
      return {
        name: each?.menuAddOn?.name,
        description: each?.menuAddOn?.description,
        coverImg: each?.menuAddOn?.coverImg,
        unitPriceSnapshot: each?.unitPriceSnapshot,
      };
    });

    return {
      id,
      quantity,
      name: menu?.name,
      variantName: menuVariant?.name || null,
      unitPriceSnapshot,
      addOns: addOnsList,
    };
  }

  private transformToCartItem(
    cartItem: CartItemEntity
  ): ICartItemWithAdditionalInfo {
    const { id, quantity, addOns, menu, menuVariant, unitPriceSnapshot } = cartItem;
    const { name } = menu;
    // Use snapshot price for financial accuracy — decoupled from live menu price changes
    const snapshotPrice = Number(unitPriceSnapshot) || 0;
    const itemTotal = snapshotPrice * quantity;

    let addonsTotal = 0;

    const itemAddons = addOns.map((addon) => {
      const { name, description, coverImg } = addon?.menuAddOn;
      const addonUnitPrice = Number(addon?.unitPriceSnapshot) || 0;
      const { quantity } = addon;
      const addonTotal = addonUnitPrice * quantity;
      addonsTotal += addonTotal;

      return {
        name,
        description,
        coverImg,
        price: addonUnitPrice,
        quantity,
        total: addonTotal,
      };
    });

    return {
      id,
      name,
      quantity,
      variantName: menuVariant?.name || null,
      addOns: itemAddons,
      addonsTotal,
      menu: { name, price: snapshotPrice },
      itemTotal,
      grandTotal: itemTotal + addonsTotal,
    };
  }

  private transformToCartResponse(cart: CartEntity): ICartResponse {
    const { id, userId, cartItems } = cart;

    const cartItemsInfo = cartItems?.map(this.transformToCartItem);

    return {
      id,
      userId,
      cartItemsInfo,
    };
  }

  private async validateAddons(menuVariantId: string, menuId: string, addonIds: string[]) {
    let targetEntity;
    let price;
    let menuGroups;
    let isAvailable = false;

    if (!menuVariantId || menuVariantId === menuId) {
      const menu = await this.cartItemRepository.manager.findOne(MenuEntity, {
        where: { id: menuId },
        relations: { addonGroups: { addons: true } }
      });
      if (!menu) throw new BadRequestException("Valid and available Menu is required.");
      targetEntity = menu;
      price = menu.price;
      menuGroups = menu.addonGroups;
      isAvailable = menu.isAvailable;
    } else {
      const variant = await this.menuVariantRepository.findOne({ 
        where: { id: menuVariantId, menu: { id: menuId } },
        relations: { menu: { addonGroups: { addons: true } } }
      });
      if (!variant) throw new BadRequestException("Valid and available Menu Variant is required.");
      targetEntity = variant;
      price = variant.price;
      menuGroups = variant.menu.addonGroups;
      isAvailable = variant.isAvailable;
    }

    if (!isAvailable) {
      throw new BadRequestException("Selected item is not available.");
    }

    if (menuGroups?.length) {
      for (const group of menuGroups) {
        const groupAddonIds = group.addons?.map(a => a.id) || [];
        const selectedCountInGroup = addonIds.filter(id => groupAddonIds.includes(id)).length;
        
        if (group.isRequired && selectedCountInGroup === 0) {
          throw new BadRequestException(`Addon group '${group.name}' is required.`);
        }
        if (group.minSelect && selectedCountInGroup < group.minSelect) {
          throw new BadRequestException(`You must select at least ${group.minSelect} from '${group.name}'.`);
        }
        if (group.maxSelect && selectedCountInGroup > group.maxSelect) {
          throw new BadRequestException(`You can select at most ${group.maxSelect} from '${group.name}'.`);
        }
      }

      const allAllowedAddonIds = menuGroups.flatMap(g => g.addons?.map(a => a.id) || []);
      for (const id of addonIds) {
        if (!allAllowedAddonIds.includes(id)) {
          throw new BadRequestException(`Addon is not valid for this menu item.`);
        }
      }
    } else if (addonIds.length > 0) {
      throw new BadRequestException("This menu item does not accept addons.");
    }

    // Return mocked structure that works for both variant and menu
    return { 
      price, 
      menu: targetEntity.businessId ? targetEntity : targetEntity.menu 
    };
  }
}
