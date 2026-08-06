import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('agents')
@Roles('travel_admin')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  getAgents(@Query('status') status?: string) {
    return this.agentsService.getAgents(status);
  }

  @Post(':id/approve')
  approveAgent(@Param('id') id: string) {
    return this.agentsService.approveAgent(id);
  }

  @Post(':id/reject')
  rejectAgent(@Param('id') id: string) {
    return this.agentsService.rejectAgent(id);
  }
}
