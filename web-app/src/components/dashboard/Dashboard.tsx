'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Activity, Heart, Scale, Droplets, TestTube,
  Globe, LayoutList, LogOut, LayoutGrid, List,
  FileSpreadsheet, FileCode, ShieldCheck
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
import { Button } from "@/components/ui/button";

import { ModeToggle } from "@/components/mode-toggle";

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
    { id: 'history', label: t('Tabs.history'), icon: LayoutList },
    { id: 'bp', label: t('Tabs.bp'), icon: Activity },
    { id: 'pulse', label: t('Tabs.pulse'), icon: Heart },
    { id: 'weight', label: t('Tabs.weight'), icon: Scale },
    { id: 'spo2', label: t('Tabs.spo2'), icon: Droplets },
    { id: 'ca125', label: t('Tabs.ca125'), icon: TestTube },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground relative">

      {/* --- CAPÇALERA SUPERIOR --- */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {isAdmin ? (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm hover:opacity-90 dark:hover:bg-slate-700 transition-all mr-2"
            title={t('Dashboard.logout')}
          >
            <LogOut size={16} />
          </Button>
        ) : (
          <Link
            href={`/${locale}${APP_ROUTES.LOGIN}`}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm hover:opacity-90 dark:hover:bg-slate-700 transition-all mr-2"
            title={t('HomePage.adminAccess')}
          >
            <ShieldCheck size={16} />
          </Link>
        )}

        <div className="flex h-8.5 items-center gap-2 bg-card p-1 rounded-full shadow-sm border border-border">
          <Globe size={14} className="ml-2 text-muted-foreground" />
          <Link href="/es" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'es' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm' : 'text-muted-foreground bg-muted/30 hover:bg-muted hover:text-foreground'}`}>ES</Link>
          <Link href="/ca" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'ca' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm' : 'text-muted-foreground bg-muted/30 hover:bg-muted hover:text-foreground'}`}>CA</Link>
        </div>

        <ModeToggle />
      </div>

      <div className="max-w-5xl mx-auto space-y-8 pt-12">

        {/* --- FORMULARI --- */}
        {isAdmin && (
          <div className="mb-8">
            <HealthDataForm onSuccess={refreshData} />
          </div>
        )}

        {/* --- NAVEGACIÓ (TABS) --- */}
        <div className="flex flex-wrap gap-2 md:gap-4 p-1 bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none justify-center gap-2 h-auto py-3 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-muted text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <Icon size={18} />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* --- ÀREA DE CONTINGUT --- */}
        <div className="min-h-100">

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">

              {/* --- BARRA D'EINES UNIFICADA --- */}
              <div className="flex justify-end items-center mb-4 px-1">
                <div className="bg-card p-1 rounded-xl border border-border flex items-center shadow-sm">

                  {/* Grup 1: Exportació */}
                  <Button
                    variant="ghost"
                    onClick={() => downloadCSV(metrics, 'historial_salud', t)}
                    className="gap-1.5 h-auto px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    title={t('Dashboard.downloadCSV')}
                  >
                    <FileSpreadsheet size={16} /> <span>CSV</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => downloadXML(metrics, 'historial_salud', t)}
                    className="gap-1.5 h-auto px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    title={t('Dashboard.downloadXML')}
                  >
                    <FileCode size={16} /> <span>XML</span>
                  </Button>

                  {/* Separador Vertical */}
                  <div className="w-px h-6 bg-border mx-2"></div>

                  {/* Grup 2: Vistes */}
                  <Button
                    variant="ghost"
                    onClick={() => setViewMode('grid')}
                    className={`h-auto p-2 rounded-lg ${viewMode === 'grid' ? 'bg-muted text-foreground shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
                    title={t('History.cardView')}
                  >
                    <LayoutGrid size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setViewMode('table')}
                    className={`h-auto p-2 rounded-lg ${viewMode === 'table' ? 'bg-muted text-foreground shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
                    title={t('History.tableView')}
                  >
                    <List size={18} />
                  </Button>
                </div>
              </div>

              {metrics.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
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
          <div className="mt-10 text-center text-muted-foreground text-sm pb-10">
            <p>{t('HomePage.viewModeMessage')}</p>
          </div>
        )}

      </div>
    </div>
  );
}