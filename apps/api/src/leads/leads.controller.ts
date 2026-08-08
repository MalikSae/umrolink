import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('leads')
@UseGuards(RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Roles('super_admin', 'travel_admin')
  findAll() {
    return this.leadsService.findAll();
  }

  @Patch(':id/mark-dp-received')
  @Roles('super_admin', 'travel_admin')
  markDpReceived(@Param('id') id: string) {
    return this.leadsService.markPayment(id, 'dp_received');
  }

  @Patch(':id/mark-paid-full')
  @Roles('super_admin', 'travel_admin')
  markPaidFull(@Param('id') id: string) {
    return this.leadsService.markPayment(id, 'paid_full');
  }

  @Patch(':id/cancel')
  @Roles('super_admin', 'travel_admin')
  cancel(@Param('id') id: string) {
    return this.leadsService.cancel(id);
  }
}
