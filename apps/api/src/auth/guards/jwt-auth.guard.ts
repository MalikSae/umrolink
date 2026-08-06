import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as jwt from 'jsonwebtoken';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private cls: ClsService) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeaderOrCookie(request);

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const payload = jwt.verify(token, secret) as any;
      
      // Attach to request for @CurrentUser
      request.user = payload;

      // CRITICAL CHECK: Cross-tenant login prevention
      if (payload.role !== 'super_admin') {
        const currentTenantId = this.cls.get('tenantId');
        
        if (!currentTenantId || payload.tenantId !== currentTenantId) {
          throw new UnauthorizedException('Token tidak valid untuk tenant ini');
        }
      }

    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err; // Re-throw our custom exception
      }
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa');
    }

    return true;
  }

  private extractTokenFromHeaderOrCookie(request: any): string | undefined {
    // 1. Try to get from Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }

    // 2. Try to get from cookie manually
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/umrolink_token=([^;]+)/);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }
}
