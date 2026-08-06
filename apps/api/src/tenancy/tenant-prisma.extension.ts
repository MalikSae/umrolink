import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { BadRequestException } from '@nestjs/common';

const TENANT_SCOPED_MODELS = ['user', 'package', 'packageDeparture', 'agentProfile', 'lead', 'banner'];

export function createTenantPrismaExtension(cls: ClsService) {
  return (prisma: PrismaClient) => {
    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!TENANT_SCOPED_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1)) && !TENANT_SCOPED_MODELS.includes(model)) {
              return query(args);
            }

            const tenantId = cls.get('tenantId');
            if (!tenantId) {
              throw new BadRequestException('Tenant-scoped query dipanggil tanpa tenant context');
            }

            // Menggunakan any dengan alasan: tipe args bawaan Prisma adalah union dari semua operasi (findUnique, create, dll). 
            // TypeScript tidak bisa membedah properti spesifik (where, data) hanya berdasarkan pengecekan string operation di runtime.
            const queryArgs = (args as any) || {};

            // Operations that use `where` clause
            if (['findMany', 'findFirst', 'findUnique', 'findUniqueOrThrow', 'findFirstOrThrow', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              queryArgs.where = { ...queryArgs.where, tenantId };
            }

            // Operations that use `data` clause
            if (['create', 'createMany'].includes(operation)) {
              if (Array.isArray(queryArgs.data)) {
                queryArgs.data = queryArgs.data.map((item: any) => ({ ...item, tenantId }));
              } else {
                queryArgs.data = { ...queryArgs.data, tenantId };
              }
            }

            // Upsert uses both where, create, and update
            if (operation === 'upsert') {
              queryArgs.where = { ...queryArgs.where, tenantId };
              queryArgs.create = { ...queryArgs.create, tenantId };
              queryArgs.update = { ...queryArgs.update, tenantId }; // if updating, we could optionally enforce it, but where will filter it anyway.
            }

            return query(queryArgs);
          },
        },
      },
    });
  };
}
