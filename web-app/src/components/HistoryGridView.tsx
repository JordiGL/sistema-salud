'use client';

import { HealthMetric } from '@/lib/api';
import { MetricCard } from './MetricCard';
// Eliminem imports de descàrrega i traduccions de capçalera

interface HistoryGridViewProps {
  data: HealthMetric[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function HistoryGridView({ data, isAdmin, onRefresh }: HistoryGridViewProps) {
  // Ja no necessitem traduccions aquí si no hi ha text
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {data.map((metric) => (
            <MetricCard 
                key={metric.id} 
                data={metric} 
                isAdmin={isAdmin}
                onRefresh={onRefresh}
            />
        ))}
    </div>
  );
}