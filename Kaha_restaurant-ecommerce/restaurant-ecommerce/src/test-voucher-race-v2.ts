import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrderService } from './modules/order/order.service';
import { DataSource, In } from 'typeorm';
import { VoucherEntity, VoucherStatus, VoucherDiscountType } from 'entities/voucher.entity';
import { MenuEntity } from 'entities/menu.entity';
import { MenuVariantEntity } from 'entities/menu-variant.entity';
import { OrderEntity } from 'entities/order.entity';
import { OrderItemEntity } from 'entities/orderitem.entity';
import { OrderItemAddonEntity } from 'entities/orderitem-addons.entity';
import { OrderStatusEntity } from 'entities/order.status.entity';
import { ServiceTypeEnum } from './common/enums/service-type.enum';
import { PaymentMethodEnum } from './common/enums/payment-method.enum';
import { VoucherRedemptionLogEntity } from 'entities/voucher-redemption-log.entity';

async function cleanup(dataSource: DataSource, testUserId: string, voucherCode: string) {
  const orderRepo = dataSource.getRepository(OrderEntity);
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const itemRepo = dataSource.getRepository(OrderItemEntity);
  const addonRepo = dataSource.getRepository(OrderItemAddonEntity);
  const statusRepo = dataSource.getRepository(OrderStatusEntity);
  const logRepo = dataSource.getRepository(VoucherRedemptionLogEntity);

  const orders = await orderRepo.find({ where: { userId: testUserId } });
  const orderIds = orders.map(o => o.id);
  
  if (orderIds.length > 0) {
    const items = await itemRepo.find({ where: { order: { id: In(orderIds) } } });
    const itemIds = items.map(i => i.id);
    
    if (itemIds.length > 0) {
      await addonRepo.delete({ orderItem: { id: In(itemIds) } });
      await itemRepo.delete({ id: In(itemIds) });
    }
    await statusRepo.delete({ order: { id: In(orderIds) } });
    await orderRepo.delete({ id: In(orderIds) });
  }

  await voucherRepo.delete({ code: voucherCode });
  await logRepo.delete({ userId: testUserId });
}

async function runTest() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const orderService = app.get(OrderService);
  
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const menuRepo = dataSource.getRepository(MenuEntity);
  const variantRepo = dataSource.getRepository(MenuVariantEntity);
  const orderRepo = dataSource.getRepository(OrderEntity);

  const testUserId = 'test-user-concurrency-123';
  const testBusinessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';
  const voucherCode = 'TESTCONCURRENCY';

  // 1. Find a menu item and variant to create an order
  const menu = await menuRepo.findOne({ where: { businessId: testBusinessId } });
  if (!menu) {
    console.error('No menu item found. Run seed first.');
    await app.close();
    process.exit(1);
  }
  const variant = await variantRepo.findOne({ where: { menu: { id: menu.id } } });
  if (!variant) {
    console.error('No menu variant found. Run seed first.');
    await app.close();
    process.exit(1);
  }

  const orderPayload = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DINE_IN,
    tableNumber: '1',
    remarks: 'Concurrency Test',
    paymentMethod: PaymentMethodEnum.CASH,
    serviceCharge: 0,
    tipAmount: 0,
    voucherCode: voucherCode,
    orderItems: [
      {
        menuId: menu.id,
        menuVariantId: variant.id,
        quantity: 1,
        itemAddons: [],
      },
    ],
  };

  // ==========================================
  // CASE 1: Single-use voucher, 2 concurrent checkouts
  // ==========================================
  console.log('\n--- CASE 1: Single-use voucher (maxUses = 1) ---');
  await cleanup(dataSource, testUserId, voucherCode);

  const voucher1 = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: voucherCode,
    discountAmount: 10,
    discountType: VoucherDiscountType.FIXED,
    discountValue: 10,
    maxUses: 1,
    usageCount: 0,
    maxUsesPerUser: 1,
    isActive: true,
    pointsUsed: 10,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await voucherRepo.save(voucher1);
  console.log('Single-use voucher created.');

  const results1 = await Promise.allSettled([
    orderService.createOrder(orderPayload, testUserId),
    orderService.createOrder(orderPayload, testUserId),
  ]);

  results1.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      console.log(`Call ${index + 1}: Success - Order ID: ${res.value.orderId}`);
    } else {
      console.log(`Call ${index + 1}: Failed - Reason: ${res.reason.message}`);
    }
  });

  // Query DB for any orders created for this test user
  const createdOrders = await orderRepo.find({ where: { userId: testUserId } });
  console.log(`\nDatabase check: Found ${createdOrders.length} order(s) for user ${testUserId}:`);
  createdOrders.forEach(o => {
    console.log(`  - Order ID: ${o.id}, Order Number: ${o.orderNumber}, discountAmount: ${o.discountAmount}, totalAmount: ${o.totalAmount}`);
  });

  const updatedVoucher1 = await voucherRepo.findOne({ where: { code: voucherCode } });
  console.log('Final Voucher status:', updatedVoucher1?.status);
  console.log('Final Voucher usageCount:', updatedVoucher1?.usageCount);


  // ==========================================
  // CASE 2: Multi-use voucher, 5 concurrent checkouts
  // ==========================================
  console.log('\n--- CASE 2: Multi-use voucher (maxUses = 3) ---');
  // We do NOT call cleanup here so we don't delete Case 1 logs yet, but we will clean the order/voucher.
  // Wait, let's just cleanup orders and voucher, but NOT logRepo records.
  const orders = await orderRepo.find({ where: { userId: testUserId } });
  const orderIds = orders.map(o => o.id);
  if (orderIds.length > 0) {
    const items = await dataSource.getRepository(OrderItemEntity).find({ where: { order: { id: In(orderIds) } } });
    const itemIds = items.map(i => i.id);
    if (itemIds.length > 0) {
      await dataSource.getRepository(OrderItemAddonEntity).delete({ orderItem: { id: In(itemIds) } });
      await dataSource.getRepository(OrderItemEntity).delete({ id: In(itemIds) });
    }
    await dataSource.getRepository(OrderStatusEntity).delete({ order: { id: In(orderIds) } });
    await orderRepo.delete({ id: In(orderIds) });
  }
  await voucherRepo.delete({ code: voucherCode });

  const voucher2 = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: voucherCode,
    discountAmount: 10,
    discountType: VoucherDiscountType.FIXED,
    discountValue: 10,
    maxUses: 3,
    usageCount: 0,
    maxUsesPerUser: 3,
    isActive: true,
    pointsUsed: 10,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await voucherRepo.save(voucher2);
  console.log('Multi-use voucher created.');

  const results2 = await Promise.allSettled([
    orderService.createOrder(orderPayload, testUserId),
    orderService.createOrder(orderPayload, testUserId),
    orderService.createOrder(orderPayload, testUserId),
    orderService.createOrder(orderPayload, testUserId),
    orderService.createOrder(orderPayload, testUserId),
  ]);

  results2.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      console.log(`Call ${index + 1}: Success - Order ID: ${res.value.orderId}`);
    } else {
      console.log(`Call ${index + 1}: Failed - Reason: ${res.reason.message}`);
    }
  });

  const createdOrders2 = await orderRepo.find({ where: { userId: testUserId } });
  console.log(`\nDatabase check: Found ${createdOrders2.length} order(s) for user ${testUserId}:`);
  createdOrders2.forEach(o => {
    console.log(`  - Order ID: ${o.id}, Order Number: ${o.orderNumber}, discountAmount: ${o.discountAmount}, totalAmount: ${o.totalAmount}`);
  });

  const updatedVoucher2 = await voucherRepo.findOne({ where: { code: voucherCode } });
  console.log('Final Voucher status:', updatedVoucher2?.status);
  console.log('Final Voucher usageCount:', updatedVoucher2?.usageCount);

  // Clean up order/voucher at the end, but leave log table queries for the runner
  const finalOrders = await orderRepo.find({ where: { userId: testUserId } });
  const finalOrderIds = finalOrders.map(o => o.id);
  if (finalOrderIds.length > 0) {
    const items = await dataSource.getRepository(OrderItemEntity).find({ where: { order: { id: In(finalOrderIds) } } });
    const itemIds = items.map(i => i.id);
    if (itemIds.length > 0) {
      await dataSource.getRepository(OrderItemAddonEntity).delete({ orderItem: { id: In(itemIds) } });
      await dataSource.getRepository(OrderItemEntity).delete({ id: In(itemIds) });
    }
    await dataSource.getRepository(OrderStatusEntity).delete({ order: { id: In(finalOrderIds) } });
    await orderRepo.delete({ id: In(finalOrderIds) });
  }
  await voucherRepo.delete({ code: voucherCode });

  await app.close();
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
