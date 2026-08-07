import { Module } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { AgentCommissionsController } from './agent-commissions.controller';

@Module({
  controllers: [CommissionsController, AgentCommissionsController],
  providers: [CommissionsService],
})
export class CommissionsModule {}
