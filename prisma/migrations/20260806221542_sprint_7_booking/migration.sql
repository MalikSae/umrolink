/*
  Warnings:

  - You are about to alter the column `status` on the `lead` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(3))`.
  - Added the required column `departureId` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `lead` ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `departureId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `package` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tenant` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `ctaLabel` VARCHAR(191) NOT NULL DEFAULT 'Lihat Selengkapnya',
    `packageId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_departureId_fkey` FOREIGN KEY (`departureId`) REFERENCES `PackageDeparture`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
