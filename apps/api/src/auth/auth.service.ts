import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RawPrismaService } from '../tenancy/raw-prisma.service';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { ClsService } from 'nestjs-cls';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly rawPrisma: RawPrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly cls: ClsService,
  ) {}

  async login(email: string, passwordPlain: string) {
    const tenantId = this.cls.get('tenantId');
    let user: User | null = null;

    if (!tenantId) {
      // Branch A: Platform Context (Domain Root)
      user = await this.rawPrisma.user.findFirst({
        where: {
          email,
          role: 'super_admin',
          tenantId: null,
        },
      });
    } else {
      // Branch B: Tenant Context (Subdomain/Custom domain)
      // Query uses tenantPrisma which automatically adds `tenantId` to where clause
      user = await this.tenantPrisma.client.user.findFirst({
        where: { email },
      });

      if (user && user.role !== 'travel_admin' && user.role !== 'agent') {
        user = null; // Invalid role for tenant context
      }
    }

    if (!user) {
      // 401 Unauthorized, don't leak user existence
      return null;
    }

    if (user.role === 'agent') {
      const agentProfile = await this.tenantPrisma.client.agentProfile.findFirst({
        where: { userId: user.id }
      });

      if (!agentProfile) {
        throw new UnauthorizedException('Akun agen Anda tidak ditemukan.');
      }

      if (agentProfile.status !== 'active') {
        const message = agentProfile.status === 'pending'
          ? 'Akun Anda masih menunggu persetujuan travel admin.'
          : 'Akun agen Anda dinonaktifkan.';
        throw new UnauthorizedException(message);
      }
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isPasswordValid) {
      return null;
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const access_token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      }
    };
  }
}
