import { Controller, Get, Req } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@Controller('agent/commissions')
@Roles('agent')
export class AgentCommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  findMyCommissions(@Req() req: Request) {
    const user = (req as any).user;
    return this.commissionsService.findMyCommissions(user.sub);
  }
}
