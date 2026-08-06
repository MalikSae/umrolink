import { Module, Global } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { RawPrismaService } from './raw-prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';
import { InternalTestController } from './internal-test.controller';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false }, // We handle the middleware separately (TenantResolutionMiddleware)
    }),
  ],
  controllers: [InternalTestController],
  providers: [RawPrismaService, TenantPrismaService],
  exports: [RawPrismaService, TenantPrismaService, ClsModule],
})
export class TenancyModule {}
