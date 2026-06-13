import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780830701158 implements MigrationInterface {
    name = 'InitialSchema1780830701158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsPerNpr" SET DEFAULT '0.1'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsToNprRate" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsToNprRate" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "pointsPerNpr" SET DEFAULT 0.1`);
    }

}
