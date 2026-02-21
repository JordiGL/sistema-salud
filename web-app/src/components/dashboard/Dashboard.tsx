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
import { Metric, HealthEvent } from '@/types/metrics';
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
import { DailyBriefingSection } from '@/components/dashboard/DailyBriefingSection';

import { Sidebar, SidebarContent } from '@/components/dashboard/Sidebar';

interface DashboardProps {
  initialMetrics: Metric[];
}

export function Dashboard({ initialMetrics }: DashboardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // --- ESTATS ---
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<'history' | 'bp' | 'pulse' | 'weight' | 'spo2' | 'ca125'>('history');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // --- EFECTES ---

  useEffect(() => {
    checkAuth();
    refreshData(); // Load initial data including events

    function handleAuthLogout() {
      setIsAdmin(false);
      setActiveTab('history');
      router.refresh();
      // Opcional: Mostrar un toast informatiu
    }

    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('focus', checkAuth); // Revalidar al tornar a la pestanya

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  // --- FUNCIONS ---
  function checkAuth() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      // Validar expiració del JWT
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        // Fixar format base64url a base64 estàndard per atob
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const payload = JSON.parse(jsonPayload);

        // Comprovar si ha expirat (amb 10s de marge)
        if (payload.exp && Date.now() >= (payload.exp * 1000 - 10000)) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          setIsAdmin(false);
          return;
        }
      }
    } catch (e) {
      console.error("Error validant token:", e);
      // Si el token és invàlid, el treiem per seguretat
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setIsAdmin(false);
    setActiveTab('history');
    router.refresh();
  }

  async function refreshData() {
    try {
      const [data, eventsData] = await Promise.all([
        metricApi.getAll(),
        metricApi.getEvents()
      ]);
      setMetrics(data);
      setEvents(eventsData);
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
    <div className="min-h-screen bg-background font-sans text-foreground flex">

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-[280px] flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-40 shadow-sm">
        <SidebarContent
          isAdmin={isAdmin}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col lg:pl-[280px] transition-all duration-300 w-full">

        {/* --- STICKY HEADER --- */}
        <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-card/80 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center px-4 gap-4">
            {/* Mobile Trigger (Hidden on Desktop) */}
            <Sidebar
              isAdmin={isAdmin}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />

            <div className="flex-1 flex items-center justify-between">
              <h1 className="font-bold text-lg tracking-tight lg:hidden">{getPageTitle()}</h1>
              <h1 className="font-bold text-xl tracking-tight hidden lg:block px-2">{getPageTitle()}</h1>
              {/* Optional: Add quick actions here if needed */}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 w-full">

          {/* --- AI BRIEFING --- */}
          {activeTab === 'history' && <DailyBriefingSection metrics={metrics} isAdmin={isAdmin} />}

          {/* --- FORMULARI --- */}
          {isAdmin && activeTab === 'history' && (
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
                      <span className="text-xs font-bold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        {metrics.length}
                      </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                      {/* Export Group */}
                      <div className="flex items-center bg-card rounded-lg border border-border p-1 shadow-sm">
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
                      {/* View Toggle */}
                      <div className="flex items-center bg-muted border border-border shadow-inner p-1 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode('grid')}
                          className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                          title={t('History.cardView')}
                        >
                          <LayoutGrid size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode('table')}
                          className={`h-8 w-8 rounded-md transition-all ${viewMode === 'table' ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
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
                            data={[...metrics, ...events]}
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

            {activeTab === 'bp' && <BloodPressureChart data={metrics} events={events} isAdmin={isAdmin} />}
            {activeTab === 'pulse' && <PulseChart data={metrics} events={events} isAdmin={isAdmin} />}
            {activeTab === 'weight' && <WeightChart data={metrics} events={events} isAdmin={isAdmin} />}
            {activeTab === 'spo2' && <SpO2Chart data={metrics} events={events} isAdmin={isAdmin} />}
            {activeTab === 'ca125' && <CA125Chart data={metrics} events={events} isAdmin={isAdmin} />}
          </div>
        </div>
      </div>
    </div>
  );
}