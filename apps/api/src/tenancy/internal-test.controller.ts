import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TenantPrismaService } from './tenant-prisma.service';
import { RawPrismaService } from './raw-prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

// TEMPORARY: akan dihapus/diganti saat ada endpoint bisnis asli
@Controller('_internal')
export class InternalTestController {
  constructor(
    private readonly cls: ClsService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly rawPrisma: RawPrismaService,
  ) {}

  @Public()
  @Get('tenant-check')
  async checkTenant() {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      return { error: 'No tenant context' };
    }
    
    // We can use RawPrisma here because we just want to fetch the Tenant name by ID.
    // Tenant is not tenant-scoped itself in the same way (it is the tenant).
    const tenant = await this.rawPrisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return { tenantId, tenantName: tenant?.name };
  }

}

