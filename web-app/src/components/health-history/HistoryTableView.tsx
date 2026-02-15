'use client';

import { useMemo, useState } from 'react';
import { Metric, HealthEvent } from '@/types/metrics';
import { Pencil, Trash2, FileText, MapPin, MoveHorizontal, ArrowUpDown, Syringe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';
import { useMetricManager } from '@/hooks/useMetricManager';
import { EditMetricModal } from '@/components/modals/EditMetricModal';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { DeleteMetricModal } from '@/components/modals/DeleteMetricModal';
import { ViewNoteModal } from '@/components/modals/ViewNoteModal';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HistoryTableViewProps {
  data: (Metric | HealthEvent)[];
  isAdmin: boolean;
  onRefresh: () => void;
  embedded?: boolean;
  visibleColumns?: string[];
}

export function HistoryTableView({ data, isAdmin, onRefresh, embedded = false, visibleColumns }: HistoryTableViewProps) {
  const t = useTranslations();
  const { renderContext, renderLocation, contextOptions, locationOptions, translateOption } = useMetricManager();

  const [metricToDelete, setMetricToDelete] = useState<Metric | HealthEvent | null>(null);
  const [metricToEdit, setMetricToEdit] = useState<Metric | null>(null);
  const [eventToEdit, setEventToEdit] = useState<HealthEvent | null>(null);
  const [noteToView, setNoteToView] = useState<Metric | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Metric | null; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  const isColumnVisible = (key: string) => {
    if (!visibleColumns) return true;
    return visibleColumns.includes(key);
  };

  const handleSort = (key: keyof Metric) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = (a as any)[sortConfig.key!];
        let bValue: any = (b as any)[sortConfig.key!];

        // Manejo especial para Tensión (sys/dia) -> ordenamos por sistólica
        if (sortConfig.key === 'bloodPressure') {
          const m1 = a as Metric;
          const m2 = b as Metric;
          const getSys = (v: string | undefined) => v ? parseInt(v.split('/')[0]) : -1;
          aValue = m1.bloodPressure ? getSys(m1.bloodPressure) : -1;
          bValue = m2.bloodPressure ? getSys(m2.bloodPressure) : -1;
        }
        // Manejo de fechas
        else if (sortConfig.key === 'createdAt') {
          const getDate = (item: any) => {
            return new Date(item.date || item.createdAt).getTime();
          };
          aValue = getDate(a);
          bValue = getDate(b);
        }

        // Manejo de nulos (siempre al final)
        if (aValue === undefined || aValue === null || aValue === -1) return 1;
        if (bValue === undefined || bValue === null || bValue === -1) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: keyof Metric }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <ArrowUpDown
        size={14}
        className={`ml-1 transition-all ${isActive ? 'text-primary opacity-100' : 'text-muted-foreground/50 opacity-0 group-hover:opacity-50'}`}
      />
    );
  };

  const containerClass = embedded
    ? "bg-transparent"
    : "bg-card rounded-md border-border border shadow-sm";

  return (
    <>
      <div className={containerClass}>
        <div className="md:hidden flex items-center justify-center gap-2 p-2 bg-muted/20 text-xs font-semibold text-muted-foreground border-b border-border">
          <MoveHorizontal size={14} className="animate-pulse" /> <span>{t('History.scrollHint')}</span> <MoveHorizontal size={14} className="animate-pulse" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {isColumnVisible('createdAt') && (
                <TableHead
                  className="min-w-[100px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    {t('History.cols.date')}
                    <SortIcon columnKey="createdAt" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('bloodPressure') && (
                <TableHead
                  className="min-w-[100px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('bloodPressure')}
                >
                  <div className="flex items-center">
                    {t('History.cols.bp')}
                    <SortIcon columnKey="bloodPressure" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('pulse') && (
                <TableHead
                  className="min-w-[60px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('pulse')}
                >
                  <div className="flex items-center">
                    {t('History.cols.pulse')}
                    <SortIcon columnKey="pulse" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('spo2') && (
                <TableHead
                  className="min-w-[50px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('spo2')}
                >
                  <div className="flex items-center">
                    {t('History.cols.spo2')}
                    <SortIcon columnKey="spo2" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('measurementContext') && (
                <TableHead
                  className="min-w-[100px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('measurementContext')}
                >
                  <div className="flex items-center">
                    {t('History.cols.context')}
                    <SortIcon columnKey="measurementContext" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('ca125') && (
                <TableHead
                  className="min-w-[70px] border-l cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('ca125')}
                >
                  <div className="flex items-center">
                    {t('History.cols.ca125')}
                    <SortIcon columnKey="ca125" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('weight') && (
                <TableHead
                  className="min-w-[90px] border-l cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('weight')}
                >
                  <div className="flex items-center">
                    {t('History.cols.weight')}
                    <SortIcon columnKey="weight" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('weightLocation') && (
                <TableHead
                  className="min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors group select-none"
                  onClick={() => handleSort('weightLocation')}
                >
                  <div className="flex items-center">
                    {t('History.cols.site')}
                    <SortIcon columnKey="weightLocation" />
                  </div>
                </TableHead>
              )}
              {isColumnVisible('notes') && (
                <TableHead className="min-w-[50px] border-l">{t('History.cols.note')}</TableHead>
              )}
              {isAdmin && isColumnVisible('actions') && (
                <TableHead className="min-w-[70px] border-l text-right">
                  {t('History.cols.actions')}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.map((row) => {
              const isEvent = (item: any): item is HealthEvent => item.type !== undefined;

              if (isEvent(row)) {
                const dateObj = new Date(row.date || row.createdAt);
                return (
                  <TableRow key={row.id} className="transition-colors hover:opacity-90 border-l-4 border-[var(--chart-event)]" style={{ backgroundColor: 'color-mix(in srgb, var(--chart-event), transparent 85%)' }}>
                    {isColumnVisible('createdAt') && (
                      <TableCell className="font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{dateObj.toLocaleDateString()}</span>
                          <span className="text-xs opacity-70 font-normal">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                    )}
                    {/* Empty cells for metrics */}
                    {isColumnVisible('bloodPressure') && (
                      <TableCell>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium inline-block border border-border">
                          {t(('HealthEvents.types.' + row.type) as any)}
                        </span>
                      </TableCell>
                    )}
                    {isColumnVisible('pulse') && <TableCell><span className="text-muted-foreground/10">-</span></TableCell>}
                    {isColumnVisible('spo2') && <TableCell><span className="text-muted-foreground/10">-</span></TableCell>}
                    {isColumnVisible('measurementContext') && <TableCell><span className="text-muted-foreground/10">-</span></TableCell>}
                    {isColumnVisible('ca125') && <TableCell className="border-l border-border"><span className="text-muted-foreground/10">-</span></TableCell>}
                    {isColumnVisible('weight') && <TableCell className="border-l border-border"><span className="text-muted-foreground/10">-</span></TableCell>}
                    {isColumnVisible('weightLocation') && <TableCell><span className="text-muted-foreground/10">-</span></TableCell>}

                    {isColumnVisible('notes') && (
                      <TableCell className="border-l border-border">
                        {row.notes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNoteToView(row as any)}
                            className="h-8 w-full justify-start p-1.5 hover:bg-event-chemo-muted"
                            title={row.notes}
                          >
                            <FileText size={14} className="text-event-chemo" />
                          </Button>
                        ) : <span className="text-muted-foreground/30">-</span>}
                      </TableCell>
                    )}

                    {isAdmin && isColumnVisible('actions') && (
                      <TableCell className="border-l border-border text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => setEventToEdit(row)} className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary">
                            <Pencil size={16} />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => setMetricToDelete(row)} className="h-8 w-8">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }

              const dateObj = new Date(row.createdAt);

              let sysStatus: HealthStatus = 'normal';
              let diaStatus: HealthStatus = 'normal';
              let sys = 0, dia = 0;
              const activeStatuses: HealthStatus[] = [];

              if (isColumnVisible('bloodPressure') && row.bloodPressure) {
                const parts = row.bloodPressure.split('/');
                if (parts.length === 2) {
                  sys = Number(parts[0]);
                  dia = Number(parts[1]);
                  sysStatus = HealthCriteria.getSystolicStatus(sys);
                  diaStatus = HealthCriteria.getDiastolicStatus(dia);
                  activeStatuses.push(sysStatus);
                  activeStatuses.push(diaStatus);
                }
              }

              let pulseStatus: HealthStatus = 'normal';
              if (isColumnVisible('pulse') && row.pulse) {
                pulseStatus = HealthCriteria.getPulseStatus(row.pulse);
                activeStatuses.push(pulseStatus);
              }

              let spo2Status: HealthStatus = 'normal';
              if (isColumnVisible('spo2') && row.spo2) {
                spo2Status = HealthCriteria.getSpO2Status(row.spo2);
                activeStatuses.push(spo2Status);
              }

              const overallStatus = HealthCriteria.getWorstStatus(activeStatuses);
              const rowStyles = STATUS_COLORS[overallStatus];

              return (
                <TableRow key={row.id} className={`hover:bg-hover transition-colors border-l-4 ${rowStyles.border}`}>
                  {isColumnVisible('createdAt') && (
                    <TableCell className="font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{dateObj.toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground font-normal">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                  )}

                  {isColumnVisible('bloodPressure') && (
                    <TableCell>{row.bloodPressure ? <span className="font-bold"><span className={STATUS_COLORS[sysStatus].text}>{sys}</span><span className="text-muted-foreground/40 mx-0.5">/</span><span className={STATUS_COLORS[diaStatus].text}>{dia}</span></span> : <span className="text-muted-foreground/30">-</span>}</TableCell>
                  )}
                  {isColumnVisible('pulse') && (
                    <TableCell className="font-bold">{row.pulse ? <span className={STATUS_COLORS[pulseStatus].text}>{row.pulse}</span> : <span className="text-muted-foreground/30">-</span>}</TableCell>
                  )}
                  {isColumnVisible('spo2') && (
                    <TableCell className="font-bold">{row.spo2 ? <span className={STATUS_COLORS[spo2Status].text}>{row.spo2}</span> : <span className="text-muted-foreground/30">-</span>}</TableCell>
                  )}
                  {isColumnVisible('measurementContext') && (
                    <TableCell>
                      {row.measurementContext ? (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium inline-block border border-border">
                          {renderContext(row.measurementContext)}
                        </span>
                      ) : <span className="text-muted-foreground/30">-</span>}
                    </TableCell>
                  )}
                  {isColumnVisible('ca125') && (
                    <TableCell className="border-l border-border">{row.ca125 ? <span className="font-bold text-foreground">{row.ca125}</span> : <span className="text-muted-foreground/30">-</span>}</TableCell>
                  )}
                  {isColumnVisible('weight') && (
                    <TableCell className="border-l border-border">{row.weight ? <span className="font-bold text-foreground">{row.weight}</span> : <span className="text-muted-foreground/30">-</span>}</TableCell>
                  )}

                  {isColumnVisible('weightLocation') && (
                    <TableCell>
                      {row.weightLocation ? (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1 w-fit border border-border">
                          <MapPin size={10} /> {renderLocation(row.weightLocation)}
                        </span>
                      ) : <span className="text-muted-foreground/30">-</span>}
                    </TableCell>
                  )}

                  {isColumnVisible('notes') && (
                    <TableCell className="border-l border-border">
                      {row.notes ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNoteToView(row)}
                          className="h-8 w-full justify-start p-1.5 hover:bg-hover"
                          title={row.notes}
                        >
                          <FileText size={14} className="text-muted-foreground hover:text-foreground transition-colors" />
                        </Button>
                      ) : <span className="text-muted-foreground/30">-</span>}
                    </TableCell>
                  )}
                  {isAdmin && isColumnVisible('actions') && (
                    <TableCell className="border-l border-border text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => setMetricToEdit(row)} className="h-8 w-8 text-foreground border border-input shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => setMetricToDelete(row)} className="h-8 w-8">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {metricToDelete && (
        <DeleteMetricModal
          isOpen={!!metricToDelete}
          onClose={() => setMetricToDelete(null)}
          metricId={metricToDelete.id}
          onSuccess={onRefresh}
          type={(metricToDelete as any).type ? 'event' : 'metric'}
        />
      )}

      {metricToEdit && (
        <EditMetricModal
          isOpen={!!metricToEdit}
          onClose={() => setMetricToEdit(null)}
          metric={metricToEdit}
          onSuccess={onRefresh}
          contextOptions={contextOptions}
          locationOptions={locationOptions}
          translateOption={translateOption}
        />
      )}

      {noteToView && (
        <ViewNoteModal
          isOpen={!!noteToView}
          onClose={() => setNoteToView(null)}
          note={noteToView.notes || ''}
          date={new Date(noteToView.createdAt)}
        />
      )}

      {eventToEdit && (
        <EditEventModal
          isOpen={!!eventToEdit}
          onClose={() => setEventToEdit(null)}
          event={eventToEdit}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}