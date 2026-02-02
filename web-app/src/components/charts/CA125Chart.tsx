'use client';
import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TestTube2, FileSpreadsheet, FileCode } from 'lucide-react';
import { ChartSkeleton } from './ChartSkeleton';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { Metric } from '@/types/metrics';
import { StatsSummary } from '@/components/dashboard/StatsSummary';
import { downloadCSV, downloadXML } from '@/lib/export-utils';

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
  ca125: {
    label: "CA-125 (U/ml)",
    color: "#f97316",
  },
} satisfies ChartConfig;

export function CA125Chart({ data: initialData }: { data: Metric[] }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');

  const [chartData, setChartData] = useState<Metric[]>(initialData);
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
    let result = chartData.filter(d => d.ca125 !== null && d.ca125 !== undefined);

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

  const ca125Data = useMemo(() =>
    finalData
      .map(d => d.ca125 || 0)
      .filter(n => n > 0),
    [finalData]);

  // Si està carregant i no hi ha dades prèvies, mostrem el skeleton
  if (loading && chartData.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <Card className="w-full relative overflow-hidden border-border shadow-sm rounded-3xl animate-in fade-in duration-500 bg-card">

      {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
      <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(finalData, 'ca125_data', t)}
            className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-accent hover:text-orange-600"
            title="Descargar CSV"
          >
            <FileSpreadsheet size={14} /> <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadXML(finalData, 'ca125_data', t)}
            className="gap-1.5 text-xs font-bold text-muted-foreground bg-card border-border hover:bg-accent hover:text-orange-600"
            title="Descargar XML"
          >
            <FileCode size={14} /> <span>XML</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center overflow-x-auto pb-1 sm:pb-0">
          <Tabs value={dateRange} onValueChange={setDateRange} className="shrink-0">
            <TabsList className="bg-muted h-9 p-1 rounded-xl">
              <TabsTrigger value="7d" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('7days')}</TabsTrigger>
              <TabsTrigger value="30d" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('30days')}</TabsTrigger>
              <TabsTrigger value="all" className="text-[11px] h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('all')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={timeOfDay} onValueChange={setTimeOfDay} className="shrink-0">
            <TabsList className="bg-muted h-9 p-1 rounded-xl">
              <TabsTrigger value="24h" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('24h')}</TabsTrigger>
              <TabsTrigger value="am" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('am')}</TabsTrigger>
              <TabsTrigger value="pm" className="text-[11px] h-7 rounded-lg uppercase data-[state=active]:bg-background data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">{tFilter('pm')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden sm:block w-px h-6 bg-border mx-1"></div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden md:inline">
              {tFilter('contexts')}
            </span>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="h-9 min-w-[100px] text-xs font-bold border-border bg-muted/40 hover:bg-muted focus:ring-orange-100">
                <SelectValue placeholder={tFilter('allContexts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tFilter('allContexts')}</SelectItem>
                {availableContexts.map((ctx: any, idx) => (
                  <SelectItem key={idx} value={ctx}>{ctx}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {finalData.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-500">
            <div className="p-4 bg-muted rounded-full mb-3">
              <TestTube2 size={32} className="opacity-20 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm text-muted-foreground">{tCharts('noData')}</p>
          </div>
        ) : (
          /* DIV DE OPACITAT AFEGIT PER A LA CÀRREGA FLUIDA */
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
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickCount={6} />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeWidth: 2 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      className="w-[200px] rounded-2xl border border-border/10 shadow-xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md p-3 text-slate-900 dark:text-slate-50"
                      labelFormatter={(value, payload) => {
                        const rawDate = value || (payload && payload[0]?.payload?.createdAt);
                        if (!rawDate) return null;
                        const date = new Date(rawDate);
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
                      formatter={(value) => (
                        <div className="flex items-center justify-between w-full my-0.5">
                          <span className="text-muted-foreground text-xs font-medium">
                            {tCharts('ca125Title')}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                            {value}
                            <span className="ml-1 font-normal text-[10px] text-muted-foreground uppercase">
                              U/ml
                            </span>
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Line type="monotone" dataKey="ca125" stroke="var(--color-ca125)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-ca125)", strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>

      {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
      {finalData.length > 0 && (
        <CardFooter className="pt-6 border-t border-border block">
          <StatsSummary
            label={tCharts('ca125Title')}
            data={ca125Data}
            colorClass="text-orange-700 dark:text-orange-400"
            bgClass="bg-orange-50 dark:bg-orange-900/20"
            unit="U/ml"
            legendDotColor="#f97316"
            showAvg={false}
          />
        </CardFooter>
      )}
    </Card>
  );
}