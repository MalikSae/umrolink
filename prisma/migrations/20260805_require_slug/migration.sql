-- AlterTable
ALTER TABLE `Package` MODIFY `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Package_tenantId_slug_key` ON `Package`(`tenantId`, `slug`);
