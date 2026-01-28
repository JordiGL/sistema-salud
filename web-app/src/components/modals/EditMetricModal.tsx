'use client';

import { useState, useEffect } from 'react';
import { X, Save, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HealthMetric, updateMetric, SelectOption } from '@/lib/api';

interface EditMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: HealthMetric;
  onSuccess: () => void;
  contextOptions: SelectOption[];
  locationOptions: SelectOption[];
  translateOption: (cat: string, opt: SelectOption) => string;
}

export function EditMetricModal({ isOpen, onClose, metric, onSuccess, contextOptions, locationOptions, translateOption }: EditMetricModalProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialitzem estat amb valors buits segurs
  const [form, setForm] = useState({
    bloodPressure: metric?.bloodPressure || '',
    pulse: metric?.pulse || '',
    spo2: metric?.spo2 || '',
    ca125: metric?.ca125 || '',
    weight: metric?.weight || '',
    notes: metric?.notes || '',
    measurementContext: metric?.measurementContext || '',
    weightLocation: metric?.weightLocation || ''
  });

  // Actualitzem quan canvia la mètrica
  useEffect(() => {
    if (metric) {
      setForm({
        bloodPressure: metric.bloodPressure || '',
        pulse: metric.pulse || '',
        spo2: metric.spo2 || '',
        ca125: metric.ca125 || '',
        weight: metric.weight || '',
        notes: metric.notes || '',
        measurementContext: metric.measurementContext || '',
        weightLocation: metric.weightLocation || ''
      });
    }
  }, [metric]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload: Partial<HealthMetric> = {
        bloodPressure: form.bloodPressure || undefined,
        notes: form.notes || undefined,
        pulse: form.pulse ? Number(form.pulse) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        ca125: form.ca125 ? Number(form.ca125) : undefined,
        measurementContext: form.measurementContext || undefined,
        weightLocation: form.weightLocation || undefined,
    };

    try {
      await updateMetric(metric.id, payload);
      onSuccess();
      onClose();
    } catch (e) { 
      alert("Error al guardar"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Pencil size={18} /> {t('History.editTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.bpLabel')}</label><input type="text" className="w-full p-2 border rounded-lg mt-1" value={form.bloodPressure} onChange={e => setForm({...form, bloodPressure: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.pulseLabel')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={form.pulse} onChange={e => setForm({...form, pulse: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.spo2Label')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={form.spo2} onChange={e => setForm({...form, spo2: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.ca125Label')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={form.ca125} onChange={e => setForm({...form, ca125: e.target.value})} /></div>
              
              {/* Context */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">{t('Form.contextLabel')}</label>
                <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={form.measurementContext} onChange={e => setForm({...form, measurementContext: e.target.value})}>
                    <option value="">-</option>
                    {contextOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{translateOption('ContextOptions', opt)}</option>
                    ))}
                </select>
              </div>

              <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.weightLabel')}</label><input type="number" className="w-full p-2 border rounded-lg mt-1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
              
              {/* Location */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">{t('Form.locationLabel')}</label>
                <select className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" value={form.weightLocation} onChange={e => setForm({...form, weightLocation: e.target.value})}>
                    <option value="">-</option>
                    {locationOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{translateOption('LocationOptions', opt)}</option>
                    ))}
                </select>
              </div>
           </div>
           
           <div><label className="text-xs font-bold text-slate-500 uppercase">{t('Form.notes')}</label><textarea className="w-full p-2 border rounded-lg mt-1 h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
           
           <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">{t('History.cancel')}</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"><Save size={18} /> {t('History.save')}</button>
           </div>
        </form>
      </div>
    </div>
  );
}