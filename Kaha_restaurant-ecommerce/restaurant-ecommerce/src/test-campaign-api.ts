import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoyaltyService } from './modules/loyalty/loyalty.service';
import { DataSource } from 'typeorm';
import { VoucherEntity } from 'entities/voucher.entity';
import { VoucherCampaignEntity } from 'entities/voucher-campaign.entity';
import { VoucherRedemptionLogEntity, VoucherRedemptionResult } from 'entities/voucher-redemption-log.entity';
import { VoucherDiscountClass, VoucherDiscountType } from 'entities/voucher.enums';
import { OrderService } from './modules/order/order.service';
import { MenuEntity } from 'entities/menu.entity';
import { MenuVariantEntity } from 'entities/menu-variant.entity';
import { ServiceTypeEnum } from './common/enums/service-type.enum';
import { PaymentMethodEnum } from './common/enums/payment-method.enum';
import { OrderEntity } from 'entities/order.entity';

async function runTest() {
  console.log('Bootstrapping NestJS for campaign API test...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const ds = app.get(DataSource);
  const loyaltyService = app.get(LoyaltyService);
  const orderService = app.get(OrderService);
  const campaignRepo = ds.getRepository(VoucherCampaignEntity);
  const voucherRepo = ds.getRepository(VoucherEntity);
  const redemptionLogRepo = ds.getRepository(VoucherRedemptionLogEntity);
  const orderRepo = ds.getRepository(OrderEntity);
  const menuRepo = ds.getRepository(MenuEntity);
  const variantRepo = ds.getRepository(MenuVariantEntity);

  const TEST_BIZ = '7476ee15-1407-41fa-9a49-89e0caaf945d';
  const TEST_USER = 'test-user-campaign-api-999';

  // Pre-cleanup — respect FK order: child → parent
  await redemptionLogRepo.delete({ userId: TEST_USER });
  await ds.query(`DELETE FROM order_item_addon_entity WHERE "orderItemId" IN (SELECT id FROM order_item_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1))`, [TEST_USER]);
  await ds.query(`DELETE FROM order_item_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1)`, [TEST_USER]);
  await ds.query(`DELETE FROM order_status_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1)`, [TEST_USER]);
  await orderRepo.delete({ userId: TEST_USER });
  await voucherRepo.delete({ userId: TEST_USER });
  await campaignRepo.delete({ name: 'API Test Campaign' });

  // ── a) Create a DRAFT campaign ──────────────────────────────
  console.log('\n── Step a) Create DRAFT campaign ──');
  const campaign = await loyaltyService.createCampaign({
    name: 'API Test Campaign',
    discountType: VoucherDiscountType.PERCENTAGE,
    discountValue: 15,
    discountClass: VoucherDiscountClass.ORDER_TOTAL,
    maxRedemptionsTotal: 100,
    maxRedemptionsPerUser: 5,
    totalBudgetCap: 5000,
  });
  console.log(`Campaign created: id=${campaign.id}, status=${campaign.status}`);

  // ── b) Activate the campaign ────────────────────────────────
  console.log('\n── Step b) Activate campaign ──');
  const activated = await loyaltyService.activateCampaign(campaign.id);
  console.log(`Campaign activated: status=${activated.status}`);

  // ── c) Award TWO vouchers while campaign is ACTIVE ──────────
  //   voucher1 → used in step e (live checkout while active)
  //   voucher2 → kept fresh, used in step h (checkout after pause)
  console.log('\n── Step c) Award two vouchers while campaign is ACTIVE ──');
  const voucher1 = await loyaltyService.awardVoucherToCustomer({
    userId: TEST_USER,
    businessId: TEST_BIZ,
    campaignId: campaign.id,
  });
  const voucher2 = await loyaltyService.awardVoucherToCustomer({
    userId: TEST_USER,
    businessId: TEST_BIZ,
    campaignId: campaign.id,
  });
  console.log(`Voucher1 (for step e): code=${voucher1.code}`);
  console.log(`Voucher2 (for step h): code=${voucher2.code}`);

  // ── d) Confirm both vouchers in DB ─────────────────────────
  console.log('\n── Step d) DB confirmation ──');
  const dbV1 = await voucherRepo.findOne({ where: { code: voucher1.code } });
  const dbV2 = await voucherRepo.findOne({ where: { code: voucher2.code } });
  console.log(`Voucher1 found: ${!!dbV1}, campaignId=${dbV1?.campaignId}`);
  console.log(`Voucher2 found: ${!!dbV2}, campaignId=${dbV2?.campaignId}`);

  // ── e) Checkout with voucher1 while campaign is ACTIVE ─────
  console.log('\n── Step e) Checkout with voucher1 (campaign ACTIVE) ──');
  const menu = await menuRepo.findOne({ where: { businessId: TEST_BIZ } });
  const variant = await variantRepo.findOne({ where: { menu: { id: menu.id } } });
  try {
    const order = await orderService.createOrder({
      businessId: TEST_BIZ,
      serviceType: ServiceTypeEnum.DELIVERY,
      paymentMethod: PaymentMethodEnum.CASH,
      serviceCharge: 0,
      tipAmount: 0,
      voucherCodes: [voucher1.code],
      orderItems: [{ menuId: menu.id, menuVariantId: variant.id, quantity: 1, itemAddons: [] }],
    }, TEST_USER);
    console.log(`Order created: id=${order.orderId}, discountAmount=${order.order.discountAmount}, orderDiscountAmount=${order.order.orderDiscountAmount}`);
  } catch (err) {
    console.error(`Checkout failed: ${err.message}`);
  }

  // ── f) Pause the campaign ───────────────────────────────────
  console.log('\n── Step f) Pause campaign ──');
  const paused = await loyaltyService.pauseCampaign(campaign.id);
  console.log(`Campaign paused: status=${paused.status}`);

  // ── g) Award new voucher from PAUSED campaign (should FAIL) ─
  console.log('\n── Step g) Award from paused campaign (expected fail) ──');
  try {
    await loyaltyService.awardVoucherToCustomer({
      userId: TEST_USER,
      businessId: TEST_BIZ,
      campaignId: campaign.id,
    });
    console.log('ERROR: Expected failure but succeeded');
  } catch (err) {
    console.log(`Correctly rejected: ${err.message}`);
  }

  // ── h) Checkout with voucher2 while campaign is PAUSED ──────
  // voucher2 was issued BEFORE the pause — it's still status=ACTIVE in the
  // vouchers table, but campaign.status=PAUSED now.
  // validateVoucherForCheckout checks campaign.status → must throw CAMPAIGN_NOT_ACTIVE.
  // The catch block in validateVoucherForCheckout writes a REJECTED log row.
  // The transaction in createOrder never commits → zero new orders.
  console.log('\n── Step h) Checkout with voucher2 after campaign PAUSED ──');
  console.log('   Expected: CAMPAIGN_NOT_ACTIVE rejection, 0 new orders, 1 REJECTED log row');

  const ordersBefore = await orderRepo.count({ where: { userId: TEST_USER } });

  try {
    await orderService.createOrder({
      businessId: TEST_BIZ,
      serviceType: ServiceTypeEnum.DELIVERY,
      paymentMethod: PaymentMethodEnum.CASH,
      serviceCharge: 0,
      tipAmount: 0,
      voucherCodes: [voucher2.code],
      orderItems: [{ menuId: menu.id, menuVariantId: variant.id, quantity: 1, itemAddons: [] }],
    }, TEST_USER);
    console.log('   ERROR: Expected CAMPAIGN_NOT_ACTIVE rejection but checkout succeeded ✗');
  } catch (err) {
    const reason: string = err?.message ?? '';
    if (reason.includes('CAMPAIGN_NOT_ACTIVE')) {
      console.log(`   Checkout rejected with: ${reason} ✓`);
    } else {
      console.log(`   Checkout rejected but unexpected reason: ${reason} ✗`);
    }
  }

  // Verify: no new order was created
  const ordersAfter = await orderRepo.count({ where: { userId: TEST_USER } });
  const newOrders = ordersAfter - ordersBefore;
  console.log(`   New orders created: ${newOrders} (Expected: 0)${newOrders === 0 ? ' ✓' : ' ✗'}`);

  // Verify: REJECTED log row with rejectionReason = 'CAMPAIGN_NOT_ACTIVE'
  const rejectedLog = await redemptionLogRepo.findOne({
    where: {
      attemptedCode: voucher2.code,
      userId: TEST_USER,
      result: VoucherRedemptionResult.REJECTED,
    },
    order: { createdAt: 'DESC' },
  });

  if (rejectedLog) {
    const reasonMatches = rejectedLog.rejectionReason === 'CAMPAIGN_NOT_ACTIVE';
    console.log(`   REJECTED log row found: ✓`);
    console.log(`     attemptedCode:   ${rejectedLog.attemptedCode}`);
    console.log(`     result:          ${rejectedLog.result}`);
    console.log(`     rejectionReason: ${rejectedLog.rejectionReason}${reasonMatches ? ' ✓' : ' ✗ (expected CAMPAIGN_NOT_ACTIVE)'}`);
  } else {
    console.log('   REJECTED log row NOT found in voucher_redemption_log ✗');
  }

  // Verify: voucher2 usageCount still 0 (not consumed by the rejected attempt)
  const freshV2 = await voucherRepo.findOne({ where: { code: voucher2.code } });
  console.log(`   Voucher2 usageCount: ${freshV2?.usageCount} (Expected: 0)${freshV2?.usageCount === 0 ? ' ✓' : ' ✗'}`);

  // Cleanup — respect FK order: child → parent
  await redemptionLogRepo.delete({ userId: TEST_USER });
  await ds.query(`DELETE FROM order_item_addon_entity WHERE "orderItemId" IN (SELECT id FROM order_item_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1))`, [TEST_USER]);
  await ds.query(`DELETE FROM order_item_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1)`, [TEST_USER]);
  await ds.query(`DELETE FROM order_status_entity WHERE "orderId" IN (SELECT id FROM order_entity WHERE "userId" = $1)`, [TEST_USER]);
  await orderRepo.delete({ userId: TEST_USER });
  await voucherRepo.delete({ userId: TEST_USER });
  await campaignRepo.delete({ id: campaign.id });
  console.log('\nCleanup done.');

  await app.close();
}

runTest().catch(err => { console.error(err); process.exit(1); });
