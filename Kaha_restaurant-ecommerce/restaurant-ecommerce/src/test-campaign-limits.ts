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
  await campaignRepo.delete({ name: 'Test Campaign Limits' });
}

async function runTest() {
  console.log('Bootstrapping NestJS application for campaign limits test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const orderService = app.get(OrderService);
  
  const voucherRepo = dataSource.getRepository(VoucherEntity);
  const campaignRepo = dataSource.getRepository(VoucherCampaignEntity);
  const logRepo = dataSource.getRepository(VoucherRedemptionLogEntity);
  const menuRepo = dataSource.getRepository(MenuEntity);
  const variantRepo = dataSource.getRepository(MenuVariantEntity);

  const testUserId = 'test-user-campaign-limits-999';
  const testBusinessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';
  const voucherCode = 'TESTCAMPAIGNLIMITS';

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

  const orderPayload = {
    businessId: testBusinessId,
    serviceType: ServiceTypeEnum.DINE_IN,
    tableNumber: '1',
    remarks: 'Campaign Limit Test',
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

  // 2. Create the campaign
  const campaign = campaignRepo.create({
    name: 'Test Campaign Limits',
    status: VoucherCampaignStatus.ACTIVE,
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    maxRedemptionsTotal: 10,
    maxRedemptionsPerUser: 2,
    totalBudgetCap: 100,
    totalRedeemedAmount: 0,
    discountValue: 15,
  });
  await campaignRepo.save(campaign);
  console.log('Campaign created.');

  // 3. Create the voucher
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
  console.log('Campaign-linked voucher created.');

  // 4. Executing checkout attempts
  console.log('\n--- Attempt 1 ---');
  try {
    const res1 = await orderService.createOrder(orderPayload, testUserId);
    console.log(`Attempt 1 Success - Order ID: ${res1.orderId}`);
  } catch (err) {
    console.error(`Attempt 1 Failed: ${err.message}`);
  }

  console.log('\n--- Attempt 2 ---');
  try {
    const res2 = await orderService.createOrder(orderPayload, testUserId);
    console.log(`Attempt 2 Success - Order ID: ${res2.orderId}`);
  } catch (err) {
    console.error(`Attempt 2 Failed: ${err.message}`);
  }

  console.log('\n--- Attempt 3 ---');
  try {
    const res3 = await orderService.createOrder(orderPayload, testUserId);
    console.log(`Attempt 3 Success - Order ID: ${res3.orderId}`);
  } catch (err) {
    console.log(`Attempt 3 Failed (Expected) - Reason: ${err.message}`);
  }

  // 5. Query redemption logs
  console.log('\n--- Querying redemption logs for test user ---');
  const logs = await logRepo.find({ where: { userId: testUserId }, order: { createdAt: 'ASC' } });
  console.log(`Found ${logs.length} redemption logs:`);
  logs.forEach(l => {
    console.log(`  - Log ID: ${l.id}, result: ${l.result}, discount: ${l.discountAmountApplied}, reason: ${l.rejectionReason}, campaignId: ${l.campaignId}`);
  });

  // 6. Check campaign totalRedeemedAmount
  const updatedCampaign = await campaignRepo.findOne({ where: { id: campaign.id } });
  console.log(`\nCampaign totalRedeemedAmount: ${updatedCampaign?.totalRedeemedAmount}`);

  // Cleanup after test
  await cleanup(dataSource, testUserId, voucherCode);
  console.log('Cleanup completed successfully.');

  await app.close();
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
