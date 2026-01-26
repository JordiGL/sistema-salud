'use client';

import { useState, useEffect } from 'react';
import { HealthMetric, deleteMetric, updateMetric, fetchContextOptions, fetchLocationOptions, SelectOption } from '@/lib/api';
import { Pencil, Trash2, X, Save, AlertTriangle, FileText, MapPin, MoveHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';

interface HistoryTableViewProps {
  data: HealthMetric[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function HistoryTableView({ data, isAdmin, onRefresh }: HistoryTableViewProps) {
  const t = useTranslations();
  
  // --- ESTATS ---
  const [metricToDelete, setMetricToDelete] = useState<HealthMetric | null>(null);
  const [metricToEdit, setMetricToEdit] = useState<HealthMetric | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estats Opcions Dinàmiques (per al modal d'edició)
  const [contextOptions, setContextOptions] = useState<SelectOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  const [editForm, setEditForm] = useState<any>({});

  // Cargar opcions al muntar
  useEffect(() => {
    async function loadOptions() {
        try {
            const [ctx, loc] = await Promise.all([fetchContextOptions(), fetchLocationOptions()]);
            setContextOptions(ctx);
            setLocationOptions(loc);
        } catch (e) { console.error(e); }
    }
    loadOptions();
  }, []);

  const translateOption = (category: string, option: SelectOption) => {
      // Intenta traduir la clau, si falla (retorna la clau amb punts), usa el valor original
      const translated = t(`${category}.${option.key}` as any);
      return translated.includes(category) ? option.value : translated; 
  };

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
      weightLocation: metric.weightLocation || '',
      ca125: metric.ca125 || ''
    });
  };

  const handleDelete = async () => {
    if (!metricToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteMetric(metricToDelete.id);
      setMetricToDelete(null);
      onRefresh();
    } catch (e) { alert("Error"); } 
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
        ca125: editForm.ca125 ? Number(editForm.ca125) : undefined,
        measurementContext: editForm.measurementContext || undefined,
        weightLocation: editForm.weightLocation || undefined,
    };

    try {
      await updateMetric(metricToEdit.id, payload);
      setMetricToEdit(null);
      onRefresh();
    } catch (e) { alert("Error"); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      {/* --- AVÍS DE SCROLL (Només mòbil) --- */}
      <div className="md:hidden flex items-center justify-end gap-2 text-xs text-slate-400 mb-2 animate-pulse">
        <span>{t('History.scrollHint')}</span>
        <MoveHorizontal size={16} />
      </div>

      {/* --- TAULA RESPONSIVA --- */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white relative">
        
        {/* Barra de scroll estilitzada */}
        <div className="overflow-x-auto w-full pb-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 transition-colors">
          
          <table className="w-full min-w-full text-sm text-left border-collapse whitespace-nowrap">
            
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[120px]">{t('History.cols.date')}</th>
                <th className="px-4 py-3 min-w-[140px]">{t('History.cols.context')}</th>
                <th className="px-4 py-3 min-w-[100px]">{t('History.cols.bp')}</th>
                <th className="px-4 py-3 min-w-[80px]">{t('History.cols.pulse')}</th>
                <th className="px-4 py-3 min-w-[80px]">{t('History.cols.spo2')}</th>
                <th className="px-4 py-3 border-l border-slate-300 min-w-[100px]">{t('History.cols.weight')}</th>
                <th className="px-4 py-3 min-w-[120px]">{t('History.cols.site')}</th> 
                <th className="px-4 py-3 border-l border-slate-300 min-w-[150px]">{t('History.cols.note')}</th>
                {isAdmin && <th className="px-4 py-3 text-right border-l border-slate-300 min-w-[100px] sticky right-0 bg-slate-50 shadow-[-5px_0px_10px_rgba(0,0,0,0.02)]">{t('History.cols.actions')}</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const dateObj = new Date(row.createdAt);
                
                // Lògica de colors
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
                          <span className="text-xs text-slate-400 font-normal">{dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {row.measurementContext ? (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium inline-block border border-slate-200">
                              {row.measurementContext}
                          </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    
                    <td className="px-4 py-3">
                      {row.bloodPressure ? (
                          <span className="font-bold">
                              <span className={STATUS_COLORS[sysStatus].text}>{sys}</span>
                              <span className="text-slate-300 mx-0.5">/</span>
                              <span className={STATUS_COLORS[diaStatus].text}>{dia}</span>
                          </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    <td className={`px-4 py-3 font-bold`}>
                      {row.pulse ? <span className={STATUS_COLORS[pulseStatus].text}>{row.pulse}</span> : <span className="text-slate-300">-</span>}
                    </td>

                    <td className={`px-4 py-3 font-bold`}>
                        {row.spo2 ? <span className={STATUS_COLORS[spo2Status].text}>{row.spo2}%</span> : <span className="text-slate-300">-</span>}
                    </td>

                    <td className="px-4 py-3 border-l border-slate-100">
                      {row.weight ? <span className="font-bold text-slate-700">{row.weight} kg</span> : <span className="text-slate-300">-</span>}
                    </td>

                    <td className="px-4 py-3">
                      {row.weightLocation ? (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1 w-fit border border-slate-200">
                             <MapPin size={10} /> {row.weightLocation}
                          </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    <td className="px-4 py-3 border-l border-slate-100">
                      {row.notes ? (
                          <div className="flex items-center gap-1 text-xs text-slate-600 italic max-w-[150px] truncate" title={row.notes}>
                               <FileText size={12} className="shrink-0 text-slate-400"/>
                               <span className="truncate">{row.notes}</span>
                          </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    {isAdmin && (
                      <td className="px-4 py-3 text-right border-l border-slate-100 sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-5px_0px_10px_rgba(0,0,0,0.02)]">
                          <div className="flex justify-end gap-2">
                              <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={16}/></button>
                              <button onClick={() => setMetricToDelete(row)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
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

      {/* --- MODAL ELIMINAR --- */}
      {metricToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={32} /></div>
              <h3 className="text-lg font-bold text-slate-800">{t('History.deleteTitle')}</h3>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setMetricToDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">{t('History.cancel')}</button>
                <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50">{t('History.delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR --- */}
      {metricToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Pencil size={18} /> {t('History.editTitle')}</h3>
              <button onClick={() => setMetricToEdit(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.bpLabel')}</label><input type="text" className="w-full p-2 border rounded-lg mt-1" value={editForm.bloodPressure} onChange={e => setEditForm({...editForm, bloodPressure: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.pulseLabel')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.pulse} onChange={e => setEditForm({...editForm, pulse: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.spo2Label')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.spo2} onChange={e => setEditForm({...editForm, spo2: e.target.value})} /></div>
                  
                  {/* Select Contextos */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{t('Form.contextLabel')}</label>
                    <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={editForm.measurementContext} onChange={e => setEditForm({...editForm, measurementContext: e.target.value})}>
                        <option value="">-</option>
                        {contextOptions.map(opt => (
                            <option key={opt.key} value={opt.value}>{translateOption('ContextOptions', opt)}</option>
                        ))}
                    </select>
                  </div>

                  <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.weightLabel')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} /></div>
                  
                  {/* Select Ubicaciones */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{t('Form.locationLabel')}</label>
                    <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={editForm.weightLocation} onChange={e => setEditForm({...editForm, weightLocation: e.target.value})}>
                        <option value="">-</option>
                        {locationOptions.map(opt => (
                            <option key={opt.key} value={opt.value}>{translateOption('LocationOptions', opt)}</option>
                        ))}
                    </select>
                  </div>

                  {/* CA125 */}
                  <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.ca125Label')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.ca125} onChange={e => setEditForm({...editForm, ca125: e.target.value})} /></div>
               </div>
               
               <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.notes')}</label><textarea className="w-full p-2 border rounded-lg mt-1 h-20 resize-none" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></div>
               
               <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMetricToEdit(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">{t('History.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2"><Save size={18} /> {t('History.save')}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}