import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Between, ILike, In, Like } from "typeorm";

import { ISuccessReponse } from "common/responses";
import { AddOnEntity, MenuEntity } from "entities/index.entity";
import {
  AddonsRepository,
  CategoryRepository,
  MenuRepository,
  MenuVariantRepository,
  AddonGroupRepository,
} from "src/repositories/index";

import {
  CreateMenuDto,
  FilterMenuDto,
  ToggleSignatureDto,
  UpdateMenuDto,
  CreateMenuVariantDto,
} from "./dtos";

import { IMenuPaginationResponse, IMenuResponse } from "./response";

@Injectable()
export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly addonsRepository: AddonsRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly menuVariantRepository: MenuVariantRepository,
    private readonly addonGroupRepository: AddonGroupRepository,
  ) {}

  async createMenu(
    businessId: string,
    body: CreateMenuDto
  ): Promise<ISuccessReponse> {
    const { categoryId, addOnIds, ...rest } = body;

    const existingmenu = await this.menuRepository.findOne({
      where: { name: ILike(body.name), businessId },
    });

    if (existingmenu) {
      throw new ConflictException("Menu with the same name already exists.");
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    let addOns: AddOnEntity[];
    if (addOnIds) {
      addOns = await this.addonsRepository.find({
        where: { id: In(addOnIds) },
      });
    }

    await this.menuRepository.save({
      ...rest,
      businessId,
      category: category,
      addOns,
    });

    return { message: `Menu created successfully.` };
  }

  async findAllMenu(
    businessId: string,
    query: FilterMenuDto
  ): Promise<IMenuPaginationResponse | any> {
    const {
      page = "1",
      take = "10",
      name,
      categoryId,
      minPrice,
      maxPrice,
      groupBy,
    } = query;

    const limit = parseInt(take);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * limit;

    const whereClause: any = { businessId };

    if (categoryId) {
      whereClause["category.id"] = categoryId;
    }

    if (name) {
      whereClause["menu.name"] = Like(`%${name}%`);
    }

    if (minPrice && maxPrice) {
      whereClause["menu.price"] = Between(minPrice, maxPrice);
    }

    const [menuList, count] = await this.menuRepository.findAndCount({
      where: whereClause,
      relations: { category: true, addonGroups: true },
      skip,
      take: limit,
    });

    if (groupBy === "category") {
      return menuList.reduce((acc, menu) => {
        const category = menu.category.name;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(this.transformToMenuResponse(menu));

        return acc;
      }, {});
    }

    const transformMenuList = menuList.map((eachmenu) =>
      this.transformToMenuResponse(eachmenu)
    );
    const totalPages = Math.ceil(count / limit);

    return {
      metaData: {
        currentPage,
        totalPages: totalPages,
        totalCount: count,
        perPage: limit,
      },
      data: transformMenuList,
    };
  }

  async findMenuById(menuId: string): Promise<IMenuResponse> {
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });

    return this.transformToMenuResponse(menu);
  }

  async updateMenu(
    id: string,
    businessId: string,
    body: UpdateMenuDto
  ): Promise<ISuccessReponse> {
    const { categoryId, name, ...rest } = body;

    const existingMenu = await this.menuRepository.findOne({
      where: { id, businessId },
    });

    if (existingMenu?.name?.toLowerCase() !== name?.toLowerCase()) {
      const existingDbMenu = await this.menuRepository.findOne({
        where: { name: ILike(name), businessId },
      });

      if (existingDbMenu) {
        throw new ConflictException("Menu with the same name already exists.");
      }
    }

    await this.menuRepository.update(
      { id, businessId },
      {
        ...rest,
        name,
        category: { id: categoryId },
      }
    );

    return { message: "The menu item was successfully updated." };
  }



  async toggleSignatureMenu(
    menuId: string,
    businessId: string,
    body: ToggleSignatureDto
  ): Promise<ISuccessReponse> {
    const { isSignature } = body;

    const existingMenu = await this.menuRepository.findOne({
      where: { id: menuId, businessId },
    });

    if (!existingMenu) {
      throw new NotFoundException("Menu not found. Please check the menu ID.");
    }

    if (isSignature) {
      if (existingMenu.isSignature == true) {
        throw new BadRequestException(
          `This menu is already assingned as signature product.`
        );
      }

      const signatureProductsCount = await this.menuRepository.count({
        where: { businessId, isSignature: true },
      });

      if (signatureProductsCount >= 3) {
        throw new BadRequestException(
          `Signature menu reached the maximum limit of ${3}. Please remove existing signature menu first and proceed.`
        );
      }
    }

    await this.menuRepository.update(
      { id: menuId, businessId },
      { isSignature }
    );

    const message = isSignature
      ? "The menu is marked as signature successfully."
      : "The menu is removed from signature menu.";

    return { message };
  }

  async deleteMenu(
    menuId: string,
    businessId: string
  ): Promise<ISuccessReponse> {
    await this.menuRepository.delete({ id: menuId, businessId });

    return { message: "The menu item was successfully deleted." };
  }

  async addVariant(menuId: string, businessId: string, body: CreateMenuVariantDto) {
    const menu = await this.menuRepository.findOne({ where: { id: menuId, businessId } });
    if (!menu) throw new NotFoundException('Menu not found');
    
    if (body.price < 0) throw new BadRequestException('Price cannot be negative');

    return this.menuVariantRepository.save({ ...body, menu });
  }

  async getVariants(menuId: string) {
    return this.menuVariantRepository.find({ where: { menu: { id: menuId } } });
  }

  async updateVariant(variantId: string, businessId: string, body: Partial<CreateMenuVariantDto>) {
    const variant = await this.menuVariantRepository.findOne({ where: { id: variantId }, relations: ['menu'] });
    if (!variant || variant.menu.businessId !== businessId) throw new NotFoundException('Variant not found');
    
    await this.menuVariantRepository.update(variantId, body);
    return this.menuVariantRepository.findOne({ where: { id: variantId } });
  }

  async deleteVariant(variantId: string, businessId: string) {
    const variant = await this.menuVariantRepository.findOne({ where: { id: variantId }, relations: ['menu'] });
    if (!variant || variant.menu.businessId !== businessId) throw new NotFoundException('Variant not found');
    
    await this.menuVariantRepository.delete(variantId);
    return { message: "Variant deleted successfully." };
  }

  async attachAddonGroup(menuId: string, businessId: string, groupId: string) {
    const menu = await this.menuRepository.findOne({ where: { id: menuId, businessId }, relations: ['addonGroups'] });
    if (!menu) throw new NotFoundException('Menu not found');

    const group = await this.addonGroupRepository.findOne({ where: { id: groupId, businessId } });
    if (!group) throw new NotFoundException('Addon Group not found');

    menu.addonGroups.push(group);
    await this.menuRepository.save(menu);
    return { message: "Addon Group attached successfully." };
  }

  async detachAddonGroup(menuId: string, businessId: string, groupId: string) {
    const menu = await this.menuRepository.findOne({ where: { id: menuId, businessId }, relations: ['addonGroups'] });
    if (!menu) throw new NotFoundException('Menu not found');

    menu.addonGroups = menu.addonGroups.filter(g => g.id !== groupId);
    await this.menuRepository.save(menu);
    return { message: "Addon Group detached successfully." };
  }

  private transformToMenuResponse(menuEntity: MenuEntity): IMenuResponse | any {
    const { addonGroups } = menuEntity;

    const addonsInfo = addonGroups?.map((group) => ({
      id: group.id,
      name: group.name,
      isRequired: group.isRequired
    }));
    const {
      id,
      name,
      businessId,
      description,
      details,
      services,
      images,
      isBarItem,
      isSignature,
      allowAddOns,
      isAvailable,
      price,
      discountedPrice,
      category,
    } = menuEntity;

    return {
      id,
      name,
      businessId,
      description,
      details,
      services,
      images,
      isBarItem,
      isSignature,
      isAvailable,
      price,
      discountedPrice,
      addonsInfo,
      allowAddOns,
      category,
    };
  }
}
