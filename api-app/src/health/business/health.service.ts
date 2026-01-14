import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseRepository } from '../persistence/supabase.repository';

export interface CreateHealthData {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  spo2?: number;
  weight?: number;
  ca125?: number;
  measurementContext?: string;
  weightLocation?: string;
  notes?: string;
}

// DTO para los filtros que vendrán del Controller
export interface GetHistoryDto {
  range?: '7d' | '30d' | 'all';
  context?: string;
  location?: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly repository: SupabaseRepository) {}

  async recordHealthData(data: CreateHealthData) {
    // Validaciones (se mantienen igual)
    if (data.systolic && data.diastolic && data.systolic < data.diastolic) {
      throw new BadRequestException(
        'La tensión sistólica debe ser mayor que la diastólica.',
      );
    }
    if (data.spo2 && data.spo2 < 90) {
      console.warn('ALERTA: Nivel de oxígeno crítico detectado.');
    }

    return this.repository.createMetric(data);
  }

  // MODIFICADO: Lógica de negocio para calcular fechas
  async getHistory(filters: GetHistoryDto) {
    const { range, context, location } = filters;
    let startDate: Date | undefined;

    // Calcular fecha de inicio según el rango seleccionado
    if (range === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d;
    } else if (range === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d;
    }
    // Si es 'all', startDate se queda undefined y Prisma traerá todo

    // Llamar al repositorio con los datos ya procesados
    return this.repository.findAllMetrics({
      startDate,
      context,
      location,
    });
  }

  // Eliminar
  async removeHealthData(id: string) {
    return this.repository.deleteMetric(id);
  }

  // Editar
  async updateHealthData(id: string, data: Partial<CreateHealthData>) {
    // Aquí podrías repetir validaciones si quisieras (ej: sistólica > diastólica)
    return this.repository.updateMetric(id, data as any);
  }
}
