'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Heart, Loader2, FileSpreadsheet, FileCode } from 'lucide-react';
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

export function PulseChart({ data: initialData }: { data: HealthMetric[] }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');

  // --- ESTADOS ---
  const [chartData, setChartData] = useState<HealthMetric[]>(initialData);
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [timeOfDay, setTimeOfDay] = useState<'24h' | 'am' | 'pm'>('24h');

  // Contextos disponibles (basados en carga inicial para tener todos)
  const availableContexts = useMemo(() => {
    const contexts = initialData
      .map(d => d.measurementContext)
      .filter(c => c !== null && c !== undefined && c !== '');
    return Array.from(new Set(contexts));
  }, [initialData]);

  // Server-Side Filtering
  useEffect(() => {
    const loadFilteredData = async () => {
      setLoading(true);
      try {
        const newData = await fetchMetrics({ 
          range: dateRange, 
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

  // Client-Side Filtering (Hora + Validación datos)
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
    return result;
  }, [chartData, timeOfDay]);

  // CALCULO DE DATOS PARA ESTADÍSTICAS (PULSO)
  const pulseData = useMemo(() => 
    finalData
      .map(d => d.pulse || 0)
      .filter(n => n > 0),
  [finalData]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden space-y-6">
      
      {/* LOADER */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white p-3 rounded-full shadow-lg border border-red-100">
            <Loader2 className="animate-spin text-red-600" size={24} />
          </div>
        </div>
      )}

      {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
      {/* Sin título, solo controles alineados */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* GRUPO IZQUIERDO: EXPORTAR */}
        <div className="flex gap-2">
            <button 
                onClick={() => downloadCSV(finalData, 'pulsaciones_data', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors"
                title="Descargar CSV"
            >
                <FileSpreadsheet size={14} /> <span>CSV</span>
            </button>
            <button 
                onClick={() => downloadXML(finalData, 'pulsaciones_data', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors"
                title="Descargar XML"
            >
                <FileCode size={14} /> <span>XML</span>
            </button>
        </div>

        {/* GRUPO DERECHO: FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center overflow-x-auto pb-1 sm:pb-0">
          
          {/* Rango Fechas */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {['7d', '30d', 'all'].map((val) => (
              <button
                key={val}
                onClick={() => setDateRange(val as any)}
                className={`
                  px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200
                  ${dateRange === val 
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }
                `}
              >
                {val === '7d' ? tFilter('7days') : val === '30d' ? tFilter('30days') : tFilter('all')}
              </button>
            ))}
          </div>

          {/* Hora */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
             {['24h', 'am', 'pm'].map((val) => (
              <button
                key={val}
                onClick={() => setTimeOfDay(val as any)}
                className={`
                  px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 uppercase
                  ${timeOfDay === val 
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
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
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors min-w-[100px]"
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

      {/* GRÁFICA */}
      <div className="w-full h-[400px]">
        {finalData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-500">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <Heart size={32} className="opacity-20 text-slate-500" />
            </div>
            <p className="font-medium text-sm text-slate-500">{tCharts('noData')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
              
              {/* --- ELIMINADO <Legend /> --- */}
              {/* Eliminado para no tener duplicidad con la estadística de abajo */}

              <Line type="monotone" dataKey="pulse" stroke="#ef4444" strokeWidth={3} name="BPM" dot={{r:4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
      {finalData.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
            {/* Solo una estadística porque es una sola línea */}
            <StatsSummary 
                label={tCharts('pulseTitle')} /* O "Pulsaciones" */
                data={pulseData} 
                colorClass="text-red-600" 
                bgClass="bg-red-50"
                unit="bpm"
                legendDotColor="#ef4444"
            />
        </div>
      )}
    </div>
  );
}