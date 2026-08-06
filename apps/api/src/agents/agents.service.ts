import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async getAgents(status?: string) {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    return this.tenantPrisma.client.agentProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveAgent(id: string) {
    const agentProfile = await this.tenantPrisma.client.agentProfile.findUnique({
      where: { id },
      include: { tenant: true }
    });

    if (!agentProfile) {
      throw new NotFoundException('Agent profile not found');
    }

    if (agentProfile.status === 'active') {
      return agentProfile; // already active
    }

    const tenantId = agentProfile.tenantId;

    let maxRetries = 5;
    let updatedAgentProfile = null;

    while (maxRetries > 0) {
      try {
        updatedAgentProfile = await this.tenantPrisma.client.$transaction(async (tx) => {
          // 1. Increment agentCodeSeq
          const updatedTenant = await tx.tenant.update({
            where: { id: tenantId },
            data: {
              agentCodeSeq: { increment: 1 }
            }
          });

          // 2. Generate code: Prefix based on significant words in tenant name + 3-digit sequence
          // E.g., "Barokah Tour & Travel" -> "BTT"
          const words = updatedTenant.name.split(' ');
          let prefix = '';
          for (const word of words) {
            // filter out symbols like &
            const cleanedWord = word.replace(/[^a-zA-Z0-9]/g, '');
            if (cleanedWord.length > 0) {
              prefix += cleanedWord.charAt(0).toUpperCase();
            }
          }

          // Pad sequence with leading zeros (e.g., 001, 002)
          const sequence = updatedTenant.agentCodeSeq.toString().padStart(3, '0');
          const agentCode = `${prefix}${sequence}`;

          // 3. Update AgentProfile
          return await tx.agentProfile.update({
            where: { id },
            data: {
              status: 'active',
              agentCode
            },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          });
        });
        
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error.code === 'P2002') {
          maxRetries--;
          if (maxRetries === 0) {
            throw new Error('Failed to generate unique agent code after multiple retries');
          }
          continue; // Retry
        }
        throw error; // Rethrow other errors
      }
    }

    return updatedAgentProfile;
  }

  async rejectAgent(id: string) {
    const agentProfile = await this.tenantPrisma.client.agentProfile.findUnique({
      where: { id }
    });

    if (!agentProfile) {
      throw new NotFoundException('Agent profile not found');
    }

    // Delete User, which cascades to AgentProfile
    await this.tenantPrisma.client.user.delete({
      where: { id: agentProfile.userId }
    });

    return { success: true };
  }
}
