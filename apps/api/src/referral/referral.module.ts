import { Module } from '@nestjs/common';
import { ReferralAttributionService } from './referral-attribution.service';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [TenancyModule],
  providers: [ReferralAttributionService],
  exports: [ReferralAttributionService],
})
export class ReferralModule {}
