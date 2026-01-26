'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, Loader2, FileSpreadsheet, FileCode } from 'lucide-react'; // Removed Download, added FileSpreadsheet, FileCode
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

// Props: 'initialData' se usa para la primera carga y para sacar la lista de contextos
export function BloodPressureChart({ data: initialData }: { data: HealthMetric[] }) {
  const t = useTranslations();
  const tCharts = useTranslations('Charts');
  const tFilter = useTranslations('Filters');

  // --- ESTADOS ---
  const [chartData, setChartData] = useState<HealthMetric[]>(initialData); // Datos actuales de la gráfica
  const [loading, setLoading] = useState(false); // Estado de carga

  // Filtros
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [timeOfDay, setTimeOfDay] = useState<'24h' | 'am' | 'pm'>('24h');

  // 1. Contextos disponibles: Los calculamos de 'initialData' para que el dropdown 
  //    siempre tenga todas las opciones, aunque filtremos los datos visuales.
  const availableContexts = useMemo(() => {
    const contexts = initialData
      .map(d => d.measurementContext)
      .filter(c => c !== null && c !== undefined && c !== '');
    return Array.from(new Set(contexts));
  }, [initialData]);

  // 2. EFECTO: Server-Side Filtering
  // Cada vez que cambia Rango o Contexto, pedimos datos nuevos a la API.
  useEffect(() => {
    // Función asíncrona interna
    const loadFilteredData = async () => {
      setLoading(true);
      try {
        // Llamamos a la API con los filtros
        const newData = await fetchMetrics({ 
          range: dateRange, 
          context: contextFilter 
        });
        setChartData(newData.reverse()); // Reverse si vienen desc
      } catch (error) {
        console.error("Error filtrando:", error);
      } finally {
        setLoading(false);
      }
    };

    // Evitamos llamar a la API en el primer render si ya tenemos initialData y los filtros son los default
    // (Opcional: puedes quitar este if si quieres forzar recarga siempre)
    // loadFilteredData(); 
    
    // NOTA: Para que funcione fluido al pulsar botones, llamamos siempre:
    loadFilteredData();

  }, [dateRange, contextFilter]); 

  // 3. Lógica Cliente (AM/PM) + Limpieza
  // Filtramos sobre 'chartData' (lo que nos trajo el servidor)
  const finalData = useMemo(() => {
    let result = chartData.filter(d => d.systolic_graph !== undefined && d.systolic_graph !== null);

    // Filtro AM/PM (Local)
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

  // CALCULO DE DATOS PARA ESTADÍSTICAS (Basado en finalData filtrada)
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


  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden space-y-6">
      
      {/* INDICADOR DE CARGA (Overlay) */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white p-3 rounded-full shadow-lg border border-purple-100">
            <Loader2 className="animate-spin text-purple-600" size={24} />
          </div>
        </div>
      )}

      {/* --- BARRA DE HERRAMIENTAS (HEADER) --- */}
      {/* Modificado: Quitamos el título y dejamos solo los controles alineados */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* GRUPO IZQUIERDO: EXPORTAR */}
        <div className="flex gap-2">
            <button 
                onClick={() => downloadCSV(finalData, 'tension_arterial', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                title="Descargar CSV"
            >
                <FileSpreadsheet size={14} /> <span className="hidden sm:inline">CSV</span>
            </button>
            <button 
                onClick={() => downloadXML(finalData, 'tension_arterial', t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                title="Descargar XML"
            >
                <FileCode size={14} /> <span className="hidden sm:inline">XML</span>
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
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
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
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
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
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors min-w-[100px]"
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

      {/* ÁREA DE GRÁFICA */}
      <div className="w-full h-[400px]">
        {finalData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-500">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <Activity size={32} className="opacity-20 text-slate-500" />
            </div>
            <p className="font-medium text-sm text-slate-500">{tCharts('noData')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#94a3b8" />
              <XAxis 
                dataKey="createdAt" 
                tick={<CustomXAxisTick />} 
                interval={0} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[40, 200]} 
                tick={{fontSize: 11, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false} 
                tickCount={6} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '12px' }}
                labelFormatter={(v) => new Date(v).toLocaleString()} 
              />
              
              {/* Sin Leyenda Recharts */}

              <Line type="monotone" dataKey="systolic_graph" stroke="#9333ea" strokeWidth={3} name={tCharts('systolic')} dot={{r:4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff'}} activeDot={{r:6}} />
              <Line type="monotone" dataKey="diastolic_graph" stroke="#d8b4fe" strokeWidth={3} name={tCharts('diastolic')} dot={{r:4, fill: '#d8b4fe', strokeWidth: 2, stroke: '#fff'}} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
      {finalData.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> 
                <StatsSummary 
                    label={tCharts('systolic')} 
                    data={systolicData} 
                    colorClass="text-purple-600" 
                    bgClass="bg-purple-50"
                    legendDotColor="#9333ea" 
                />
                <StatsSummary 
                    label={tCharts('diastolic')} 
                    data={diastolicData} 
                    colorClass="text-purple-400" 
                    bgClass="bg-purple-50/50" 
                    legendDotColor="#d8b4fe" 
                />
            </div>
        </div>
      )}
    </div>
  );
}