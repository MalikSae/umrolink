-- AlterTable
ALTER TABLE `package` ADD COLUMN `agentCommission` INTEGER NULL,
    ADD COLUMN `airline` VARCHAR(191) NULL,
    ADD COLUMN `exclude` TEXT NULL,
    ADD COLUMN `hotelMadinah` VARCHAR(191) NULL,
    ADD COLUMN `hotelMakkah` VARCHAR(191) NULL,
    ADD COLUMN `include` TEXT NULL;

-- CreateTable
CREATE TABLE `PackageDeparture` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `departureDate` DATETIME(3) NOT NULL,
    `quota` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PackageDeparture` ADD CONSTRAINT `PackageDeparture_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackageDeparture` ADD CONSTRAINT `PackageDeparture_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
