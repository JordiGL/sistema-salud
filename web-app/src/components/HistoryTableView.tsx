'use client';

import { useState } from 'react';
import { HealthMetric, deleteMetric, updateMetric } from '@/lib/api';
import { Pencil, Trash2, X, Save, AlertTriangle, FileText, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';

interface HistoryTableViewProps {
  data: HealthMetric[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function HistoryTableView({ data, isAdmin, onRefresh }: HistoryTableViewProps) {
  const t = useTranslations();
  
  // --- ESTADOS PARA MODALES ---
  const [metricToDelete, setMetricToDelete] = useState<HealthMetric | null>(null);
  const [metricToEdit, setMetricToEdit] = useState<HealthMetric | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario temporal
  const [editForm, setEditForm] = useState<any>({});

  // --- HANDLERS ---
  const openEditModal = (metric: HealthMetric) => {
    setMetricToEdit(metric);
    setEditForm({
      bloodPressure: metric.bloodPressure || '',
      pulse: metric.pulse || '',
      spo2: metric.spo2 || '',
      weight: metric.weight || '',
      notes: metric.notes || '',
      measurementContext: metric.measurementContext || '',
      weightLocation: metric.weightLocation || ''
    });
  };

  const handleDelete = async () => {
    if (!metricToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteMetric(metricToDelete.id);
      setMetricToDelete(null);
      onRefresh();
    } catch (e) { alert("Error al eliminar"); } 
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricToEdit) return;
    setIsSubmitting(true);
    
    const payload: Partial<HealthMetric> = {
        bloodPressure: editForm.bloodPressure || undefined,
        notes: editForm.notes || undefined,
        pulse: editForm.pulse ? Number(editForm.pulse) : undefined,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        spo2: editForm.spo2 ? Number(editForm.spo2) : undefined,
        measurementContext: editForm.measurementContext || undefined,
        weightLocation: editForm.weightLocation || undefined,
    };

    try {
      await updateMetric(metricToEdit.id, payload);
      setMetricToEdit(null);
      onRefresh();
    } catch (e) { alert("Error al actualizar"); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm text-left border-collapse">
          {/* CABECERA: Todo alineado a la izquierda (text-left es el default) excepto Acciones */}
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 min-w-25">{t('History.cols.date')}</th>
              <th className="px-4 py-3">{t('History.cols.context')}</th>
              
              {/* Eliminados los 'text-center' para unificar a la izquierda */}
              <th className="px-4 py-3">{t('History.cols.bp')}</th>
              <th className="px-4 py-3">{t('History.cols.pulse')}</th>
              <th className="px-4 py-3">{t('History.cols.spo2')}</th>
              
              <th className="px-4 py-3 border-l border-slate-300">{t('History.cols.weight')}</th>
              <th className="px-4 py-3 hidden md:table-cell">{t('History.cols.site')}</th> 
              
              <th className="px-4 py-3 max-w-50 border-l border-slate-300">{t('History.cols.note')}</th>
              
              {/* Acciones se suele mantener a la derecha por convención, pero si lo quieres a la izquierda quita 'text-right' */}
              {isAdmin && <th className="px-4 py-3 text-right border-l border-slate-300">{t('History.cols.actions')}</th>}
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
                 if (parts.length === 2) {
                     sys = Number(parts[0]);
                     dia = Number(parts[1]);
                     sysStatus = HealthCriteria.getSystolicStatus(sys);
                     diaStatus = HealthCriteria.getDiastolicStatus(dia);
                 }
              }

              const pulseStatus: HealthStatus = row.pulse ? HealthCriteria.getPulseStatus(row.pulse) : 'normal';
              const spo2Status: HealthStatus = row.spo2 ? HealthCriteria.getSpO2Status(row.spo2) : 'normal';

              const activeStatuses: HealthStatus[] = [];
              if (row.bloodPressure) { activeStatuses.push(sysStatus); activeStatuses.push(diaStatus); }
              if (row.pulse) activeStatuses.push(pulseStatus);
              if (row.spo2) activeStatuses.push(spo2Status);
              
              const overallStatus = HealthCriteria.getWorstStatus(activeStatuses);
              const rowStyles = STATUS_COLORS[overallStatus];

              return (
                <tr 
                    key={row.id} 
                    className={`hover:bg-slate-50/80 transition-colors border-l-4 ${rowStyles.border}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span>{dateObj.toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400 font-normal">{dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.measurementContext ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium whitespace-nowrap inline-block">
                            {row.measurementContext}
                        </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  
                  {/* TENSIÓN: Alineado a la izquierda */}
                  <td className="px-4 py-3">
                    {row.bloodPressure ? (
                        <span className="font-bold">
                            <span className={STATUS_COLORS[sysStatus].text}>{sys}</span>
                            <span className="text-slate-300 mx-0.5">/</span>
                            <span className={STATUS_COLORS[diaStatus].text}>{dia}</span>
                        </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* PULSO: Alineado a la izquierda */}
                  <td className={`px-4 py-3 font-bold`}>
                    {row.pulse ? (
                        <span className={STATUS_COLORS[pulseStatus].text}>{row.pulse}</span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* SPO2: Alineado a la izquierda */}
                  <td className={`px-4 py-3 font-bold`}>
                     {row.spo2 ? (
                        <span className={STATUS_COLORS[spo2Status].text}>{row.spo2}%</span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* PESO: Alineado a la izquierda */}
                  <td className="px-4 py-3 border-l border-slate-100">
                    {row.weight ? (
                        <span className="font-bold text-slate-700">{row.weight} kg</span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* LUGAR DEL PESO: Alineado a la izquierda */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {row.weightLocation ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center justify-center gap-1 w-fit">
                           <MapPin size={10} /> {row.weightLocation}
                        </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* NOTAS */}
                  <td className="px-4 py-3 max-w-50 border-l border-slate-100">
                    {row.notes ? (
                        <div className="flex items-start gap-1 text-xs text-slate-600 italic" title={row.notes}>
                             <FileText size={12} className="shrink-0 mt-0.5 text-slate-400"/>
                             <span className="truncate">{row.notes}</span>
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>

                  {/* ACCIONES (Se mantiene a la derecha por estándar, pero puedes cambiarlo) */}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right border-l border-slate-100">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={16}/></button>
                            <button onClick={() => setMetricToDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MODALES --- */}
      {metricToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={32} /></div>
              <h3 className="text-lg font-bold text-slate-800">¿Eliminar registro?</h3>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setMetricToDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {metricToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Pencil size={18} /> Editar Registro</h3>
              <button onClick={() => setMetricToEdit(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Tensión</label><input type="text" className="w-full p-2 border rounded-lg mt-1" value={editForm.bloodPressure} onChange={e => setEditForm({...editForm, bloodPressure: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Pulso</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.pulse} onChange={e => setEditForm({...editForm, pulse: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">SpO2</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.spo2} onChange={e => setEditForm({...editForm, spo2: e.target.value})} /></div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Contexto</label>
                    <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={editForm.measurementContext} onChange={e => setEditForm({...editForm, measurementContext: e.target.value})}>
                        <option value="">-</option>
                        <option value="Post-Ejercicio">{t('ContextOptions.exercise')}</option>
                        <option value="Post-Drenaje">{t('ContextOptions.drainage')}</option>
                        <option value="Post-Quimioterapia">{t('ContextOptions.chemo')}</option>
                        <option value="Momento de estres">{t('ContextOptions.stress')}</option>
                    </select>
                  </div>

                  <div><label className="text-xs font-bold text-slate-500 uppercase">Peso</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} /></div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Lugar Peso</label>
                    <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={editForm.weightLocation} onChange={e => setEditForm({...editForm, weightLocation: e.target.value})}>
                        <option value="">-</option>
                        <option value="Casa">{t('LocationOptions.home')}</option>
                        <option value="Farmacia">{t('LocationOptions.pharmacy')}</option>
                        <option value="CAP">{t('LocationOptions.cap')}</option>
                        <option value="ICO">{t('LocationOptions.ico')}</option>
                    </select>
                  </div>
               </div>
               <div><label className="text-xs font-bold text-slate-500 uppercase">Notas</label><textarea className="w-full p-2 border rounded-lg mt-1 h-20 resize-none" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></div>
               
               <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMetricToEdit(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2"><Save size={18} /> Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}