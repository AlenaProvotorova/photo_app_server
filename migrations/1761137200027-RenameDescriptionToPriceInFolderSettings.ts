import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDescriptionToPriceInFolderSettings1761137200027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Переименовываем поле description в price для всех полей настроек
        // showSelectAllDigital
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "showSelectAllDigital" = jsonb_set(
                "showSelectAllDigital" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "showSelectAllDigital" IS NOT NULL
        `);

        // photoOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoOne" = jsonb_set(
                "photoOne" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "photoOne" IS NOT NULL
        `);

        // photoTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoTwo" = jsonb_set(
                "photoTwo" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "photoTwo" IS NOT NULL
        `);

        // photoThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoThree" = jsonb_set(
                "photoThree" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "photoThree" IS NOT NULL
        `);

        // sizeOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeOne" = jsonb_set(
                "sizeOne" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "sizeOne" IS NOT NULL
        `);

        // sizeTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeTwo" = jsonb_set(
                "sizeTwo" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "sizeTwo" IS NOT NULL
        `);

        // sizeThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeThree" = jsonb_set(
                "sizeThree" - 'description',
                '{price}',
                '0'::jsonb
            )
            WHERE "sizeThree" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Возвращаем поле price обратно в description
        // showSelectAllDigital
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "showSelectAllDigital" = jsonb_set(
                "showSelectAllDigital" - 'price',
                '{description}',
                '"Позволяет выбрать все фотографии в цифровом формате"'::jsonb
            )
            WHERE "showSelectAllDigital" IS NOT NULL
        `);

        // photoOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoOne" = jsonb_set(
                "photoOne" - 'price',
                '{description}',
                '"Первая фотография для заказа"'::jsonb
            )
            WHERE "photoOne" IS NOT NULL
        `);

        // photoTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoTwo" = jsonb_set(
                "photoTwo" - 'price',
                '{description}',
                '"Вторая фотография для заказа"'::jsonb
            )
            WHERE "photoTwo" IS NOT NULL
        `);

        // photoThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "photoThree" = jsonb_set(
                "photoThree" - 'price',
                '{description}',
                '"Третья фотография для заказа"'::jsonb
            )
            WHERE "photoThree" IS NOT NULL
        `);

        // sizeOne
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeOne" = jsonb_set(
                "sizeOne" - 'price',
                '{description}',
                '"Размер фотографии 10x15 см"'::jsonb
            )
            WHERE "sizeOne" IS NOT NULL
        `);

        // sizeTwo
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeTwo" = jsonb_set(
                "sizeTwo" - 'price',
                '{description}',
                '"Размер фотографии 15x20 см"'::jsonb
            )
            WHERE "sizeTwo" IS NOT NULL
        `);

        // sizeThree
        await queryRunner.query(`
            UPDATE folder_settings 
            SET "sizeThree" = jsonb_set(
                "sizeThree" - 'price',
                '{description}',
                '"Размер фотографии 20x30 см"'::jsonb
            )
            WHERE "sizeThree" IS NOT NULL
        `);
    }

}
