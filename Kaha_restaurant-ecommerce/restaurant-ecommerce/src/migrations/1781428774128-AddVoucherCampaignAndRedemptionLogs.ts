import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVoucherCampaignAndRedemptionLogs1781428774128 implements MigrationInterface {
    name = 'AddVoucherCampaignAndRedemptionLogs1781428774128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "voucher_campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" character varying, "name" character varying NOT NULL, "code" character varying, "codePattern" character varying, "discountType" "public"."voucher_campaign_discounttype_enum" NOT NULL DEFAULT 'FIXED', "discountValue" numeric(10,2) NOT NULL, "maxDiscountAmount" numeric(10,2), "minOrderAmount" numeric(10,2), "discountClass" "public"."voucher_campaign_discountclass_enum" NOT NULL DEFAULT 'ORDER_TOTAL', "applicableServiceTypes" character varying array, "applicableCategoryIds" character varying array, "applicableMenuItemIds" character varying array, "requiresFirstOrder" boolean NOT NULL DEFAULT false, "applicableOrderSequence" integer array, "validDaysOfWeek" integer array, "validTimeStart" TIME, "validTimeEnd" TIME, "maxRedemptionsTotal" integer, "maxRedemptionsPerUser" integer, "maxRedemptionsPerUserPerDay" integer, "totalBudgetCap" numeric(10,2), "totalRedeemedAmount" numeric(10,2) NOT NULL DEFAULT '0', "stackPriority" integer NOT NULL DEFAULT '0', "combinesWith" character varying array, "startsAt" TIMESTAMP, "expiresAt" TIMESTAMP, "status" "public"."voucher_campaign_status_enum" NOT NULL DEFAULT 'draft', "createdBy" character varying, CONSTRAINT "UQ_12af864a25e6caa7d3862d6bb65" UNIQUE ("code"), CONSTRAINT "PK_b4c325de50d3424c99e7c769d8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "voucher_redemption_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "voucherId" character varying, "campaignId" character varying, "userId" character varying NOT NULL, "businessId" character varying NOT NULL, "orderId" character varying, "attemptedCode" character varying NOT NULL, "result" "public"."voucher_redemption_log_result_enum" NOT NULL, "rejectionReason" character varying, "discountAmountApplied" numeric(10,2), CONSTRAINT "PK_de932f146e5a3fa11ab71b44d23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "campaignId" uuid`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "discountClass" "public"."vouchers_discountclass_enum" NOT NULL DEFAULT 'ORDER_TOTAL'`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "applicableServiceTypes" character varying array`);
        await queryRunner.query(`ALTER TABLE "order_entity" ADD "orderDiscountAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_entity" ADD "deliveryDiscountAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_entity" ADD "serviceChargeDiscountAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_entity" ADD "itemDiscountAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_entity" ADD "appliedVoucherIds" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsPerNpr" SET DEFAULT '0.1'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsToNprRate" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD CONSTRAINT "FK_5aab221bf16e6fb2e22689f4f88" FOREIGN KEY ("campaignId") REFERENCES "voucher_campaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" DROP CONSTRAINT "FK_5aab221bf16e6fb2e22689f4f88"`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsToNprRate" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsPerNpr" SET DEFAULT 0.1`);
        await queryRunner.query(`ALTER TABLE "order_entity" DROP COLUMN "appliedVoucherIds"`);
        await queryRunner.query(`ALTER TABLE "order_entity" DROP COLUMN "itemDiscountAmount"`);
        await queryRunner.query(`ALTER TABLE "order_entity" DROP COLUMN "serviceChargeDiscountAmount"`);
        await queryRunner.query(`ALTER TABLE "order_entity" DROP COLUMN "deliveryDiscountAmount"`);
        await queryRunner.query(`ALTER TABLE "order_entity" DROP COLUMN "orderDiscountAmount"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "applicableServiceTypes"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "discountClass"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "campaignId"`);
        await queryRunner.query(`DROP TABLE "voucher_redemption_log"`);
        await queryRunner.query(`DROP TABLE "voucher_campaign"`);
    }

}
