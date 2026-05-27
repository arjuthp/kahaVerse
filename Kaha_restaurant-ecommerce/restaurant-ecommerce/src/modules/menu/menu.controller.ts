import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "auth/guards";
import { RolesGuard } from "auth/guards/roles.guard";
import { Roles } from "common/decorator";
import { UserRoleEnum } from "common/enums";
import { ParseUUIDPipe } from "common/pipes";

import { MenuService } from "./menu.service";
import {
  CreateMenuDto,
  FilterMenuDto,
  ToggleSignatureDto,
  UpdateMenuDto,
  CreateMenuVariantDto,
} from "./dtos";

@ApiTags("Menu")
@Controller("menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async createMenu(@Body() body: CreateMenuDto, @Req() req) {
    const businessId = req.user.businessId;

    return this.menuService.createMenu(businessId, body);
  }

  @Get("business/:businessId")
  async findAllMenu(
    @Param("businessId") businessId: string,
    @Query() query: FilterMenuDto
  ) {
    return this.menuService.findAllMenu(businessId, query);
  }

  @ApiOperation({ summary: "Id refers to menuId" })
  @Get(":id")
  async findMenuById(@Param("id", ParseUUIDPipe) menuId: string) {
    return this.menuService.findMenuById(menuId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async updateMenu(
    @Param("id", ParseUUIDPipe) menuId: string,
    @Body() body: UpdateMenuDto,
    @Req() req
  ) {
    const businessId = req.user.businessId;
    return this.menuService.updateMenu(menuId, businessId, body);
  }



  @ApiOperation({ summary: "Id refers to MenuId" })
  @Patch("toggle-signature/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async toggleSignatureMenu(
    @Param("id") id: string,
    @Body() body: ToggleSignatureDto,
    @Req() req
  ) {
    const businessId = req.user.businessId;

    return this.menuService.toggleSignatureMenu(id, businessId, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async deleteMenu(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    const businessId = req.user.businessId;

    return this.menuService.deleteMenu(id, businessId);
  }

  @Post(":id/variants")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async addVariant(@Param("id", ParseUUIDPipe) id: string, @Body() body: CreateMenuVariantDto, @Req() req) {
    return this.menuService.addVariant(id, req.user.businessId, body);
  }

  @Get(":id/variants")
  async getVariants(@Param("id") id: string) {
    return this.menuService.getVariants(id);
  }

  @Patch(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async updateVariant(@Param("variantId") variantId: string, @Body() body: Partial<CreateMenuVariantDto>, @Req() req) {
    return this.menuService.updateVariant(variantId, req.user.businessId, body);
  }

  @Delete(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async deleteVariant(@Param("variantId") variantId: string, @Req() req) {
    return this.menuService.deleteVariant(variantId, req.user.businessId);
  }

  @Post(":id/addon-groups/:groupId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async attachAddonGroup(@Param("id") id: string, @Param("groupId") groupId: string, @Req() req) {
    return this.menuService.attachAddonGroup(id, req.user.businessId, groupId);
  }

  @Delete(":id/addon-groups/:groupId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async detachAddonGroup(@Param("id") id: string, @Param("groupId") groupId: string, @Req() req) {
    return this.menuService.detachAddonGroup(id, req.user.businessId, groupId);
  }
}
