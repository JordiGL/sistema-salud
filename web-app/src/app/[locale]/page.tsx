'use client';

import { useEffect, useState } from 'react';
import { fetchMetrics, HealthMetric } from '@/lib/api'; 
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Componentes
import { BloodPressureChart } from '@/components/charts/BloodPressureChart';
import { PulseChart } from '@/components/charts/PulseChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { SpO2Chart } from '@/components/charts/SpO2Chart';
import { CA125Chart } from '@/components/charts/CA125Chart';
import { MetricCard } from '@/components/MetricCard';
import { HistoryTableView } from '@/components/HistoryTableView';
import { HealthDataForm } from '@/components/HealthDataForm';

// Iconos
import { 
  Activity, Heart, Scale, Droplets, TestTube, 
  Globe, LayoutList, Lock, LogOut, LayoutGrid, List 
} from 'lucide-react';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  
  // --- ESTADOS ---
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'history' | 'bp' | 'pulse' | 'weight' | 'spo2' | 'ca125'>('history');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // --- EFECTOS ---
  useEffect(() => { 
    loadData(); 
    checkAuth(); 
  }, []);

  // --- FUNCIONES ---
  function checkAuth() {
    const token = localStorage.getItem('health_token');
    setIsAdmin(!!token);
  }

  function handleLogout() {
    localStorage.removeItem('health_token');
    setIsAdmin(false);
    setActiveTab('history');
    router.refresh();
  }

  async function loadData() {
    const data = await fetchMetrics();
    setMetrics(data.reverse()); 
    setLoading(false);
  }

  const tabs = [
    { id: 'history', label: t('Tabs.history'), icon: LayoutList, color: 'text-slate-800', border: 'border-slate-800' },
    { id: 'bp', label: t('Tabs.bp'), icon: Activity, color: 'text-purple-600', border: 'border-purple-600' },
    { id: 'pulse', label: t('Tabs.pulse'), icon: Heart, color: 'text-red-500', border: 'border-red-500' },
    { id: 'weight', label: t('Tabs.weight'), icon: Scale, color: 'text-blue-600', border: 'border-blue-600' },
    { id: 'spo2', label: t('Tabs.spo2'), icon: Droplets, color: 'text-teal-600', border: 'border-teal-600' },
    { id: 'ca125', label: t('Tabs.ca125'), icon: TestTube, color: 'text-orange-600', border: 'border-orange-600' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-gray-800 relative">
      
      {/* --- CABECERA SUPERIOR --- */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {isAdmin ? (
            <button 
                onClick={handleLogout}
                className="w-44 flex items-center p-1 bg-white rounded-full shadow-sm border border-slate-200 mr-2 group transition-all"
                title="Cerrar Sesión"
            >
                <span className="w-full py-1 rounded-full bg-white text-slate-900 group-hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <LogOut size={14} /> {t('HomePage.adminExit')}
                </span>
            </button>
        ) : (
            <Link 
                href={`/${locale}/login`}
                className="w-44 flex items-center p-1 bg-slate-900 rounded-full shadow-sm border border-slate-200 mr-2 hover:shadow-md transition-all group"
            >
                <span className="w-full py-1 rounded-full bg-slate-900 text-white group-hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                   {t('HomePage.adminAccess')}
                </span>
            </Link>
        )}

        <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-slate-200">
            <Globe size={14} className="ml-2 text-slate-400" />
            <Link href="/es" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'es' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>ES</Link>
            <Link href="/ca" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'ca' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>CA</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 pt-12">
        
        {/* --- FORMULARIO (MOVIDO ARRIBA) --- */}
        {/* Solo visible si es Admin */}
        {isAdmin && (
           // Nota: Le he quitado un poco de margen superior en el componente original o aquí 
           // para que no quede demasiado separado, pero el componente ya tiene sus propios estilos.
           <div className="mb-8">
               <HealthDataForm onSuccess={loadData} />
           </div>
        )}

        {/* --- NAVEGACIÓN (TABS) --- */}
        <div className="flex flex-wrap gap-2 md:gap-4 p-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none justify-center whitespace-nowrap
                  ${isActive 
                    ? `bg-slate-100 ${tab.color} shadow-inner`
                    : 'text-gray-500 hover:bg-slate-50 hover:text-gray-700'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --- ÁREA DE CONTENIDO (GRÁFICAS Y TABLAS) --- */}
        <div className="min-h-100">
            
        {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                
                <div className="flex justify-between items-center mb-2 px-1">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {viewMode === 'grid' ? t('History.cardView') : t('History.tableView')}
                   </span>
                   <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <LayoutGrid size={16} />
                      </button>
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <List size={16} />
                      </button>
                   </div>
                </div>

                {metrics.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <p>No hay registros todavía.</p>
                    </div>
                )}

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {[...metrics].reverse().map((metric) => (
                            <MetricCard 
                                key={metric.id} 
                                data={metric} 
                                isAdmin={isAdmin}
                                onRefresh={loadData}
                            />
                        ))}
                    </div>
                ) : (
                    <HistoryTableView 
                        data={[...metrics].reverse()} 
                        isAdmin={isAdmin} 
                        onRefresh={loadData} 
                    />
                )}
            </div>
          )}

          {activeTab === 'bp' && <BloodPressureChart data={metrics} />}
          {activeTab === 'pulse' && <PulseChart data={metrics} />}
          {activeTab === 'weight' && <WeightChart data={metrics} />}
          {activeTab === 'spo2' && <SpO2Chart data={metrics} />}
          {activeTab === 'ca125' && <CA125Chart data={metrics} />}
        </div>

        {/* MENSAJE VISITANTE */}
        {!isAdmin && (
            <div className="mt-10 text-center text-slate-400 text-sm pb-10">
                <p>{t('HomePage.viewModeMessage')}</p>
            </div>
        )}

      </div>
    </main>
  );
}