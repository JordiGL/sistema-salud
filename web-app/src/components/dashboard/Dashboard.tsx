'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutList, LayoutGrid, List,
  Table, Code
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

import { Sidebar } from '@/components/dashboard/Sidebar';

interface DashboardProps {
  initialMetrics: Metric[];
}

export function Dashboard({ initialMetrics }: DashboardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // --- ESTATS ---
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

  async function refreshData() {
    try {
      const data = await metricApi.getAll();
      setMetrics(data);
    } catch (error) {
      console.error("Error refrescant dades:", error);
    }
  }

  // --- HEADER TITLE ---
  const getPageTitle = () => {
    switch (activeTab) {
      case 'history': return t('Tabs.history');
      case 'bp': return t('Charts.bpTitle');
      case 'pulse': return t('Charts.pulseTitle');
      case 'weight': return t('Charts.weightTitle');
      case 'spo2': return t('Charts.spo2Title');
      case 'ca125': return t('Charts.ca125Title');
      default: return 'Vital.ai';
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Sidebar
            isAdmin={isAdmin}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
          <div className="flex-1 flex items-center justify-between">
            <h1 className="font-bold text-lg tracking-tight">{getPageTitle()}</h1>
            {/* Optional: Add quick actions here if needed */}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

        {/* --- FORMULARI --- */}
        {isAdmin && (
          <div className="mb-8">
            <HealthDataForm onSuccess={refreshData} />
          </div>
        )}

        {/* --- ÀREA DE CONTINGUT --- */}
        <div className="min-h-[500px]">

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Contenidor Integrat */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">

                {/* HEADER DE LA SECCIÓ DE HISTORIAL */}
                <div className="p-4 border-b border-border bg-muted/30 flex flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      {metrics.length}
                    </span>
                    <h3 className="hidden sm:block font-bold text-sm text-muted-foreground uppercase tracking-wider">Registros</h3>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {/* Export Group */}
                    <div className="flex items-center bg-background rounded-lg border border-border p-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadCSV(metrics, 'historial_salud', t)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        title={t('Dashboard.downloadCSV')}
                      >
                        <Table size={16} className="mr-1" /> <span className="text-xs font-bold">CSV</span>
                      </Button>
                      <div className="w-px h-4 bg-border mx-1"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadXML(metrics, 'historial_salud', t)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        title={t('Dashboard.downloadXML')}
                      >
                        <Code size={16} className="mr-1" /> <span className="text-xs font-bold">XML</span>
                      </Button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-background rounded-lg border border-border p-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('grid')}
                        className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        title={t('History.cardView')}
                      >
                        <LayoutGrid size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('table')}
                        className={`h-8 w-8 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        title={t('History.tableView')}
                      >
                        <List size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className={`min-h-[300px] ${viewMode === 'grid' ? 'p-6 bg-muted/10' : 'p-0'}`}>
                  {metrics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted mb-4 opacity-50">
                        <LayoutList size={32} />
                      </div>
                      <p className="font-medium">{t('Dashboard.noRecords')}</p>
                    </div>
                  ) : (
                    <>
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
                          embedded={true}
                        />
                      )}
                    </>
                  )}
                </div>

              </div>
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