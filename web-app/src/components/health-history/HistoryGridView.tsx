'use client';

import { Metric } from '@/types/metrics';
import { MetricCard } from '@/components/ui/MetricCard';

interface HistoryGridViewProps {
  data: Metric[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function HistoryGridView({ data, isAdmin, onRefresh }: HistoryGridViewProps) {
  return (
    <div className="bg-card rounded-md border border-border shadow-sm p-4">
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
    </div>
  );
}