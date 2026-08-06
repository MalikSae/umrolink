import { PartialType } from '@nestjs/mapped-types';
import { CreatePackageDto } from './create-package.dto';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PackageStatus } from '@prisma/client';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
