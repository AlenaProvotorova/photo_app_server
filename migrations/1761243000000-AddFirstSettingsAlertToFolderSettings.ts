import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirstSettingsAlertToFolderSettings1761243000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder_settings" 
            ADD COLUMN "firstSettingsAlert" BOOLEAN NOT NULL DEFAULT FALSE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder_settings" 
            DROP COLUMN "firstSettingsAlert"
        `);
    }

}

