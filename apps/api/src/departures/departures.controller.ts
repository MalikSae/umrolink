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
  findAll(
    @Query('status') status?: string,
  ) {
    return this.departuresService.findAll(status);
  }

  @Post()
  create(@Body() createDepartureDto: CreateDepartureDto) {
    return this.departuresService.create(createDepartureDto);
  }
}
