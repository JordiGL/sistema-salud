import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { HealthService } from '../business/health.service';
import { CreateMetricDto } from './dtos/create-metric.dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { AuthGuard } from '../common/guards/auth.guard';

import { GetHistoryDto, UpdateMetricDto, UpdateEventDto } from './dtos/metric-operations.dto';

// Componente C4: "Health Data Controller"
@Controller('metrics')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  // Relación C4: webApp -> authGuard -> healthController (Solo para POST)
  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addMetric(@Body() createMetricDto: CreateMetricDto) {
    return this.healthService.recordHealthData(createMetricDto);
  }

  // El visitante puede consultar sin Auth
  @Get()
  async getAllMetrics(@Query() filters: GetHistoryDto) {
    // Pasamos el nuevo parámetro al servicio (que a su vez lo pasará al repo)
    return this.healthService.getHistory(filters);
  }

  // Endpoint para ELIMINAR (Protegido)
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteMetric(@Param('id') id: string) {
    return this.healthService.removeHealthData(id);
  }

  // Endpoint para EDITAR (Protegido)
  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateMetric(
    @Param('id') id: string,
    @Body() updateData: UpdateMetricDto,
  ) {
    return this.healthService.updateHealthData(id, updateData);
  }

  // --- HEALTH EVENTS ---

  @Post('events')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addEvent(@Body() createEventDto: CreateEventDto) {
    return this.healthService.recordEvent(createEventDto);
  }

  @Get('events')
  async getEvents(@Query() filters: GetHistoryDto) {
    return this.healthService.getEvents(filters);
  }

  @Delete('events/:id')
  @UseGuards(AuthGuard)
  async deleteEvent(@Param('id') id: string) {
    return this.healthService.removeEvent(id);
  }

  @Patch('events/:id')
  @UseGuards(AuthGuard)
  async updateEvent(@Param('id') id: string, @Body() updateData: UpdateEventDto) {
    return this.healthService.updateEvent(id, updateData);
  }
}

