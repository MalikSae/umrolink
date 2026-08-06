import { Controller, Get, Param, Post, Body, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { PublicService } from './public.service';
import { Public } from '../auth/decorators/public.decorator';
import { RegisterAgentDto } from './dto/register-agent.dto';

@Controller('public')
@Public()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('tenant')
  getTenant() {
    return this.publicService.getTenant();
  }

  @Get('banners')
  getBanners() {
    return this.publicService.getBanners();
  }

  @Get('departure-months')
  getDepartureMonths() {
    return this.publicService.getDepartureMonths();
  }

  @Get('packages')
  getPackages(@Query('month') month?: string, @Query('featured') featured?: string) {
    return this.publicService.getPackages(month, featured === 'true');
  }

  @Get('packages/:slug')
  getPackageBySlug(@Param('slug') slug: string) {
    return this.publicService.getPackageBySlug(slug);
  }

  @Post('agents/register')
  registerAgent(@Body() dto: RegisterAgentDto) {
    return this.publicService.registerAgent(dto);
  }

  @Post('leads')
  createLead(@Body() dto: import('./dto/create-lead.dto').CreateLeadDto, @Req() req: Request) {
    const refCookie = req.cookies?.['umrolink_ref'] || null;
    return this.publicService.createLead(dto, refCookie);
  }
}
