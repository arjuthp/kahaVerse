import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrderService } from './modules/order/order.service';
import { DataSource, In } from 'typeorm';
import { VoucherEntity, VoucherStatus, VoucherDiscountType } from 'entities/voucher.entity';
import { VoucherCampaignEntity } from 'entities/voucher-campaign.entity';
import { VoucherCampaignStatus, VoucherDiscountClass } from 'entities/voucher.enums';
import { VoucherRedemptionLogEntity, VoucherRedemptionResult } from 'entities/voucher-redemption-log.entity';
import { MenuEntity } from 'entities/menu.entity';
import { MenuVariantEntity } from 'entities/menu-variant.entity';
import { OrderEntity } from 'entities/order.entity';
import { OrderItemEntity } from 'entities/orderitem.entity';
import { OrderItemAddonEntity } from 'entities/orderitem-addons.entity';
import { OrderStatusEntity } from 'entities/order.status.entity';
import { ServiceTypeEnum } from './common/enums/service-type.enum';
import { PaymentMethodEnum } from './common/enums/payment-method.enum';
import { PaymentStatusEnum } from './common/enums/payment-status.enum';
import { OrderStatusEnum } from './common/enums/order.status.enum';

async function cleanup(dataSource: DataSource, testUserId: string, voucherCode: string) {
  const orderRepo = dataSource.getRepository(OrderEntity);
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const campaignRepo = dataSource.getRepository(VoucherCampaignEntity);
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
  await campaignRepo.delete({ name: 'Test Eligibility Campaign' });
}

async function runTest() {
  console.log('Bootstrapping NestJS application for eligibility test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const orderService = app.get(OrderService);
  
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const campaignRepo = dataSource.getRepository(VoucherCampaignEntity);
  const logRepo = dataSource.getRepository(VoucherRedemptionLogEntity);
  const menuRepo = dataSource.getRepository(MenuEntity);
  const variantRepo = dataSource.getRepository(MenuVariantEntity);
  const orderRepo = dataSource.getRepository(OrderEntity);
  const statusRepo = dataSource.getRepository(OrderStatusEntity);

  const testUserId = 'test-user-eligibility-777';
  const testBusinessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';
  const voucherCode = 'TESTELIGIBILITY';

  // Cleanup before we start
  await cleanup(dataSource, testUserId, voucherCode);

  // 1. Find a menu item and variant
  const menu = await menuRepo.findOne({ where: { businessId: testBusinessId } });
  if (!menu) {
    console.error('No menu item found.');
    await app.close();
    process.exit(1);
  }
  const variant = await variantRepo.findOne({ where: { menu: { id: menu.id } } });
  if (!variant) {
    console.error('No menu variant found.');
    await app.close();
    process.exit(1);
  }

  const orderPayloadDineIn = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DINE_IN,
    tableNumber: '1',
    remarks: 'Eligibility Test - Dine In',
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

  const orderPayloadDelivery = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DELIVERY,
    tableNumber: '1',
    remarks: 'Eligibility Test - Delivery',
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

  // 2. Create the campaign with eligibility rules
  const campaign = campaignRepo.create({
    name: 'Test Eligibility Campaign',
    status: VoucherCampaignStatus.ACTIVE,
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    maxRedemptionsTotal: 10,
    maxRedemptionsPerUser: 5,
    totalBudgetCap: 500,
    totalRedeemedAmount: 0,
    discountValue: 15,
    applicableServiceTypes: ['DELIVERY'],
    requiresFirstOrder: true,
    validDaysOfWeek: [new Date().getDay()],
    validTimeStart: '00:00:00',
    validTimeEnd: '23:59:00',
  });
  await campaignRepo.save(campaign);
  console.log('Campaign created.');

  // 3. Create the voucher linked to the campaign
  const voucher = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: voucherCode,
    discountAmount: 15,
    discountType: VoucherDiscountType.FIXED,
    discountValue: 15,
    maxUses: 5,
    usageCount: 0,
    maxUsesPerUser: 5,
    isActive: true,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    campaignId: campaign.id,
    pointsUsed: 0,
  });
  await voucherRepo.save(voucher);
  console.log('Voucher created.');

  // 4. Executing checkout attempts
  console.log('\n--- Attempt A: serviceType = DINE_IN (Expected fail: SERVICE_TYPE_NOT_ELIGIBLE) ---');
  try {
    const resA = await orderService.createOrder(orderPayloadDineIn, testUserId);
    console.log(`Attempt A Success - Order ID: ${resA.orderId}`);
  } catch (err) {
    console.log(`Attempt A Failed (Expected) - Reason: ${err.message}`);
  }

  // Check logs after Attempt A
  let logs = await logRepo.find({ where: { userId: testUserId }, order: { createdAt: 'ASC' } });
  console.log(`Logs after Attempt A: ${logs.length}`);
  logs.forEach(l => {
    console.log(`  - result: ${l.result}, reason: ${l.rejectionReason}`);
  });

  console.log('\n--- Attempt B: serviceType = DELIVERY but has prior order (Expected fail: FIRST_ORDER_ONLY) ---');
  // Create a prior order to trigger requiresFirstOrder limit
  const priorOrder = orderRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    orderNumber: `PRIOR-ORD-${Date.now()}`,
    serviceType: ServiceTypeEnum.DELIVERY,
    subtotal: 100,
    taxAmount: 13,
    deliveryFee: 5,
    totalAmount: 118,
    paymentStatus: PaymentStatusEnum.UNPAID,
  });
  await orderRepo.save(priorOrder);

  const statusEntry = statusRepo.create({
    order: priorOrder,
    status: OrderStatusEnum.PENDING,
    updatedBy: 'system',
  });
  await statusRepo.save(statusEntry);
  console.log('Prior order created.');

  try {
    const resB = await orderService.createOrder(orderPayloadDelivery, testUserId);
    console.log(`Attempt B Success - Order ID: ${resB.orderId}`);
  } catch (err) {
    console.log(`Attempt B Failed (Expected) - Reason: ${err.message}`);
  }

  // Check logs after Attempt B
  logs = await logRepo.find({ where: { userId: testUserId }, order: { createdAt: 'ASC' } });
  console.log(`Logs after Attempt B: ${logs.length}`);
  logs.forEach(l => {
    console.log(`  - result: ${l.result}, reason: ${l.rejectionReason}`);
  });

  console.log('\n--- Attempt C: serviceType = DELIVERY and user has no prior order (Expected success) ---');
  // Remove the prior order to clear the first order restriction
  await statusRepo.delete({ order: { id: priorOrder.id } });
  await orderRepo.delete({ id: priorOrder.id });
  console.log('Prior order removed.');

  try {
    const resC = await orderService.createOrder(orderPayloadDelivery, testUserId);
    console.log(`Attempt C Success - Order ID: ${resC.orderId}`);
  } catch (err) {
    console.log(`Attempt C Failed - Reason: ${err.message}`);
  }

  // Check logs after Attempt C
  logs = await logRepo.find({ where: { userId: testUserId }, order: { createdAt: 'ASC' } });
  console.log(`Final Logs count: ${logs.length}`);
  logs.forEach(l => {
    console.log(`  - result: ${l.result}, reason: ${l.rejectionReason}`);
  });

  // Cleanup after test
  await cleanup(dataSource, testUserId, voucherCode);
  console.log('\nCleanup completed successfully.');

  await app.close();
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
