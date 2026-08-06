import { Injectable, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RawPrismaService } from './raw-prisma.service';
import { createTenantPrismaExtension } from './tenant-prisma.extension';

@Injectable({ scope: Scope.DEFAULT })
export class TenantPrismaService {
  private extendedClient;

  constructor(
    private readonly rawPrisma: RawPrismaService,
    private readonly cls: ClsService,
  ) {
    this.extendedClient = createTenantPrismaExtension(this.cls)(this.rawPrisma as any);
  }

  get client() {
    return this.extendedClient;
  }
}
