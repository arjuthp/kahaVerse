import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Patch,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

import { JwtAuthGuard } from "auth/guards";
import { RolesGuard } from "auth/guards/roles.guard";
import { UserRoleEnum } from "common/enums";
import { Roles } from "common/decorator";

import { CategoryService } from "./category.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dtos";

@ApiTags("categories")
@ApiBearerAuth()
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  createCategory(@Body() body: CreateCategoryDto) {
    return this.categoryService.createCategory(body);
  }

  @Get("business/:businessId")
  findAllCategories(@Param("businessId") businessId: string) {
    return this.categoryService.findAllCategories(businessId);
  }

  @Get(":id")
  findCategoryById(@Param("id") id: string) {
    return this.categoryService.findCategoryById(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  updateCategory(
    @Param("id") id: string,
    @Body() body: UpdateCategoryDto,
    @Req() req
  ) {
    const businessId = req.user.businessId;
    return this.categoryService.updateCategory(id, businessId, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  deleteCategory(@Param("id") id: string, @Req() req) {
    const businessId = req.user.businessId;
    return this.categoryService.deleteCategory(id, businessId);
  }
}
