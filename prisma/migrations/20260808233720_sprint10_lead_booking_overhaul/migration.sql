-- DropForeignKey
ALTER TABLE `lead` DROP FOREIGN KEY `Lead_departureId_fkey`;

-- DropIndex
DROP INDEX `Lead_departureId_fkey` ON `lead`;

-- AlterTable
ALTER TABLE `lead` ADD COLUMN `bookingNumber` VARCHAR(191) NULL,
    ADD COLUMN `minDpAmount` INTEGER NULL,
    ADD COLUMN `paymentStatus` ENUM('unpaid', 'dp_received', 'paid_full') NOT NULL DEFAULT 'unpaid',
    ADD COLUMN `totalAmount` INTEGER NULL,
    ADD COLUMN `totalJamaah` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `type` ENUM('prospek', 'booking') NOT NULL DEFAULT 'booking',
    MODIFY `departureId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tenant` ADD COLUMN `bankAccountName` VARCHAR(191) NULL,
    ADD COLUMN `bankAccountNo` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `bookingCodeSeq` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `minDpPerJamaah` INTEGER NULL;

-- CreateTable
CREATE TABLE `LeadRoomAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `roomType` VARCHAR(191) NOT NULL,
    `jumlahOrang` INTEGER NOT NULL,
    `hargaSatuan` INTEGER NOT NULL,
    `subtotal` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Lead_bookingNumber_key` ON `Lead`(`bookingNumber`);

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_departureId_fkey` FOREIGN KEY (`departureId`) REFERENCES `PackageDeparture`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadRoomAllocation` ADD CONSTRAINT `LeadRoomAllocation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadRoomAllocation` ADD CONSTRAINT `LeadRoomAllocation_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
