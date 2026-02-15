'use client';
import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Label, ReferenceLine } from 'recharts';
import { TestTube2, FileSpreadsheet, FileCode, Syringe } from 'lucide-react';
import { ChartSkeleton } from './ChartSkeleton';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { useMetricManager } from '@/hooks/useMetricManager';
import { Metric, HealthEvent } from '@/types/metrics';
import { StatsSummary } from '@/components/dashboard/StatsSummary';
import { downloadCSV, downloadXML } from '@/lib/export-utils';
import { HistoryTableView } from '@/components/health-history/HistoryTableView';

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const CustomXAxisTick = ({ x, y, payload, hideTime }: any) => {
  const date = new Date(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={18} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="sans-serif">
        <tspan x="0" dy="0">{date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</tspan>
        {!hideTime && <tspan x="0" dy="14">{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</tspan>}
      </text>
    </g>
  );
};

const chartConfig = {
  ca125: { label: "CA-125 (U/ml)", color: "#475569" },
} satisfies ChartConfig;

export function CA125Chart({ data: initialData, events = [], isAdmin }: { data: Metric[], events?: HealthEvent[], isAdmin: boolean }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');
  const { renderContext } = useMetricManager();

  const [chartData, setChartData] = useState<Metric[]>(() => [...initialData].reverse());
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [timeOfDay, setTimeOfDay] = useState<string>('24h');

  // Compute fixed domain based on ALL data to prevent jumping
  const yDomain = useMemo(() => {
    const values = initialData
      .map(d => d.ca125)
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number);

    if (values.length === 0) return [0, 'auto'];

    const max = Math.max(...values);
    // Add 10-20% padding on top
    return [0, Math.ceil(max * 1.2)];
  }, [initialData]);

  useEffect(() => {
    const loadFilteredData = async () => {
      setLoading(true);
      try {
        const newData = await metricApi.getAll({ range: dateRange as any, context: contextFilter });
        setChartData(newData.reverse());
      } catch (error) { console.error("Error filtrando:", error); }
      finally { setLoading(false); }
    };
    loadFilteredData();
  }, [dateRange, contextFilter]);

  const metricData = useMemo(() => {
    let result = chartData.filter(d => d.ca125 !== null && d.ca125 !== undefined);
    if (timeOfDay !== '24h') {
      result = result.filter(d => {
        const hour = new Date(d.createdAt).getHours();
        return timeOfDay === 'am' ? hour < 12 : hour >= 12;
      });
    }
    return result.map(d => ({
      ...d,
      timestamp: new Date(d.createdAt).getTime(),
      ca125: Number(d.ca125)
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData, timeOfDay]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let result = events;

    // 1. Filter by Date Range
    if (dateRange !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (dateRange === '7d' ? 7 : 30));
      result = result.filter(e => new Date(e.date) >= cutoff);
    }

    // 2. Filter by Start of Records (User requirement: Start from first record)
    if (metricData.length > 0) {
      const startTime = metricData[0].timestamp;
      result = result.filter(e => new Date(e.date).getTime() >= startTime);
    }

    return result;
  }, [events, dateRange, metricData]);

  // Definición de tipo para los puntos del gráfico (puede ser métrica o evento)
  type ChartPoint = Partial<Metric> & Partial<HealthEvent> & {
    timestamp: number;
    isEvent: boolean;
    ca125: number;
    createdAt: string | Date; // Unificación de fecha para tooltip
  };

  // COMBINAR EVENTOS Y MÉTRICAS EN UN SOLO ARRAY PARA LA LÍNEA
  const combinedData = useMemo(() => {
    if (metricData.length === 0) return [];

    // 1. Añadimos flags a las métricas originales
    const points: ChartPoint[] = metricData.map(m => ({
      ...m,
      isEvent: false,
      // Aseguramos que ca125 sea number (ya lo filtramos en metricData pero TS puede quejarse)
      ca125: Number(m.ca125)
    }));

    // 2. Insertamos los eventos calculando su posición en la línea (interpolación)
    filteredEvents.forEach(event => {
      const eventTs = new Date(event.date).getTime();
      const nextIdx = metricData.findIndex(d => d.timestamp > eventTs);

      let val = 0;
      if (nextIdx === 0) val = metricData[0].ca125;
      else if (nextIdx === -1) val = metricData[metricData.length - 1].ca125;
      else {
        const p1 = metricData[nextIdx - 1];
        const p2 = metricData[nextIdx];
        const ratio = (eventTs - p1.timestamp) / (p2.timestamp - p1.timestamp);
        val = p1.ca125 + ratio * (p2.ca125 - p1.ca125);
      }

      points.push({
        ...event,
        timestamp: eventTs,
        ca125: val,
        isEvent: true,
        createdAt: event.date
      });
    });

    return points.sort((a, b) => a.timestamp - b.timestamp);
  }, [metricData, filteredEvents]);

  const getEventLabel = (type?: string) => {
    if (!type) return '';
    try { return t(`HealthEvents.types.${type}`); } catch { return type; }
  };

  if (loading && chartData.length === 0) return <ChartSkeleton />;

  return (
    <div className="space-y-6">
      <Card className="w-full relative overflow-hidden border-border shadow-sm rounded-3xl animate-in fade-in duration-500 bg-card">
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCSV(metricData, 'ca125_data', t)} className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-muted">
              <FileSpreadsheet size={14} /> <span>CSV</span>
            </Button>
          </div>
          <Tabs value={dateRange} onValueChange={setDateRange} className="shrink-0">
            <TabsList className="bg-muted h-9 p-1 rounded-xl">
              <TabsTrigger value="7d" className="text-[11px] h-7 rounded-lg">{tFilter('7days')}</TabsTrigger>
              <TabsTrigger value="30d" className="text-[11px] h-7 rounded-lg">{tFilter('30days')}</TabsTrigger>
              <TabsTrigger value="all" className="text-[11px] h-7 rounded-lg">{tFilter('all')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          <div className={`flex flex-col gap-4 ${loading ? "opacity-50" : "opacity-100"} transition-opacity duration-300`}>
            <div className="flex-1 min-w-0">
              <ChartContainer config={chartConfig} className="w-full h-[400px]">
                <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#94a3b8" />
                  <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tick={(props) => <CustomXAxisTick {...props} hideTime={combinedData.length > 30} />} axisLine={false} tickLine={false} />
                  <YAxis domain={yDomain as any} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />

                  <ChartTooltip
                    cursor={{ stroke: 'var(--border)', strokeWidth: 2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      const date = new Date(data.timestamp);
                      return (
                        <div className="w-[220px] rounded-2xl border border-border shadow-xl bg-card/95 backdrop-blur-md p-3 text-foreground">
                          <div className="flex flex-col border-b border-border pb-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('History.cols.date')}</span>
                            <span className="text-xs font-bold">{date.toLocaleDateString()} | {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {data.isEvent ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs uppercase">{getEventLabel(data.type)}</span>
                              </div>
                              {data.notes && <p className="text-[11px] text-muted-foreground italic leading-tight">"{data.notes}"</p>}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">CA-125</span>
                              <span className="text-sm font-bold">{data.ca125} U/ml</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* LÍNEA ÚNICA CON DOTS PERSONALIZADOS */}
                  <Line
                    type="monotone"
                    dataKey="ca125"
                    stroke="var(--color-ca125)"
                    strokeWidth={3}
                    // --- PUNTO ESTÁTICO (Normal) ---
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.isEvent) {
                        return (
                          <rect
                            key={`dot-ev-${payload.id}`}
                            x={cx - 3}
                            y={cy - 3}
                            width={6}
                            height={6}
                            fill="#8b5cf6"
                          />
                        );
                      }
                      return (
                        <circle
                          key={`dot-reg-${payload.id}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="var(--color-ca125)"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                    // --- PUNTO ACTIVO (Hover) ---
                    activeDot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.isEvent) {
                        return (
                          <rect
                            x={cx - 5}
                            y={cy - 5}
                            width={10}
                            height={10}
                            fill="#8b5cf6"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="var(--color-ca125)"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />

                  {filteredEvents.map((event) => (
                    <ReferenceLine
                      key={event.id}
                      x={new Date(event.date).getTime()}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      opacity={0.5}
                      strokeWidth={1.5}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6 border-t border-border">
          <StatsSummary label={tCharts('ca125Title')} data={metricData.map(d => d.ca125)} unit="U/ml" showAvg={false} />
        </CardFooter>
      </Card>

      <HistoryTableView
        data={[...metricData, ...filteredEvents]}
        isAdmin={isAdmin}
        onRefresh={() => { }}
        visibleColumns={['createdAt', 'measurementContext', 'ca125', 'notes']}
      />
    </div>
  );
}