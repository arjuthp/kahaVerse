import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "auth/guards";
import { ApiBearerAuth } from "@nestjs/swagger";

import { CreateOrderDto, CreateOrderFromCartDto, FilterOrderDto } from "./dto";
import { OrderService } from "order/order.service";
import { OrderStatusDto } from "./dto/order-status.dto";
import { RolesGuard } from "auth/guards/roles.guard";
import { UserRoleEnum } from "common/enums";
import { Roles } from "common/decorator";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createOrder(@Body() body: CreateOrderDto, @Req() req: any) {
    const userId = req?.user?.id.toString();
    return this.orderService.createOrder(body, userId);
  }

  @Post("from-cart")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createOrderFromCart(@Body() body: CreateOrderFromCartDto, @Req() req: any) {
    const userId = req?.user?.id.toString();
    return this.orderService.createOrderFromCart(body, userId);
  }

  @Get("user")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAllUserOrder(@Req() req: any, @Query() query?: FilterOrderDto) {
    const userId = req?.user?.id.toString();
    return this.orderService.findUserOrders(userId, query);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findOneUserOrder(@Req() req: any, @Param("id") orderId: string) {
    const userId = req?.user?.id.toString();

    return this.orderService.findOneOrder(orderId, userId);
  }
  @Get("business-man-vs/:businessId")
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async findOneBusinessOrder(
    @Param("businessId") businessId: string,
    @Query() query?: FilterOrderDto
  ) {
    return this.orderService.findBusinessOrders(businessId, query);
  }

  @Post(":orderId/change-status")
  @UseGuards(JwtAuthGuard)
  async changeOrderStatus(
    @Param("orderId") orderId: string,
    @Body() body: OrderStatusDto,
    @Req() req
  ) {
    const userId = req?.user?.id.toString();
    return this.orderService.changeOrderStatus(orderId, userId, body.status);
  }
}
