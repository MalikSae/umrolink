-- AlterTable
ALTER TABLE `package` ADD COLUMN `slug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tenant` ADD COLUMN `brandAccentColor` VARCHAR(191) NULL,
    ADD COLUMN `brandPrimaryColor` VARCHAR(191) NULL,
    ADD COLUMN `brandSecondaryColor` VARCHAR(191) NULL;
