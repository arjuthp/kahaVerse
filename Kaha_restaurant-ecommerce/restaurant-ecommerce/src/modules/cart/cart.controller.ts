import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Patch,
  BadRequestException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiBody } from "@nestjs/swagger";

import { JwtAuthGuard } from "auth/guards";
import { CartService } from "./cart.service";
import { CreateCartItemDto, FilterCartDto, UpdateCartItemDto } from "./dtos";

@ApiTags("Cart")
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', properties: { businessId: { type: 'string', example: '7476ee15-1407-41fa-9a49-89e0caaf945d' } } } })
  async createCart(@Req() req: any, @Body("businessId") businessId: string) {
    if (!businessId) {
      throw new BadRequestException("businessId is required in the request body");
    }
    const userId = req?.user?.id.toString();
    return this.cartService.createCart(userId, businessId);
  }

  @Post("item")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createCartItem(
    @Body() createCartItemDto: CreateCartItemDto,
    @Req() req: any
  ) {
    const userId = req?.user?.id.toString();
    createCartItemDto.userId = userId;
    return this.cartService.createCartItem(createCartItemDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAllCarts(@Query() query: FilterCartDto, @Req() req: any) {
    const userId = req?.user?.id.toString();
    return this.cartService.findUserCart(query, userId);
  }

  @Patch("/:itemId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateCartItem(
    @Param("itemId") cartItemId: string,
    @Body() body: UpdateCartItemDto,
    @Req() req: any
  ) {
    const userId = req?.user?.id.toString();
    return this.cartService.updateCartItem(userId, cartItemId, body);
  }

  @Delete("/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteCart(@Param("id") id: string, @Req() req: any) {
    const userId = req?.user?.id.toString();
    return this.cartService.deleteCart(id, userId);
  }

  @Delete("/item/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteCartItem(@Param("id") id: string, @Req() req: any) {
    const userId = req?.user?.id.toString();
    return this.cartService.deleteCartItem(id, userId);
  }
}
