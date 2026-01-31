import { Injectable } from '@nestjs/common';
import { PrismaClient, HealthMetric, Prisma } from '@prisma/client';

export interface MetricsFilter {
  startDate?: Date;
  endDate?: Date;
  context?: string;
  location?: string;
  limit?: number;
}

@Injectable()
export class SupabaseRepository extends PrismaClient {
  async onModuleInit() {
    await this.$connect();
  }

  async createMetric(data: Prisma.HealthMetricCreateInput): Promise<HealthMetric> {
    return this.healthMetric.create({ data });
  }

  // MODIFICADO: Ahora acepta un objeto de filtros opcional
  async findAllMetrics(filters?: MetricsFilter): Promise<HealthMetric[]> {
    const whereClause: Prisma.HealthMetricWhereInput = {};

    // 1. Filtro por Rango de Fechas
    if (filters?.startDate) {
      whereClause.createdAt = {
        gte: filters.startDate, // 'gte' = Greater Than or Equal (Mayor o igual que)
        lte: filters.endDate || new Date(), // Hasta ahora si no se especifica fin
      };
    }

    // 2. Filtro por Contexto (si no es 'all' o undefined)
    if (filters?.context && filters.context !== 'all') {
      whereClause.measurementContext = filters.context;
    }

    if (filters?.location && filters.location !== 'all') {
      whereClause.weightLocation = filters.location;
    }

    return this.healthMetric.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      // Opcional: Limitar resultados si se pide (ej: últimos 100)
      take: filters?.limit,
    });
  }

  async updateMetric(
    id: string,
    data: Prisma.HealthMetricUpdateInput,
  ): Promise<HealthMetric> {
    return this.healthMetric.update({
      where: { id },
      data,
    });
  }

  async deleteMetric(id: string): Promise<HealthMetric> {
    return this.healthMetric.delete({
      where: { id },
    });
  }
}
