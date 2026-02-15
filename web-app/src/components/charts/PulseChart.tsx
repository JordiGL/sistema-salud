'use client';
import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Label } from 'recharts';
import { Heart, FileSpreadsheet, FileCode, MoveHorizontal } from 'lucide-react';
import { ChartSkeleton } from './ChartSkeleton';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { useMetricManager } from '@/hooks/useMetricManager';
import { Metric, HealthEvent } from '@/types/metrics';
import { ReferenceLine } from 'recharts';
import { StatsSummary } from '@/components/dashboard/StatsSummary';
import { downloadCSV, downloadXML } from '@/lib/export-utils';
import { HistoryTableView } from '@/components/health-history/HistoryTableView';

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const CustomXAxisTick = ({ x, y, payload, hideTime }: any) => {
  const date = new Date(payload.value); // Works for timestamp or ISO string
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={18} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="sans-serif">
        <tspan x="0" dy="0">
          {date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
        </tspan>
        {!hideTime && (
          <tspan x="0" dy="14">
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </tspan>
        )}
      </text>
    </g>
  );
};

const chartConfig = {
  pulse: {
    label: "Pulsaciones (BPM)",
    color: "#475569",
  },
} satisfies ChartConfig;

export function PulseChart({ data: initialData, events = [], isAdmin }: { data: Metric[], events?: HealthEvent[], isAdmin: boolean }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');
  const { renderContext } = useMetricManager();

  // --- ESTADOS ---
  const [chartData, setChartData] = useState<Metric[]>(() => [...initialData].reverse());
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [timeOfDay, setTimeOfDay] = useState<string>('24h');

  const availableContexts = useMemo(() => {
    const contexts = initialData
      .map(d => d.measurementContext)
      .filter(c => c !== null && c !== undefined);
    return Array.from(new Set(contexts));
  }, [initialData]);

  useEffect(() => {
    const loadFilteredData = async () => {
      setLoading(true);
      try {
        const newData = await metricApi.getAll({
          range: dateRange as any,
          context: contextFilter
        });
        setChartData(newData.reverse());
      } catch (error) {
        console.error("Error filtrando:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFilteredData();
  }, [dateRange, contextFilter]);

  const finalData = useMemo(() => {
    let result = chartData.filter(d => d.pulse !== null && d.pulse !== undefined);

    if (timeOfDay !== '24h') {
      result = result.filter(d => {
        const dateObj = new Date(d.createdAt);
        const hour = dateObj.getHours();
        if (timeOfDay === 'am') return hour < 12;
        if (timeOfDay === 'pm') return hour >= 12;
        return true;
      });
    }

    // Add timestamp for numeric axis
    return result.map(d => ({
      ...d,
      timestamp: new Date(d.createdAt).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData, timeOfDay]);

  // Definición de tipo para los puntos del gráfico (puede ser métrica o evento)
  type ChartPoint = Partial<Metric> & Partial<HealthEvent> & {
    timestamp: number;
    isEvent: boolean;
    pulse: number;
    createdAt: string | Date;
  };

  // Translation helper for event types
  const getEventLabel = (type?: string) => {
    if (!type) return '';
    try { return t(`HealthEvents.types.${type}`); } catch { return type; }
  };

  const pulseData = useMemo(() =>
    finalData
      .map(d => d.pulse ? Number(d.pulse) : 0)
      .filter(n => n > 0),
    [finalData]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let result = events;

    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(e => new Date(e.date) >= cutoff);
    }

    if (finalData.length > 0) {
      const startTime = finalData[0].timestamp;
      result = result.filter(e => new Date(e.date).getTime() >= startTime);
    }

    return result;
  }, [events, dateRange, finalData]);

  // COMBINAR EVENTOS Y MÉTRICAS EN UN SOLO ARRAY PARA LA LÍNEA
  const combinedData = useMemo(() => {
    if (finalData.length === 0) return [];

    // 1. Añadimos flags a las métricas originales
    const points: ChartPoint[] = finalData.map(m => ({
      ...m,
      isEvent: false,
      pulse: Number(m.pulse)
    }));

    // 2. Insertamos los eventos calculando su posición en la línea (interpolación)
    filteredEvents.forEach(event => {
      const eventTs = new Date(event.date).getTime();
      const nextIdx = finalData.findIndex(d => d.timestamp > eventTs);

      let val = 0;
      if (nextIdx === 0) val = Number(finalData[0].pulse);
      else if (nextIdx === -1) val = Number(finalData[finalData.length - 1].pulse);
      else {
        const p1 = finalData[nextIdx - 1];
        const p2 = finalData[nextIdx];
        const v1 = Number(p1.pulse);
        const v2 = Number(p2.pulse);
        const ratio = (eventTs - p1.timestamp) / (p2.timestamp - p1.timestamp);
        val = v1 + ratio * (v2 - v1);
      }

      points.push({
        ...event,
        timestamp: eventTs,
        pulse: val,
        isEvent: true,
        createdAt: event.date
      });
    });

    return points.sort((a, b) => a.timestamp - b.timestamp);
  }, [finalData, filteredEvents]);

  const uniqueEventTypes = useMemo(() => {
    return Array.from(new Set(filteredEvents.map(e => e.type)));
  }, [filteredEvents]);

  const tableData = useMemo(() => {
    return [...finalData, ...filteredEvents];
  }, [finalData, filteredEvents]);

  // Càrrega inicial amb Skeleton professional
  if (loading && chartData.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full relative overflow-hidden border-border shadow-sm rounded-3xl animate-in fade-in duration-500 bg-card">

        {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(finalData, 'pulsaciones_data', t)}
              className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-muted hover:text-foreground"
              title="Descargar CSV"
            >
              <FileSpreadsheet size={14} /> <span>CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadXML(finalData, 'pulsaciones_data', t)}
              className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-muted hover:text-foreground"
              title="Descargar XML"
            >
              <FileCode size={14} /> <span>XML</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center overflow-x-auto pb-1 sm:pb-0">
            <Tabs value={dateRange} onValueChange={setDateRange} className="shrink-0">
              <TabsList className="bg-muted h-9 p-1 rounded-xl">
                <TabsTrigger value="7d" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('7days')}</TabsTrigger>
                <TabsTrigger value="30d" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('30days')}</TabsTrigger>
                <TabsTrigger value="all" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('all')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={timeOfDay} onValueChange={setTimeOfDay} className="shrink-0">
              <TabsList className="bg-muted h-9 p-1 rounded-xl">
                <TabsTrigger value="24h" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('24h')}</TabsTrigger>
                <TabsTrigger value="am" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('am')}</TabsTrigger>
                <TabsTrigger value="pm" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{tFilter('pm')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="hidden sm:block w-px h-6 bg-border mx-1"></div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden md:inline">
                {tFilter('contexts')}
              </span>
              <Select value={contextFilter} onValueChange={setContextFilter}>
                <SelectTrigger className="h-9 min-w-[100px] text-xs font-bold border-border bg-muted/40 hover:bg-muted focus:ring-slate-200">
                  <SelectValue placeholder={tFilter('allContexts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tFilter('allContexts')}</SelectItem>
                  {availableContexts.map((ctx: any, idx) => (
                    <SelectItem key={idx} value={ctx}>{renderContext(ctx)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {finalData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-500">
              <div className="p-4 bg-muted rounded-full mb-3">
                <Heart size={32} className="opacity-20 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm text-muted-foreground">{tCharts('noData')}</p>
            </div>
          ) : (
            /* Wrapper d'opacitat per a càrrega asíncrona fluida */
            <div className={`flex flex-col gap-4 ${loading ? "opacity-50" : "opacity-100"} transition-opacity duration-300`}>
              {/* Event Legend (Top) */}
              {uniqueEventTypes.length > 0 && (
                <div className="flex flex-wrap gap-3 px-2">
                  {uniqueEventTypes.map(type => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{getEventLabel(type)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <ChartContainer config={chartConfig} className="w-full h-[400px]">
                  <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#94a3b8" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tick={(props) => <CustomXAxisTick {...props} hideTime={combinedData.length > 30} />}
                      interval="preserveStartEnd"
                      minTickGap={50}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickCount={6} />
                    <ChartTooltip
                      cursor={{ stroke: 'var(--border)', strokeWidth: 2 }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null
                        const data = payload[0].payload as ChartPoint
                        const date = new Date(data.timestamp)

                        return (
                          <div className="w-[200px] rounded-2xl border border-border/10 shadow-xl bg-card/95 backdrop-blur-md p-3 text-foreground">
                            <div className="flex flex-col border-b border-border pb-2 mb-2">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                {t('History.cols.date')}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                <span className="mx-1 text-muted">|</span>
                                {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                            </div>

                            {data.isEvent ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs uppercase font-bold text-foreground">{getEventLabel(data.type)}</span>
                                </div>
                                {data.notes && <p className="text-[11px] text-muted-foreground italic leading-tight">"{data.notes}"</p>}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between w-full my-0.5">
                                  <span className="text-muted-foreground text-xs font-medium">
                                    {tCharts('pulseTitle')}
                                  </span>
                                  <span className="font-bold text-foreground text-sm">
                                    {data.pulse}
                                    <span className="ml-1 font-normal text-[10px] text-muted-foreground uppercase">
                                      bpm
                                    </span>
                                  </span>
                                </div>
                                {data.measurementContext && (
                                  <div className="flex items-center justify-between w-full pt-1.5 border-t border-border">
                                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{t('History.cols.context')}</span>
                                    <span className="text-muted-foreground text-[11px] font-semibold italic">{renderContext(data.measurementContext)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pulse"
                      stroke="var(--color-pulse)"
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
                            fill="var(--color-pulse)"
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
                            fill="var(--color-pulse)"
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
          )}
        </CardContent>

        {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
        {finalData.length > 0 && (
          <CardFooter className="pt-6 border-t border-border block">
            <StatsSummary
              label={tCharts('pulseTitle')}
              data={pulseData}
              colorClass="text-muted-foreground"
              bgClass="bg-muted/50"
              unit="bpm"
              legendDotColor="#475569"
            />
          </CardFooter>
        )}
      </Card>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <HistoryTableView
          data={tableData}
          isAdmin={false} // Read-only
          onRefresh={() => { }}
          visibleColumns={['createdAt', 'measurementContext', 'pulse', 'notes']}
        />
      </div>
    </div>
  );
}