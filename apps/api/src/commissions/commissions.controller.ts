import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommissionStatus } from '@prisma/client';

@Controller('commissions')
@Roles('travel_admin', 'super_admin')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  findAll(@Query('status') status?: CommissionStatus) {
    return this.commissionsService.findAll(status);
  }

  @Patch(':id/mark-payable')
  markPayable(@Param('id') id: string) {
    return this.commissionsService.markPayable(id);
  }

  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.commissionsService.markPaid(id);
  }
}
