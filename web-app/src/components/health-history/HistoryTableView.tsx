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

      <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white relative">
        <div className="overflow-x-auto w-full pb-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 transition-colors">
          <table className="w-full min-w-full text-sm text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[100px]">{t('History.cols.date')}</th>
                <th className="px-4 py-3 min-w-[100px]">{t('History.cols.context')}</th>
                <th className="px-4 py-3 min-w-[100px]">{t('History.cols.bp')}</th>
                <th className="px-4 py-3 min-w-[60px]">{t('History.cols.pulse')}</th>
                <th className="px-4 py-3 min-w-[50px]">{t('History.cols.spo2')}</th>
                <th className="px-4 py-3 border-l border-slate-300 min-w-[70px]">{t('History.cols.ca125')}</th>
                <th className="px-4 py-3 border-l border-slate-300 min-w-[90px]">{t('History.cols.weight')}</th>
                <th className="px-4 py-3 min-w-[120px]">{t('History.cols.site')}</th>
                <th className="px-4 py-3 border-l border-slate-300 min-w-[50px]">{t('History.cols.note')}</th>
                {isAdmin && (
                  <th className="px-4 py-3 border-l border-slate-300 min-w-[70px]">
                    {t('History.cols.actions')}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
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
                  <tr key={row.id} className={`hover:bg-slate-50/80 transition-colors border-l-4 ${rowStyles.border}`}>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <div className="flex flex-col">
                        <span>{dateObj.toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400 font-normal">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {row.measurementContext ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium inline-block border border-slate-200">
                          {renderContext(row.measurementContext)}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    <td className="px-4 py-3">{row.bloodPressure ? <span className="font-bold"><span className={STATUS_COLORS[sysStatus].text}>{sys}</span><span className="text-slate-300 mx-0.5">/</span><span className={STATUS_COLORS[diaStatus].text}>{dia}</span></span> : <span className="text-slate-300">-</span>}</td>
                    <td className="px-4 py-3 font-bold">{row.pulse ? <span className={STATUS_COLORS[pulseStatus].text}>{row.pulse}</span> : <span className="text-slate-300">-</span>}</td>
                    <td className="px-4 py-3 font-bold">{row.spo2 ? <span className={STATUS_COLORS[spo2Status].text}>{row.spo2}</span> : <span className="text-slate-300">-</span>}</td>
                    <td className="px-4 py-3 border-l border-slate-100">{row.ca125 ? <span className="font-bold text-slate-700">{row.ca125}</span> : <span className="text-slate-300">-</span>}</td>
                    <td className="px-4 py-3 border-l border-slate-100">{row.weight ? <span className="font-bold text-slate-700">{row.weight}</span> : <span className="text-slate-300">-</span>}</td>

                    <td className="px-4 py-3">
                      {row.weightLocation ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1 w-fit border border-slate-200">
                          <MapPin size={10} /> {renderLocation(row.weightLocation)}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    <td className="px-4 py-3 border-l border-slate-100">
                      {row.notes ? (
                        <button
                          onClick={() => setNoteToView(row)}
                          className="group flex items-center gap-2 text-left w-full hover:bg-purple-50 p-1.5 rounded-lg transition-all"
                          title={row.notes}
                        >
                          <FileText size={14} className="shrink-0 text-slate-400 group-hover:text-slate-800 transition-colors" />
                        </button>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 border-l border-slate-100">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setMetricToEdit(row)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => setMetricToDelete(row)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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