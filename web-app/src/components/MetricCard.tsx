'use client';

import { useState } from 'react';
import { HealthMetric, deleteMetric, updateMetric } from '@/lib/api';
import { Activity, Heart, Droplets, Scale, MapPin, FileText, Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthCriteria, STATUS_COLORS, HealthStatus } from '@/lib/health-criteria';

interface MetricCardProps {
  data: HealthMetric;
  isAdmin: boolean;       
  onRefresh: () => void;  
}

export function MetricCard({ data, isAdmin, onRefresh }: MetricCardProps) {
  const t = useTranslations(); 
  const dateObj = new Date(data.createdAt);

  // Estados para los Modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del formulario de edición
  const [editForm, setEditForm] = useState({
    bloodPressure: data.bloodPressure || '',
    pulse: data.pulse || '',
    spo2: data.spo2 || '',
    weight: data.weight || '',
    notes: data.notes || '',
    measurementContext: data.measurementContext || '',
    weightLocation: data.weightLocation || ''
  });

  // --- LÓGICA DE BORRADO ---
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteMetric(data.id);
      setIsDeleteModalOpen(false);
      onRefresh(); 
    } catch (error) {
      alert("Error al eliminar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE EDICIÓN ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await updateMetric(data.id, payload);
      setIsEditModalOpen(false);
      onRefresh(); 
    } catch (error) {
      alert("Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CÁLCULO DE ESTADOS VISUALES ---
  let sysStatus: HealthStatus = 'normal';
  let diaStatus: HealthStatus = 'normal';
  let sys = 0, dia = 0;
  if (data.bloodPressure) {
    const parts = data.bloodPressure.split('/');
    if (parts.length === 2) {
      sys = Number(parts[0]);
      dia = Number(parts[1]);
      sysStatus = HealthCriteria.getSystolicStatus(sys);
      diaStatus = HealthCriteria.getDiastolicStatus(dia);
    }
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
          
          {/* BOTONES SOLO PARA ADMIN */}
          {isAdmin && (
            <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded">
                    <Pencil size={14} /> {t('History.edit')}
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded">
                    <Trash2 size={14} /> {t('History.delete')}
                </button>
            </div>
          )}
        </div>

        {/* CUERPO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-2">
          {data.bloodPressure && (
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Activity size={12} /> Tensión</span>
                  <div className="text-2xl font-bold flex items-baseline">
                      <span className={STATUS_COLORS[sysStatus].text}>{sys}</span>
                      <span className="text-slate-300 text-lg font-light mx-0.5">/</span>
                      <span className={STATUS_COLORS[diaStatus].text}>{dia}</span>
                  </div>
               </div>
          )}
          {data.pulse && (
              <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Heart size={12} /> Pulso</span>
                  <div className={`text-2xl font-bold ${STATUS_COLORS[pulseStatus].text} flex items-baseline gap-1`}>
                      {data.pulse} <span className="text-xs text-slate-400 font-bold">BPM</span>
                  </div>
              </div>
          )}
          {data.spo2 && (
              <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Droplets size={12} /> SpO2</span>
                  <div className={`text-2xl font-bold ${STATUS_COLORS[spo2Status].text} flex items-baseline`}>
                      {data.spo2}<span className="text-sm text-slate-400 font-bold">%</span>
                  </div>
              </div>
          )}
           {data.weight && (
              <div className="flex flex-col col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider"><Scale size={12} /> Peso</span>
                  <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                      {data.weight} <span className="text-xs text-slate-400 font-bold">kg</span>
                  </div>
                  {data.weightLocation && <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium"><MapPin size={10} /> {data.weightLocation}</div>}
              </div>
          )}
        </div>

        {/* FOOTER */}
        {(data.measurementContext || data.notes) && (
          <div className="bg-slate-50 p-3 rounded-lg mt-1 text-sm border border-slate-100/80">
              {data.measurementContext && <div className="mb-1 text-purple-700 font-bold text-xs uppercase tracking-wide">{data.measurementContext}</div>}
              {data.notes && <div className="text-slate-600 italic flex gap-2 items-start text-[13px] leading-relaxed"><FileText size={14} className="mt-1 opacity-40 flex-shrink-0 text-slate-500" /><span>{data.notes}</span></div>}
          </div>
        )}
      </div>

      {/* --- MODAL ELIMINAR --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">¿Eliminar registro?</h3>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer. Se borrarán los datos permanentemente.</p>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50">
                  {isSubmitting ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Pencil size={18} /> Editar Registro</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tensión */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Tensión</label>
                  <input type="text" className="w-full p-2 border rounded-lg mt-1" value={editForm.bloodPressure} onChange={e => setEditForm({...editForm, bloodPressure: e.target.value})} />
                </div>
                {/* Pulso */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Pulso</label>
                  <input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.pulse} onChange={e => setEditForm({...editForm, pulse: e.target.value})} />
                </div>
                {/* SpO2 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">SpO2</label>
                  <input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.spo2} onChange={e => setEditForm({...editForm, spo2: e.target.value})} />
                </div>
                
                {/* --- AHORA AQUÍ: CONTEXTO --- */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Contexto</label>
                    <select 
                        className="w-full p-2 border rounded-lg mt-1 text-sm bg-white"
                        value={editForm.measurementContext} 
                        onChange={e => setEditForm({...editForm, measurementContext: e.target.value})}
                    >
                        <option value="">-</option>
                        <option value="Post-Ejercicio">{t('ContextOptions.exercise')}</option>
                        <option value="Post-Drenaje">{t('ContextOptions.drainage')}</option>
                        <option value="Post-Quimioterapia">{t('ContextOptions.chemo')}</option>
                        <option value="Momento de estres">{t('ContextOptions.stress')}</option>
                    </select>
                </div>

                {/* --- AHORA AQUÍ: PESO --- */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Peso</label>
                  <input type="number" className="w-full p-2 border rounded-lg mt-1" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} />
                </div>
                
                {/* UBICACIÓN PESO */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Lugar Peso</label>
                    <select 
                        className="w-full p-2 border rounded-lg mt-1 text-sm bg-white"
                        value={editForm.weightLocation} 
                        onChange={e => setEditForm({...editForm, weightLocation: e.target.value})}
                    >
                        <option value="">-</option>
                        <option value="Casa">{t('LocationOptions.home')}</option>
                        <option value="Farmacia">{t('LocationOptions.pharmacy')}</option>
                        <option value="CAP">{t('LocationOptions.cap')}</option>
                        <option value="ICO">{t('LocationOptions.ico')}</option>
                    </select>
                </div>
              </div>

              {/* Notas */}
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase">Notas</label>
                 <textarea className="w-full p-2 border rounded-lg mt-1 h-20 resize-none" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2">
                  <Save size={18} /> {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}