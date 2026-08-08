import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { DeparturesService } from './departures.service';
import { CreateDepartureDto } from './dto/create-departure.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('departures')
@Roles('travel_admin', 'super_admin')
export class DeparturesController {
  constructor(private readonly departuresService: DeparturesService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.departuresService.findAll(status, search, pageNum, limitNum);
  }

  @Post()
  create(@Body() createDepartureDto: CreateDepartureDto) {
    return this.departuresService.create(createDepartureDto);
  }
}
