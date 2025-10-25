import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateSelectToToFolderSettings1761241391821 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder_settings" 
            ADD COLUMN "dateSelectTo" TIMESTAMP NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "dateSelectTo" = (
                SELECT f."createdAt" + INTERVAL '14 days'
                FROM folders f 
                WHERE f.id = folder_settings."folderId"
            )
            WHERE "dateSelectTo" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder_settings" 
            DROP COLUMN "dateSelectTo"
        `);
    }

}
