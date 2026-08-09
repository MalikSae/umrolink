import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RawPrismaService } from '../tenancy/raw-prisma.service';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { ClsService } from 'nestjs-cls';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

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
          role: { in: ['super_admin', 'travel_admin'] },
        },
      });
    } else {
      // Branch B: Tenant Context (Subdomain/Custom domain)
      user = await this.tenantPrisma.client.user.findFirst({
        where: { email },
      });

      if (user && user.role !== 'agent') {
        user = null; // Invalid role for tenant context
      }
    }

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isPasswordValid) {
      return null;
    }

    if (!tenantId) {
      // Create handoff token for super_admin or travel_admin
      const code = randomBytes(32).toString('hex');
      const token = await this.rawPrisma.authHandoffToken.create({
        data: {
          code,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds
        },
      });

      let redirectUrl = `/api/auth/handoff?code=${token.code}`;
      if (user.role === 'travel_admin' && user.tenantId) {
        const tenant = await this.rawPrisma.tenant.findUnique({
          where: { id: user.tenantId }
        });
        if (tenant) {
          const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'umrolink.test';
          const domain = tenant.customDomain || `${tenant.subdomain}.${baseDomain}`;
          const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          redirectUrl = `${protocol}://${domain}/api/auth/handoff?code=${token.code}`;
        }
      }

      return {
        type: 'handoff',
        handoff_token: token.code,
        redirectUrl,
      };
    } else {
      // Proceed with agent login
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
        type: 'jwt',
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

  async redeemHandoffToken(code: string) {
    const token = await this.rawPrisma.authHandoffToken.findUnique({
      where: { code },
    });

    if (!token) {
      throw new UnauthorizedException('Token handoff tidak valid.');
    }

    if (token.usedAt) {
      throw new UnauthorizedException('Token handoff sudah digunakan.');
    }

    if (token.expiresAt < new Date()) {
      throw new UnauthorizedException('Token handoff kedaluwarsa.');
    }

    // Mark as used
    await this.rawPrisma.authHandoffToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    const user = await this.rawPrisma.user.findUnique({
      where: { id: token.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan.');
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId, // will be null for super_admin
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
