import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseRepository } from '../persistence/supabase.repository';
import { HealthMetric } from '@prisma/client';

export interface CreateHealthData {
  bloodPressure?: string;
  pulse?: number;
  spo2?: number;
  weight?: number;
  ca125?: number;
  measurementContext?: string;
  weightLocation?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateEventData {
  type: string;
  notes?: string;
  date?: Date | string;
  severity?: string;
  medication?: string;
}

// DTO para los filtros que vendrán del Controller
export interface GetHistoryDto {
  range?: '7d' | '30d' | 'all';
  context?: string;
  location?: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly repository: SupabaseRepository) { }

  async recordHealthData(data: CreateHealthData) {
    // Validaciones de negocio
    if (data.bloodPressure) {
      const parts = data.bloodPressure.split('/');
      if (parts.length === 2) {
        const sys = Number(parts[0]);
        const dia = Number(parts[1]);
        if (!isNaN(sys) && !isNaN(dia) && sys < dia) {
          throw new BadRequestException(
            'Systolic blood pressure must be greater than diastolic.',
          );
        }
      }
    }

    if (data.spo2 && data.spo2 < 90) {
      console.warn('WARNING: Critical oxygen level detected.');
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
  // Editar
  async updateHealthData(id: string, data: Partial<CreateHealthData>) {
    const updatePayload: any = { ...data };
    if (updatePayload.createdAt) {
      updatePayload.createdAt = new Date(updatePayload.createdAt);
    }
    return this.repository.updateMetric(id, updatePayload);
  }

  // --- HEALTH EVENTS ---

  async recordEvent(data: CreateEventData) {
    const eventDate = data.date ? new Date(data.date) : new Date();
    // @ts-ignore
    return this.repository.createEvent({
      type: data.type,
      notes: data.notes,
      date: eventDate,
      severity: data.severity,
      medication: data.medication,
    });
  }

  async getEvents(filters: GetHistoryDto) {
    const { range } = filters;
    let startDate: Date | undefined;

    if (range === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d;
    } else if (range === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d;
    }

    // @ts-ignore
    return this.repository.findAllEvents({
      startDate,
    });
  }

  async removeEvent(id: string) {
    return this.repository.deleteEvent(id);
  }

  async updateEvent(id: string, data: Partial<CreateEventData>) {
    // Exclude 'time' if it exists in the payload, as it's not a database field
    const { time, ...rest } = data as any;
    const updatePayload: any = { ...rest };

    if (updatePayload.date) {
      updatePayload.date = new Date(updatePayload.date);
    }
    return this.repository.updateEvent(id, updatePayload);
  }
}

