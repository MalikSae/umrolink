import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

@Injectable()
export class ReferralAttributionService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async resolveAgentFromCookie(cookieValue: string | undefined): Promise<string | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const agentProfile = await this.tenantPrisma.client.agentProfile.findFirst({
        where: {
          agentCode: cookieValue,
          status: 'active',
        },
      });

      if (agentProfile) {
        return agentProfile.id;
      }
    } catch (err) {
      // Don't throw error if something goes wrong, just return null as per spec
      console.error('Error resolving agent from cookie:', err);
    }

    return null;
  }
}
