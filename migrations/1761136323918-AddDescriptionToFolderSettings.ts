import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToFolderSettings1761136323918 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Обновляем поле showSelectAllDigital
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "showSelectAllDigital" = jsonb_set(
                jsonb_set(
                    "showSelectAllDigital", 
                    '{description}', 
                    '"Позволяет выбрать все фотографии в цифровом формате"'
                ),
                '{show}', 
                COALESCE(("showSelectAllDigital"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "showSelectAllDigital" IS NOT NULL
        `);

        // Обновляем поле photoOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoOne" = jsonb_set(
                jsonb_set(
                    "photoOne", 
                    '{description}', 
                    '"Первая фотография для заказа"'
                ),
                '{show}', 
                COALESCE(("photoOne"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "photoOne" IS NOT NULL
        `);

        // Обновляем поле photoTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoTwo" = jsonb_set(
                jsonb_set(
                    "photoTwo", 
                    '{description}', 
                    '"Вторая фотография для заказа"'
                ),
                '{show}', 
                COALESCE(("photoTwo"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "photoTwo" IS NOT NULL
        `);

        // Обновляем поле photoThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoThree" = jsonb_set(
                jsonb_set(
                    "photoThree", 
                    '{description}', 
                    '"Третья фотография для заказа"'
                ),
                '{show}', 
                COALESCE(("photoThree"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "photoThree" IS NOT NULL
        `);

        // Обновляем поле sizeOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeOne" = jsonb_set(
                jsonb_set(
                    "sizeOne", 
                    '{description}', 
                    '"Размер фотографии 10x15 см"'
                ),
                '{show}', 
                COALESCE(("sizeOne"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "sizeOne" IS NOT NULL
        `);

        // Обновляем поле sizeTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeTwo" = jsonb_set(
                jsonb_set(
                    "sizeTwo", 
                    '{description}', 
                    '"Размер фотографии 15x20 см"'
                ),
                '{show}', 
                COALESCE(("sizeTwo"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "sizeTwo" IS NOT NULL
        `);

        // Обновляем поле sizeThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeThree" = jsonb_set(
                jsonb_set(
                    "sizeThree", 
                    '{description}', 
                    '"Размер фотографии 20x30 см"'
                ),
                '{show}', 
                COALESCE(("sizeThree"->>'show')::boolean, false)::text::jsonb
            )
            WHERE "sizeThree" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем поле description из всех полей
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "showSelectAllDigital" = "showSelectAllDigital" - 'description'
            WHERE "showSelectAllDigital" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoOne" = "photoOne" - 'description'
            WHERE "photoOne" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoTwo" = "photoTwo" - 'description'
            WHERE "photoTwo" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoThree" = "photoThree" - 'description'
            WHERE "photoThree" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeOne" = "sizeOne" - 'description'
            WHERE "sizeOne" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeTwo" = "sizeTwo" - 'description'
            WHERE "sizeTwo" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeThree" = "sizeThree" - 'description'
            WHERE "sizeThree" IS NOT NULL
        `);
    }

}
