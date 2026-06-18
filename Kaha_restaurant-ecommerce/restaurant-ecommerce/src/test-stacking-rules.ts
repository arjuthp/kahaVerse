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

async function cleanup(dataSource: DataSource, testUserId: string) {
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

  await voucherRepo.delete({ code: In(['STACK-ORD10', 'STACK-DEL50', 'STACK-ORD20']) });
  await logRepo.delete({ userId: testUserId });
  await campaignRepo.delete({ name: In(['Test Stacking Campaign 1', 'Test Stacking Campaign 2', 'Test Stacking Campaign 3']) });
}

async function runTest() {
  console.log('Bootstrapping NestJS application for stacking test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const orderService = app.get(OrderService);
  
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const campaignRepo = dataSource.getRepository(VoucherCampaignEntity);
  const logRepo = dataSource.getRepository(VoucherRedemptionLogEntity);
  const menuRepo = dataSource.getRepository(MenuEntity);
  const variantRepo = dataSource.getRepository(MenuVariantEntity);
  const orderRepo = dataSource.getRepository(OrderEntity);

  const testUserId = 'test-user-stacking-888';
  const testBusinessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';

  // Cleanup before we start
  await cleanup(dataSource, testUserId);

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

  // Force variant price to make calculation simple: we'll have a subtotal of 500
  variant.price = 500;
  await variantRepo.save(variant);

  // 2. Create the campaigns
  // Campaign 1: ORDER_TOTAL (10% off)
  const campaign1 = campaignRepo.create({
    name: 'Test Stacking Campaign 1',
    status: VoucherCampaignStatus.ACTIVE,
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    maxRedemptionsTotal: 10,
    maxRedemptionsPerUser: 5,
    totalBudgetCap: 500,
    totalRedeemedAmount: 0,
    discountValue: 10,
  });
  await campaignRepo.save(campaign1);

  // Campaign 2: DELIVERY_FEE (flat NPR 50 off delivery)
  const campaign2 = campaignRepo.create({
    name: 'Test Stacking Campaign 2',
    status: VoucherCampaignStatus.ACTIVE,
    discountClass: VoucherDiscountClass.DELIVERY_FEE,
    maxRedemptionsTotal: 10,
    maxRedemptionsPerUser: 5,
    totalBudgetCap: 500,
    totalRedeemedAmount: 0,
    discountValue: 50,
  });
  await campaignRepo.save(campaign2);

  // Campaign 3: Another ORDER_TOTAL (20% off) for duplicate test
  const campaign3 = campaignRepo.create({
    name: 'Test Stacking Campaign 3',
    status: VoucherCampaignStatus.ACTIVE,
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    maxRedemptionsTotal: 10,
    maxRedemptionsPerUser: 5,
    totalBudgetCap: 500,
    totalRedeemedAmount: 0,
    discountValue: 20,
  });
  await campaignRepo.save(campaign3);

  console.log('Campaigns created.');

  // 3. Create the vouchers
  const voucher1 = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: 'STACK-ORD10',
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    discountAmount: 10,
    discountType: VoucherDiscountType.PERCENTAGE,
    discountValue: 10,
    maxUses: 5,
    usageCount: 0,
    maxUsesPerUser: 5,
    isActive: true,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    campaignId: campaign1.id,
    pointsUsed: 0,
  });
  await voucherRepo.save(voucher1);

  const voucher2 = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: 'STACK-DEL50',
    discountClass: VoucherDiscountClass.DELIVERY_FEE,
    discountAmount: 50,
    discountType: VoucherDiscountType.FIXED,
    discountValue: 50,
    maxUses: 5,
    usageCount: 0,
    maxUsesPerUser: 5,
    isActive: true,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    campaignId: campaign2.id,
    pointsUsed: 0,
  });
  await voucherRepo.save(voucher2);

  const voucher3 = voucherRepo.create({
    userId: testUserId,
    businessId: testBusinessId,
    code: 'STACK-ORD20',
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    discountAmount: 20,
    discountType: VoucherDiscountType.PERCENTAGE,
    discountValue: 20,
    maxUses: 5,
    usageCount: 0,
    maxUsesPerUser: 5,
    isActive: true,
    status: VoucherStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    campaignId: campaign3.id,
    pointsUsed: 0,
  });
  await voucherRepo.save(voucher3);

  console.log('Vouchers created.');

  // 4. Run Stacking Rejection Test
  console.log('\n--- 4. Stacking Rejection Test (Expected fail: DUPLICATE_DISCOUNT_CLASS:ORDER_TOTAL) ---');
  const payloadReject = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DELIVERY,
    tableNumber: '1',
    remarks: 'Stacking Reject Test',
    paymentMethod: PaymentMethodEnum.CASH,
    serviceCharge: 0,
    tipAmount: 0,
    voucherCodes: ['STACK-ORD10', 'STACK-ORD20'],
    orderItems: [
      {
        menuId: menu.id,
        menuVariantId: variant.id,
        quantity: 1,
        itemAddons: [],
      },
    ],
  };

  try {
    await orderService.createOrder(payloadReject, testUserId);
    console.error('Stacking Rejection Test failed: Expected error but order succeeded.');
  } catch (err) {
    console.log(`Stacking Rejection Test Succeeded (Rejected as expected) - Reason: ${err.message}`);
  }

  // Database verification for rejection
  const ordersCount = await orderRepo.count({ where: { userId: testUserId } });
  console.log(`Verified: Orders count in DB = ${ordersCount} (Expected: 0)`);
  const v1 = await voucherRepo.findOneBy({ id: voucher1.id });
  const v3 = await voucherRepo.findOneBy({ id: voucher3.id });
  console.log(`Verified: STACK-ORD10 usageCount = ${v1?.usageCount} (Expected: 0)`);
  console.log(`Verified: STACK-ORD20 usageCount = ${v3?.usageCount} (Expected: 0)`);


  // 5. Run New Stacking Test
  console.log('\n--- 5. New Stacking Test (Expected success: Both applied) ---');
  const payloadSuccess = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DELIVERY,
    tableNumber: '1',
    remarks: 'Stacking Success Test',
    paymentMethod: PaymentMethodEnum.CASH,
    serviceCharge: 0,
    tipAmount: 0,
    deliveryFee: 100, // Explicitly pass 100 to override default
    voucherCodes: ['STACK-ORD10', 'STACK-DEL50'],
    orderItems: [
      {
        menuId: menu.id,
        menuVariantId: variant.id,
        quantity: 1,
        itemAddons: [],
      },
    ],
  };

  try {
    const res = await orderService.createOrder(payloadSuccess, testUserId);
    console.log(`New Stacking Test checkout success! Order ID: ${res.orderId}`);
    
    // Database validations
    const orderObj = await orderRepo.findOne({ where: { id: res.orderId } });
    console.log('\nOrder details from DB:');
    console.log(`- subtotal: ${orderObj?.subtotal}`);
    console.log(`- deliveryFee: ${orderObj?.deliveryFee}`);
    console.log(`- orderDiscountAmount: ${orderObj?.orderDiscountAmount}`);
    console.log(`- deliveryDiscountAmount: ${orderObj?.deliveryDiscountAmount}`);
    console.log(`- discountAmount: ${orderObj?.discountAmount}`);
    console.log(`- totalAmount: ${orderObj?.totalAmount}`);
    console.log(`- appliedVoucherIds: ${JSON.stringify(orderObj?.appliedVoucherIds)}`);

    const v1After = await voucherRepo.findOneBy({ id: voucher1.id });
    const v2After = await voucherRepo.findOneBy({ id: voucher2.id });
    console.log(`\nVoucher redemptions check:`);
    console.log(`- STACK-ORD10 usageCount = ${v1After?.usageCount} (Expected: 1)`);
    console.log(`- STACK-DEL50 usageCount = ${v2After?.usageCount} (Expected: 1)`);

    const redemptions = await logRepo.find({ where: { userId: testUserId }, order: { createdAt: 'ASC' } });
    console.log(`\nRedemption Logs in DB (Success expected for the last two):`);
    redemptions.forEach(r => {
      console.log(`- code: ${r.attemptedCode}, result: ${r.result}, reason: ${r.rejectionReason}`);
    });

  } catch (err) {
    console.error('New Stacking Test failed:', err);
  }

  // Final Cleanup
  await cleanup(dataSource, testUserId);
  console.log('\nCleanup completed successfully.');

  await app.close();
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
