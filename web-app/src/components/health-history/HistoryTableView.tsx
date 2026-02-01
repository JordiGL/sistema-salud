'use client';

import { useState } from 'react';
import { Metric } from '@/types/metrics';
import { Pencil, Trash2, FileText, MapPin, MoveHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';
import { useMetricManager } from '@/hooks/useMetricManager';
import { EditMetricModal } from '@/components/modals/EditMetricModal';
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
  data: Metric[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function HistoryTableView({ data, isAdmin, onRefresh }: HistoryTableViewProps) {
  const t = useTranslations();
  const { renderContext, renderLocation, contextOptions, locationOptions, translateOption } = useMetricManager();

  const [metricToDelete, setMetricToDelete] = useState<Metric | null>(null);
  const [metricToEdit, setMetricToEdit] = useState<Metric | null>(null);
  const [noteToView, setNoteToView] = useState<Metric | null>(null);

  return (
    <>
      <div className="md:hidden flex items-center justify-end gap-2 text-xs text-slate-400 mb-2 animate-pulse">
        <span>{t('History.scrollHint')}</span><MoveHorizontal size={16} />
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="min-w-[100px]">{t('History.cols.date')}</TableHead>
              <TableHead className="min-w-[100px]">{t('History.cols.context')}</TableHead>
              <TableHead className="min-w-[100px]">{t('History.cols.bp')}</TableHead>
              <TableHead className="min-w-[60px]">{t('History.cols.pulse')}</TableHead>
              <TableHead className="min-w-[50px]">{t('History.cols.spo2')}</TableHead>
              <TableHead className="min-w-[70px] border-l">{t('History.cols.ca125')}</TableHead>
              <TableHead className="min-w-[90px] border-l">{t('History.cols.weight')}</TableHead>
              <TableHead className="min-w-[120px]">{t('History.cols.site')}</TableHead>
              <TableHead className="min-w-[50px] border-l">{t('History.cols.note')}</TableHead>
              {isAdmin && (
                <TableHead className="min-w-[70px] border-l text-right">
                  {t('History.cols.actions')}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row) => {
              const dateObj = new Date(row.createdAt);

              let sysStatus: HealthStatus = 'normal';
              let diaStatus: HealthStatus = 'normal';
              let sys = 0, dia = 0;
              if (row.bloodPressure) {
                const parts = row.bloodPressure.split('/');
                if (parts.length === 2) { sys = Number(parts[0]); dia = Number(parts[1]); sysStatus = HealthCriteria.getSystolicStatus(sys); diaStatus = HealthCriteria.getDiastolicStatus(dia); }
              }
              const pulseStatus = row.pulse ? HealthCriteria.getPulseStatus(row.pulse) : 'normal';
              const spo2Status = row.spo2 ? HealthCriteria.getSpO2Status(row.spo2) : 'normal';
              const activeStatuses: HealthStatus[] = [];
              if (row.bloodPressure) { activeStatuses.push(sysStatus); activeStatuses.push(diaStatus); }
              if (row.pulse) activeStatuses.push(pulseStatus);
              if (row.spo2) activeStatuses.push(spo2Status);
              const overallStatus = HealthCriteria.getWorstStatus(activeStatuses);
              const rowStyles = STATUS_COLORS[overallStatus];

              return (
                <TableRow key={row.id} className={`hover:bg-slate-50/80 transition-colors border-l-4 ${rowStyles.border}`}>
                  <TableCell className="font-medium text-slate-700">
                    <div className="flex flex-col">
                      <span>{dateObj.toLocaleDateString()}</span>
                      <span className="text-xs text-slate-400 font-normal">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {row.measurementContext ? (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium inline-block border border-slate-200">
                        {renderContext(row.measurementContext)}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </TableCell>

                  <TableCell>{row.bloodPressure ? <span className="font-bold"><span className={STATUS_COLORS[sysStatus].text}>{sys}</span><span className="text-slate-300 mx-0.5">/</span><span className={STATUS_COLORS[diaStatus].text}>{dia}</span></span> : <span className="text-slate-300">-</span>}</TableCell>
                  <TableCell className="font-bold">{row.pulse ? <span className={STATUS_COLORS[pulseStatus].text}>{row.pulse}</span> : <span className="text-slate-300">-</span>}</TableCell>
                  <TableCell className="font-bold">{row.spo2 ? <span className={STATUS_COLORS[spo2Status].text}>{row.spo2}</span> : <span className="text-slate-300">-</span>}</TableCell>
                  <TableCell className="border-l border-slate-100">{row.ca125 ? <span className="font-bold text-slate-700">{row.ca125}</span> : <span className="text-slate-300">-</span>}</TableCell>
                  <TableCell className="border-l border-slate-100">{row.weight ? <span className="font-bold text-slate-700">{row.weight}</span> : <span className="text-slate-300">-</span>}</TableCell>

                  <TableCell>
                    {row.weightLocation ? (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1 w-fit border border-slate-200">
                        <MapPin size={10} /> {renderLocation(row.weightLocation)}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </TableCell>

                  <TableCell className="border-l border-slate-100">
                    {row.notes ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNoteToView(row)}
                        className="h-8 w-full justify-start p-1.5 hover:bg-purple-50"
                        title={row.notes}
                      >
                        <FileText size={14} className="text-slate-400 hover:text-slate-800 transition-colors" />
                      </Button>
                    ) : <span className="text-slate-300">-</span>}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="border-l border-slate-100 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => setMetricToEdit(row)} className="h-8 w-8 text-slate-500 hover:text-slate-800">
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
    </>
  );
}