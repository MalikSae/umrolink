import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RawPrismaService } from './raw-prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    private readonly rawPrisma: RawPrismaService,
    private readonly cls: ClsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Prioritize x-forwarded-host (set by Next.js proxy) over the raw Host header.
    // When Next.js rewrites /api/* to localhost:3001, it replaces Host with "localhost"
    // but preserves the original browser host in x-forwarded-host (e.g. "barokah.umrolink.test").
    const forwardedHost = req.headers['x-forwarded-host'];
    const rawHost = req.headers.host || '';
    const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || rawHost;
    const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'localhost';

    let tenantId: string | null = null;
    const hostWithoutPort = host.split(':')[0];

    // Check if it's the root domain (platform context)
    if (hostWithoutPort === rootDomain) {
      return next();
    }

    if (host.endsWith(`.${rootDomain}`) || host.endsWith(`.${rootDomain}:${process.env.PORT || 3000}`)) {
      // It's a subdomain
      // Handle optional port in host header, e.g., tenant-a.localhost:3000
      const hostWithoutPort = host.split(':')[0];
      const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');

      const tenant = await this.rawPrisma.tenant.findUnique({
        where: { subdomain },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant tidak ditemukan' });
      }

      tenantId = tenant.id;
    } else {
      // Custom domain
      const hostWithoutPort = host.split(':')[0];
      const tenant = await this.rawPrisma.tenant.findUnique({
        where: { customDomain: hostWithoutPort },
      });

      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant tidak ditemukan' });
    }

    this.cls.set('tenantId', tenantId);
    next();
  }
}
