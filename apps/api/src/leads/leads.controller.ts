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

  @Patch(':id/confirm')
  @Roles('super_admin', 'travel_admin')
  confirm(@Param('id') id: string) {
    return this.leadsService.confirm(id);
  }

  @Patch(':id/cancel')
  @Roles('super_admin', 'travel_admin')
  cancel(@Param('id') id: string) {
    return this.leadsService.cancel(id);
  }
}
