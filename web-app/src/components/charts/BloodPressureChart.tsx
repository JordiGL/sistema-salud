'use client';
import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, FileSpreadsheet, FileCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { useMetricManager } from '@/hooks/useMetricManager';
import { Metric } from '@/types/metrics';
import { StatsSummary } from '@/components/dashboard/StatsSummary';
import { downloadCSV, downloadXML } from '@/lib/export-utils';
import { ChartSkeleton } from './ChartSkeleton';
import { HistoryTableView } from '@/components/health-history/HistoryTableView';

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTheme } from 'next-themes';

const CustomXAxisTick = ({ x, y, payload, hideTime }: any) => {
  const date = new Date(payload.value);
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
  systolic: {
    label: "Sistólica",
    theme: {
      light: "#475569",
      dark: "#4c8edfff",
    },
  },
  diastolic: {
    label: "Diastólica",
    theme: {
      light: "#94a3b8",
      dark: "#64748b",
    },
  },
} satisfies ChartConfig;

export function BloodPressureChart({ data: initialData, isAdmin }: { data: Metric[], isAdmin: boolean }) {
  const { theme } = useTheme();
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');
  const { renderContext } = useMetricManager();

  // --- ESTADOS ---
  const [chartData, setChartData] = useState<Metric[]>(() => [...initialData].reverse());
  const [loading, setLoading] = useState(false);

  // Filtros
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
    let result = chartData.filter(d => d.systolic_graph !== undefined && d.systolic_graph !== null);

    if (timeOfDay !== '24h') {
      result = result.filter(d => {
        const dateObj = new Date(d.createdAt);
        const hour = dateObj.getHours();
        if (timeOfDay === 'am') return hour < 12;
        if (timeOfDay === 'pm') return hour >= 12;
        return true;
      });
    }
    return result;
  }, [chartData, timeOfDay]);

  const systolicData = useMemo(() =>
    finalData
      .map(d => d.bloodPressure ? Number(d.bloodPressure.split('/')[0]) : 0)
      .filter(n => n > 0),
    [finalData]);

  const diastolicData = useMemo(() =>
    finalData
      .map(d => d.bloodPressure ? Number(d.bloodPressure.split('/')[1]) : 0)
      .filter(n => n > 0),
    [finalData]);

  // Si está cargando y no tenemos datos todavía, mostramos el Skeleton profesional
  if (loading && chartData.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full relative overflow-hidden border-border shadow-sm rounded-3xl animate-in fade-in duration-500 bg-card">

        {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">

          {/* GRUPO IZQUIERDO: EXPORTAR */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(finalData, 'tension_arterial', t)}
              className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-muted hover:text-foreground"
              title="Descargar CSV"
            >
              <FileSpreadsheet size={14} /> <span>CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadXML(finalData, 'tension_arterial', t)}
              className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-muted hover:text-foreground"
              title="Descargar XML"
            >
              <FileCode size={14} /> <span>XML</span>
            </Button>
          </div>

          {/* GRUPO DERECHO: FILTROS */}
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

        {/* ÁREA DE GRÁFICA */}
        <CardContent>
          {finalData.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-500">
              <div className="p-4 bg-muted rounded-full mb-3">
                <Activity size={32} className="opacity-20 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm text-muted-foreground">{tCharts('noData')}</p>
            </div>
          ) : (
            <div className={loading ? "opacity-50 transition-opacity duration-300" : "opacity-100 transition-opacity duration-300"}>
              <ChartContainer config={chartConfig} className="w-full h-[400px]">
                <LineChart data={finalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#94a3b8" />
                  <XAxis
                    dataKey="createdAt"
                    tick={(props) => <CustomXAxisTick {...props} hideTime={finalData.length > 30} />}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={6}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--border)', strokeWidth: 2 }}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="w-[200px] rounded-2xl border border-border/10 shadow-xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md p-3 text-slate-900 dark:text-slate-50"
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return (
                            <div className="flex flex-col border-b border-border pb-2 mb-2">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                {t('History.cols.date')}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-50">
                                {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                <span className="mx-1 text-muted">|</span>
                                {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                            </div>
                          );
                        }}
                        formatter={(value, name) => {
                          const labelMap: Record<string, string> = {
                            systolic_graph: tCharts('systolic'),
                            diastolic_graph: tCharts('diastolic'),
                          };

                          return (
                            <div className="flex items-center justify-between w-full my-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs font-medium">
                                  {labelMap[name as string] || name}
                                </span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                                {value}
                                <span className="ml-1 font-normal text-[10px] text-muted-foreground uppercase">
                                  mmHg
                                </span>
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />

                  <Line type="monotone" dataKey="systolic_graph" stroke="var(--chart-systolic)" strokeWidth={3} dot={{ r: 4, fill: "var(--chart-systolic)", strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="diastolic_graph" stroke="var(--chart-diastolic)" strokeWidth={3} dot={{ r: 4, fill: "var(--chart-diastolic)", strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>

        {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
        {finalData.length > 0 && (
          <CardFooter className="pt-6 border-t border-border block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StatsSummary
                label={tCharts('systolic')}
                data={systolicData}
                colorClass="text-slate-900 dark:text-slate-300"
                bgClass="bg-slate-100 dark:bg-slate-800"
                legendDotColor="var(--chart-systolic)"
              />
              <StatsSummary
                label={tCharts('diastolic')}
                data={diastolicData}
                colorClass="text-slate-400 dark:text-slate-500"
                bgClass="bg-slate-50 dark:bg-slate-900/50"
                legendDotColor="var(--chart-diastolic)"
              />
            </div>
          </CardFooter>
        )}
      </Card>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <HistoryTableView
          data={finalData}
          isAdmin={false} // Read-only in analytical view
          onRefresh={() => { }}
          visibleColumns={['createdAt', 'measurementContext', 'bloodPressure', 'notes']}
        />
      </div>
    </div>
  );
}