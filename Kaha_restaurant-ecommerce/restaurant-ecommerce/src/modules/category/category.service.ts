import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ILike, IsNull } from "typeorm";

import { ISuccessReponse } from "common/responses";
import { CategoryEntity } from "entities/index.entity";
import { CategoryRepository } from "src/repositories/index";

import { ICategoryResponse } from "./response";
import { CreateCategoryDto, UpdateCategoryDto } from "./dtos";

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(body: CreateCategoryDto): Promise<ISuccessReponse> {
    const { name, parentId } = body;

    await this.checkForExistingCategory(name);

    if (parentId) {
      const parentCatById = await this.categoryRepository.findOne({
        where: { id: parentId },
      });

      if (!parentCatById) {
        throw new BadRequestException("Parent category not found.");
      }
    }

    const category = this.categoryRepository.create(body);

    await this.categoryRepository.save({
      ...category,
      parent: { id: parentId },
    });

    return { message: "Category successfully created." };
  }

  async findAllCategories(businessId: string): Promise<ICategoryResponse[]> {
    const findManyOptions = {
      relations: { childrens: { childrens: true } },
      where: { parent: IsNull(), businessId },
    };

    const allCategory = await this.categoryRepository.find(findManyOptions);

    return allCategory.map((category) =>
      this.transformToCategoryResponse(category)
    );
  }

  async findCategoryById(id: string): Promise<ICategoryResponse> {
    const data = await this.categoryRepository.findOne({
      where: { id: id },
      relations: { childrens: true },
    });

    return this.transformToCategoryResponse(data);
  }

  async updateCategory(
    id: string,
    businessId: string,
    body: UpdateCategoryDto
  ): Promise<ISuccessReponse> {
    const { parentId, name, ...rest } = body;

    const categoryById = await this.categoryRepository.findOne({
      where: { id, businessId },
    });

    if (categoryById?.name?.toLowerCase() !== name.toLowerCase()) {
      await this.checkForExistingCategory(name);
    }

    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException("Parent Category Not Found.");
      }

      rest["parent"] = parent;
    }

    await this.categoryRepository.update({ id, businessId }, { ...rest, name });

    return { message: "Category successfully updated." };
  }

  async deleteCategory(
    id: string,
    businessId: string
  ): Promise<ISuccessReponse> {
    const category = await this.categoryRepository.findOne({
      where: { id, businessId },
    });

    if (!category) {
      throw new NotFoundException("Category Not Found.");
    }

    await this.categoryRepository.delete({ id, businessId });

    return { message: "Category successfully deleted." };
  }

  private async checkForExistingCategory(name: string) {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: ILike(name) },
    });

    if (existingCategory) {
      throw new ConflictException(
        "Category with the same name already exists."
      );
    }
  }

  private transformToCategoryResponse(
    data?: CategoryEntity
  ): ICategoryResponse {
    const { id, name, description, isActive, icon, childrens, position } = data;
    const transformedChildrens = childrens.map(
      ({ id, name, description, icon, isActive, position }) => ({
        id,
        name,
        description,
        icon,
        isActive,
        position,
      })
    );

    return {
      id,
      name,
      description,
      isActive,
      icon,
      position,
      childrens: transformedChildrens,
    };
  }
}
