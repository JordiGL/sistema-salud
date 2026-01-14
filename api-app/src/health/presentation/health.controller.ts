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
import { AuthGuard } from '../common/guards/auth.guard';

// Componente C4: "Health Data Controller"
@Controller('metrics')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Relación C4: webApp -> authGuard -> healthController (Solo para POST)
  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addMetric(@Body() createMetricDto: CreateMetricDto) {
    return this.healthService.recordHealthData(createMetricDto);
  }

  // El visitante puede consultar sin Auth
  @Get()
  async getAllMetrics(
    @Query('range') range?: '7d' | '30d' | 'all',
    @Query('context') context?: string,
    @Query('location') location?: string, // <--- NUEVO
  ) {
    // Pasamos el nuevo parámetro al servicio (que a su vez lo pasará al repo)
    // Nota: Asegúrate de que tu health.service.ts simplemente pasa el objeto 'filters' completo
    // o actualiza la interfaz GetHistoryDto en el servicio si la definiste estricta.
    return this.healthService.getHistory({ range, context, location } as any);
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
  async updateMetric(@Param('id') id: string, @Body() updateData: any) {
    return this.healthService.updateHealthData(id, updateData);
  }
}
