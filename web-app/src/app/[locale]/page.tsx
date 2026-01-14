'use client';

import { useEffect, useState } from 'react';
import { fetchMetrics, saveMetric, HealthMetric } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Componentes de Gráficas y Tarjetas
import { BloodPressureChart } from '@/components/charts/BloodPressureChart';
import { PulseChart } from '@/components/charts/PulseChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { SpO2Chart } from '@/components/charts/SpO2Chart';
import { CA125Chart } from '@/components/charts/CA125Chart';
import { MetricCard } from '@/components/MetricCard';
// IMPORTAR EL NUEVO COMPONENTE DE TABLA
import { HistoryTableView } from '@/components/HistoryTableView';

// Iconos
import { 
  Activity, ClipboardList, Heart, Scale, Droplets, TestTube, 
  Globe, LayoutList, Lock, LogOut, LayoutGrid, List // <--- Nuevos iconos añadidos
} from 'lucide-react';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  
  // --- ESTADOS ---
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estado de Pestañas
  const [activeTab, setActiveTab] = useState<'history' | 'bp' | 'pulse' | 'weight' | 'spo2' | 'ca125'>('history');
  
  // NUEVO: Estado para alternar vista (Grid vs Tabla)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [formData, setFormData] = useState({
    bloodPressure: '', pulse: '', weight: '', spo2: '', ca125: '',
    measurementContext: '', weightLocation: '', notes: ''
  });

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
    // La API devuelve los datos, los guardamos en el estado.
    // Nota: En tu código anterior hacías .reverse() aquí. 
    // Mantendremos el orden cronológico descendente en el renderizado para consistencia.
    setMetrics(data.reverse()); 
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const payload: Partial<HealthMetric> = {
        bloodPressure: formData.bloodPressure || undefined,
        measurementContext: formData.measurementContext || undefined,
        weightLocation: formData.weightLocation || undefined,
        notes: formData.notes || undefined,
        pulse: formData.pulse ? Number(formData.pulse) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        spo2: formData.spo2 ? Number(formData.spo2) : undefined,
        ca125: formData.ca125 ? Number(formData.ca125) : undefined,
    };

    try {
      await saveMetric(payload);
      
      setFormData({
        bloodPressure: '', pulse: '', weight: '', spo2: '', ca125: '',
        measurementContext: '', weightLocation: '', notes: ''
      });
      
      loadData();
      setActiveTab('history'); 
      
    } catch (err: any) { 
      if (err.message === "UNAUTHORIZED") {
        alert("Tu sesión ha caducado. Por favor, inicia sesión de nuevo.");
        handleLogout();
        router.push(`/${locale}/login`);
      } else {
        alert(t('HomePage.errorSaving'));
      }
    }
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
      
      {/* --- CABECERA SUPERIOR (Absoluta) --- */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        
        {isAdmin ? (
            // BOTÓN LOGOUT
            <button 
                onClick={handleLogout}
                className="w-44 flex items-center p-1 bg-white rounded-full shadow-sm border border-slate-200 mr-2 group transition-all"
                title="Cerrar Sesión"
            >
                <span className="w-full py-1 rounded-full bg-white text-red-500 group-hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <LogOut size={14} /> {t('HomePage.exit')}
                </span>
            </button>
        ) : (
            // BOTÓN LOGIN
            <Link 
                href={`/${locale}/login`}
                className="w-44 flex items-center p-1 bg-slate-900 rounded-full shadow-sm border border-slate-200 mr-2 hover:shadow-md transition-all group"
            >
                <span className="w-full py-1 rounded-full bg-slate-900 text-white group-hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                   {t('HomePage.adminAccess')}
                </span>
            </Link>
        )}

        {/* SELECTOR IDIOMA */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-slate-200">
            <Globe size={14} className="ml-2 text-slate-400" />
            <Link href="/es" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'es' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>ES</Link>
            <Link href="/ca" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'ca' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>CA</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 pt-12">
        
        {/* NAVEGACIÓN (TABS) */}
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

        {/* ÁREA DE CONTENIDO */}
        <div className="min-h-100">
            
        {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                
                {/* --- HEADER DE VISTA (GRID / TABLE) --- */}
                <div className="flex justify-between items-center mb-2 px-1">
                   {/* Título de la vista actual (Opcional, ayuda a saber qué se ve) */}
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {viewMode === 'grid' ? t('History.cardView') : t('History.tableView')}
                   </span>

                   {/* SELECTOR DE VISTA */}
                   <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        title={t('History.cardView')}
                      >
                        <LayoutGrid size={16} />
                      </button>
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        title={t('History.tableView')}
                      >
                        <List size={16} />
                      </button>
                   </div>
                </div>

                {/* MENSAJE SI NO HAY DATOS */}
                {metrics.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <p>No hay registros todavía.</p>
                    </div>
                )}

                {/* --- RENDERIZADO CONDICIONAL: GRID vs TABLE --- */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {/* Mantenemos el reverse() para ver lo más nuevo primero */}
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
                    // Aquí usamos el nuevo componente Tabla
                    // Pasamos los datos invertidos igual que en las cards
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

        {/* FORMULARIO (ADMIN) */}
        {isAdmin && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <ClipboardList className="text-green-600" /> {t('HomePage.newRecord')}
                </h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    <div className="lg:col-span-8 bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-4 text-purple-900 font-bold border-b border-purple-200 pb-2">
                            <Heart size={18} /> {t('Form.physiologicalData')}
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">{t('Form.contextLabel')}</label>
                            <select 
                                className="w-full p-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                value={formData.measurementContext} 
                                onChange={e => setFormData({...formData, measurementContext: e.target.value})}
                            >
                                <option value="">{t('Form.contextPlaceholder')}</option>
                                <option value="Post-Ejercicio">{t('ContextOptions.exercise')}</option>
                                <option value="Post-Drenaje">{t('ContextOptions.drainage')}</option>
                                <option value="Post-Quimioterapia">{t('ContextOptions.chemo')}</option>
                                <option value="Momento de estres">{t('ContextOptions.stress')}</option>
                            </select>
                            <p className="text-[10px] text-purple-600 mt-1 pl-1">{t('Form.contextHint')}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-900 mb-1">{t('Form.bpLabel')}</label>
                                <input type="text" placeholder="120/80" 
                                    className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-purple-900 mb-1">{t('Form.pulseLabel')}</label>
                                <input type="number" placeholder="80" 
                                    className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.pulse} onChange={e => setFormData({...formData, pulse: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-900 mb-1">{t('Form.spo2Label')}</label>
                                <input type="number" placeholder="98" 
                                    className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-900 mb-1">{t('Form.ca125Label')}</label>
                                <input type="number" placeholder="35.5" 
                                    className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.ca125} onChange={e => setFormData({...formData, ca125: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4 text-blue-900 font-bold border-b border-blue-200 pb-2">
                            <Scale size={18} /> {t('Form.weightControl')}
                        </div>
                        
                        <div className="space-y-4 grow">
                            <div>
                                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">{t('Form.locationLabel')}</label>
                                <select 
                                    className="w-full p-2.5 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.weightLocation} 
                                    onChange={e => setFormData({...formData, weightLocation: e.target.value})}
                                >
                                    <option value="">{t('Form.locationPlaceholder')}</option>
                                    <option value="Casa">{t('LocationOptions.home')}</option>
                                    <option value="Farmacia">{t('LocationOptions.pharmacy')}</option>
                                    <option value="CAP">{t('LocationOptions.cap')}</option>
                                    <option value="ICO">{t('LocationOptions.ico')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-1">{t('Form.weightLabel')}</label>
                                <input type="number" placeholder="75.5" 
                                    className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-12 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Form.notes')}</label>
                            <textarea 
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none h-24 resize-none shadow-sm"
                                placeholder={t('Form.notesPlaceholder')}
                                value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} 
                            />
                        </div>

                        <button type="submit" 
                            className="w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] flex justify-center items-center gap-2">
                            <ClipboardList size={20} /> {t('HomePage.saveButton')}
                        </button>
                    </div>

                </form>
            </div>
        )}

        {!isAdmin && (
            <div className="mt-10 text-center text-slate-400 text-sm pb-10">
                <p>{t('HomePage.viewModeMessage')}</p>
            </div>
        )}

      </div>
    </main>
  );
}