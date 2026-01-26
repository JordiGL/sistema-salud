'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TestTube2, Loader2, FileSpreadsheet, FileCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fetchMetrics, HealthMetric } from '@/lib/api';
import { StatsSummary } from './StatsSummary';
import { downloadCSV, downloadXML } from '@/lib/export-utils';

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const date = new Date(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={18} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="sans-serif">
        <tspan x="0" dy="0">
          {date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
        </tspan>
        <tspan x="0" dy="14">
          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </tspan>
      </text>
    </g>
  );
};

export function CA125Chart({ data: initialData }: { data: HealthMetric[] }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');

  const [chartData, setChartData] = useState<HealthMetric[]>(initialData);
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [timeOfDay, setTimeOfDay] = useState<'24h' | 'am' | 'pm'>('24h');

  const availableContexts = useMemo(() => {
    const contexts = initialData
      .map(d => d.measurementContext)
      .filter(c => c !== null && c !== undefined && c !== '');
    return Array.from(new Set(contexts));
  }, [initialData]);

  useEffect(() => {
    const loadFilteredData = async () => {
      setLoading(true);
      try {
        const newData = await fetchMetrics({ range: dateRange, context: contextFilter });
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

  // CALCULO DE DATOS PARA ESTADÍSTICAS (CA125)
  const ca125Data = useMemo(() => 
    finalData
      .map(d => d.ca125 || 0)
      .filter(n => n > 0),
  [finalData]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden space-y-6">
      
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white p-3 rounded-full shadow-lg border border-orange-100">
            <Loader2 className="animate-spin text-orange-600" size={24} />
          </div>
        </div>
      )}

      {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
      {/* Sin título, solo controles alineados */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* GRUPO IZQUIERDO: EXPORTAR */}
        <div className="flex gap-2">
            <button 
                onClick={() => downloadCSV(finalData, 'ca125_data', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-orange-600 transition-colors"
                title="Descargar CSV"
            >
                <FileSpreadsheet size={14} /> <span className="hidden sm:inline">CSV</span>
            </button>
            <button 
                onClick={() => downloadXML(finalData, 'ca125_data', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-orange-600 transition-colors"
                title="Descargar XML"
            >
                <FileCode size={14} /> <span className="hidden sm:inline">XML</span>
            </button>
        </div>

        {/* GRUPO DERECHO: FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center overflow-x-auto pb-1 sm:pb-0">
          
          {/* Rango Fechas - Orange Theme */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {['7d', '30d', 'all'].map((val) => (
              <button
                key={val}
                onClick={() => setDateRange(val as any)}
                className={`
                  px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200
                  ${dateRange === val 
                    ? 'bg-white text-orange-700 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }
                `}
              >
                {val === '7d' ? tFilter('7days') : val === '30d' ? tFilter('30days') : tFilter('all')}
              </button>
            ))}
          </div>

          {/* Hora - Orange Theme */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
             {['24h', 'am', 'pm'].map((val) => (
              <button
                key={val}
                onClick={() => setTimeOfDay(val as any)}
                className={`
                  px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 uppercase
                  ${timeOfDay === val 
                    ? 'bg-white text-orange-700 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }
                `}
              >
                {tFilter(val)}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>

          {/* Contextos */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
              {tFilter('contexts')}
            </span>
            <div className="relative group">
              <select 
                value={contextFilter}
                onChange={(e) => setContextFilter(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors min-w-[100px]"
              >
                <option value="all">{tFilter('allContexts')}</option>
                {availableContexts.map((ctx: any, idx) => (
                  <option key={idx} value={ctx}>{ctx}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-[400px]">
        {finalData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-500">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <TestTube2 size={32} className="opacity-20 text-slate-500" />
            </div>
            <p className="font-medium text-sm text-slate-500">{tCharts('noData')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCa125" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#94a3b8" />
              <XAxis dataKey="createdAt" tick={<CustomXAxisTick />} interval={0} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickCount={6} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '12px' }}
                labelFormatter={(v) => new Date(v).toLocaleString()} 
              />
              
              <Line type="monotone" dataKey="ca125" stroke="#f97316" strokeWidth={3} name="U/ml" dot={{r:4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
      {finalData.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
            {/* Estadísticas sin media para CA125 */}
            <StatsSummary 
                label={tCharts('ca125Title')}
                data={ca125Data} 
                colorClass="text-orange-700" 
                bgClass="bg-orange-50"
                unit="U/ml"
                legendDotColor="#f97316"
                showAvg={false} // Hide average
            />
        </div>
      )}
    </div>
  );
}