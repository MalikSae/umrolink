import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Controller('packages')
@Roles('travel_admin')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.create(createPackageDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.packagesService.findAll({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.packagesService.publish(id);
  }

  @Patch(':id/featured')
  toggleFeatured(@Param('id') id: string, @Body('featured') featured: boolean) {
    return this.packagesService.toggleFeatured(id, featured);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }

  @Post(':id/featured-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipe file tidak didukung (${file.mimetype}). Hanya JPEG, PNG, dan WebP yang diizinkan.`,
            ),
            false,
          );
        }
      },
    }),
  )
  uploadFeaturedImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Tidak ada file yang dikirim.');
    }
    return this.packagesService.uploadFeaturedImage(id, file);
  }

  @Post('temp-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipe file tidak didukung (${file.mimetype}). Hanya JPEG, PNG, dan WebP yang diizinkan.`,
            ),
            false,
          );
        }
      },
    }),
  )
  uploadTempImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Tidak ada file yang dikirim.');
    }
    return this.packagesService.uploadTempImage(file);
  }
}
