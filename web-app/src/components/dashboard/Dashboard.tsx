'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Activity, Heart, Scale, Droplets, TestTube,
  Globe, LayoutList, LogOut, LayoutGrid, List,
  FileSpreadsheet, FileCode
} from 'lucide-react';

// Imports de la nova API i Constants
import { metricApi } from '@/lib/api';
import { Metric } from '@/types/metrics';
import { STORAGE_KEYS, APP_ROUTES } from '@/lib/constants';
import { downloadCSV, downloadXML } from '@/lib/export-utils';

// Componentes
import { BloodPressureChart } from '@/components/charts/BloodPressureChart';
import { PulseChart } from '@/components/charts/PulseChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { SpO2Chart } from '@/components/charts/SpO2Chart';
import { CA125Chart } from '@/components/charts/CA125Chart';
import { HistoryGridView } from '@/components/health-history/HistoryGridView';
import { HistoryTableView } from '@/components/health-history/HistoryTableView';
import { HealthDataForm } from '@/components/health-entry/HealthDataForm';

interface DashboardProps {
  initialMetrics: Metric[];
}

export function Dashboard({ initialMetrics }: DashboardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // --- ESTATS ---
  // Inicialitzem amb les dades del servidor -> Adéu loading inicial!
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<'history' | 'bp' | 'pulse' | 'weight' | 'spo2' | 'ca125'>('history');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // --- EFECTES ---
  useEffect(() => {
    checkAuth();
  }, []);

  // --- FUNCIONS ---
  function checkAuth() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    setIsAdmin(!!token);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setIsAdmin(false);
    setActiveTab('history');
    router.refresh();
  }

  // Funció per refrescar dades sense recarregar la pàgina
  async function refreshData() {
    try {
      const data = await metricApi.getAll(); // Usem la nova API
      setMetrics(data);
    } catch (error) {
      console.error("Error refrescant dades:", error);
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-gray-800 relative">

      {/* --- CAPÇALERA SUPERIOR --- */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="w-44 flex items-center p-1 bg-white rounded-full shadow-sm border border-slate-200 mr-2 group transition-all"
            title={t('Dashboard.logout')}
          >
            <span className="w-full py-1 rounded-full bg-white text-slate-900 group-hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
              <LogOut size={14} /> {t('HomePage.adminExit')}
            </span>
          </button>
        ) : (
          <Link
            href={`/${locale}${APP_ROUTES.LOGIN}`}
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

        {/* --- FORMULARI --- */}
        {isAdmin && (
          <div className="mb-8">
            <HealthDataForm onSuccess={refreshData} />
          </div>
        )}

        {/* --- NAVEGACIÓ (TABS) --- */}
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

        {/* --- ÀREA DE CONTINGUT --- */}
        <div className="min-h-100">

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">

              {/* --- BARRA D'EINES UNIFICADA --- */}
              <div className="flex justify-end items-center mb-4 px-1">
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">

                  {/* Grup 1: Exportació */}
                  <button
                    onClick={() => downloadCSV(metrics, 'historial_salud', t)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-black hover:bg-slate-50 rounded-lg transition-colors"
                    title={t('Dashboard.downloadCSV')}
                  >
                    <FileSpreadsheet size={16} /> <span>CSV</span>
                  </button>
                  <button
                    onClick={() => downloadXML(metrics, 'historial_salud', t)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-black hover:bg-slate-50 rounded-lg transition-colors"
                    title={t('Dashboard.downloadXML')}
                  >
                    <FileCode size={16} /> <span>XML</span>
                  </button>

                  {/* Separador Vertical */}
                  <div className="w-px h-6 bg-slate-100 mx-2"></div>

                  {/* Grup 2: Vistes */}
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t('History.cardView')}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t('History.tableView')}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {metrics.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <p>{t('Dashboard.noRecords')}</p>
                </div>
              )}

              {/* Contingut */}
              {viewMode === 'grid' ? (
                <HistoryGridView
                  data={metrics}
                  isAdmin={isAdmin}
                  onRefresh={refreshData}
                />
              ) : (
                <HistoryTableView
                  data={metrics}
                  isAdmin={isAdmin}
                  onRefresh={refreshData}
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

        {/* MISSATGE VISITANT */}
        {!isAdmin && (
          <div className="mt-10 text-center text-slate-400 text-sm pb-10">
            <p>{t('HomePage.viewModeMessage')}</p>
          </div>
        )}

      </div>
    </div>
  );
}