'use client';

import { useState } from 'react';
import { Metric } from '@/types/metrics';
import { Activity, Heart, Droplets, Scale, MapPin, FileText, Pencil, Trash2, TestTube } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';
import { useMetricManager } from '@/hooks/useMetricManager';
import { EditMetricModal } from '@/components/modals/EditMetricModal';
import { DeleteMetricModal } from '@/components/modals/DeleteMetricModal';

interface MetricCardProps {
  data: Metric;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function MetricCard({ data, isAdmin, onRefresh }: MetricCardProps) {
  const t = useTranslations();
  const { renderContext, renderLocation, contextOptions, locationOptions, translateOption } = useMetricManager();
  const dateObj = new Date(data.createdAt);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ... (Calcul d'estats visuals igual que abans) ...
  let sysStatus: HealthStatus = 'normal';
  let diaStatus: HealthStatus = 'normal';
  let sys = 0, dia = 0;
  if (data.bloodPressure) {
    const parts = data.bloodPressure.split('/');
    if (parts.length === 2) { sys = Number(parts[0]); dia = Number(parts[1]); sysStatus = HealthCriteria.getSystolicStatus(sys); diaStatus = HealthCriteria.getDiastolicStatus(dia); }
  }
  let pulseStatus: HealthStatus = 'normal';
  if (data.pulse) pulseStatus = HealthCriteria.getPulseStatus(data.pulse);
  let spo2Status: HealthStatus = 'normal';
  if (data.spo2) spo2Status = HealthCriteria.getSpO2Status(data.spo2);
  const activeStatuses: HealthStatus[] = [];
  if (data.bloodPressure) { activeStatuses.push(sysStatus); activeStatuses.push(diaStatus); }
  if (data.pulse) activeStatuses.push(pulseStatus);
  if (data.spo2) activeStatuses.push(spo2Status);
  const overallStatus = HealthCriteria.getWorstStatus(activeStatuses);
  const cardStyles = STATUS_COLORS[overallStatus];

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${cardStyles.border} border-l-[6px] flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
        {/* CABECERA */}
        <div className="flex justify-between items-start border-b border-slate-50 pb-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-fit">
              {dateObj.toLocaleDateString()} <span className="text-slate-400 mx-1">|</span> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"><Pencil size={14} /> {t('History.edit')}</button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"><Trash2 size={14} /> {t('History.delete')}</button>
            </div>
          )}
        </div>

        {/* CUERPO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-2">
          {data.bloodPressure && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Activity size={12} /> {t('Form.bpLabel')}</span>
              <div className="text-2xl font-bold flex items-baseline">
                <span className={STATUS_COLORS[sysStatus].text}>{sys}</span>
                <span className="text-slate-300 text-lg font-light mx-0.5">/</span>
                <span className={STATUS_COLORS[diaStatus].text}>{dia}</span>
              </div>
            </div>
          )}
          {data.pulse && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Heart size={12} /> {t('Form.pulseLabel')}</span>
              <div className={`text-2xl font-bold ${STATUS_COLORS[pulseStatus].text} flex items-baseline gap-1`}>{data.pulse} <span className="text-xs text-slate-400 font-bold">BPM</span></div>
            </div>
          )}
          {data.spo2 && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Droplets size={12} /> {t('Form.spo2Label')}</span>
              <div className={`text-2xl font-bold ${STATUS_COLORS[spo2Status].text} flex items-baseline`}>{data.spo2}<span className="text-sm text-slate-400 font-bold">%</span></div>
            </div>
          )}
          {data.weight && (
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Scale size={12} /> {t('Form.weightLabel')}</span>
              <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">{data.weight} <span className="text-xs text-slate-400 font-bold">kg</span></div>
              {data.weightLocation && <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium"><MapPin size={10} /> {renderLocation(data.weightLocation)}</div>}
            </div>
          )}
          {data.ca125 && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><TestTube size={12} /> {t('Form.ca125Label')}</span>
              <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">{data.ca125}</div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {(data.measurementContext || data.notes) && (
          <div className="bg-slate-50 p-3 rounded-lg mt-1 text-sm border border-slate-100/80">
            {data.measurementContext && <div className="mb-1 text-purple-700 font-bold text-xs uppercase tracking-wide">{renderContext(data.measurementContext)}</div>}
            {data.notes && <div className="text-slate-600 italic flex gap-2 items-start text-[13px] leading-relaxed"><FileText size={14} className="mt-1 opacity-40 flex-shrink-0 text-slate-500" /><span>{data.notes}</span></div>}
          </div>
        )}
      </div>

      <DeleteMetricModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        metricId={data.id}
        onSuccess={onRefresh}
      />

      <EditMetricModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        metric={data}
        onSuccess={onRefresh}
        contextOptions={contextOptions}
        locationOptions={locationOptions}
        translateOption={translateOption}
      />
    </>
  );
}