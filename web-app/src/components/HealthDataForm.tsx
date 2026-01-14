'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { saveMetric, HealthMetric } from '@/lib/api';
import { ClipboardList, Heart, Scale, Save, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'; 

interface HealthDataFormProps {
  onSuccess: () => void; 
}

export function HealthDataForm({ onSuccess }: HealthDataFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const initialFormState = {
    bloodPressure: '', pulse: '', weight: '', spo2: '', ca125: '',
    measurementContext: '', weightLocation: '', notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleReset = (e?: React.MouseEvent) => {
    if(e) {
        e.stopPropagation();
        e.preventDefault(); // Importante para evitar submits accidentales
    }
    setFormData(initialFormState);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload: Partial<HealthMetric> = {
        bloodPressure: formData.bloodPressure || undefined,
        measurementContext: formData.measurementContext || undefined,
        weightLocation: formData.weightLocation || undefined,
        notes: formData.notes || undefined,
        pulse: formData.pulse ? Number(formData.pulse) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        spo2: formData.spo2 ? Number(formData.spo2) : undefined,
        ca125: formData.ca125 ? Number(formData.ca125) : undefined,
    };

    try {
      await saveMetric(payload);
      handleReset(); 
      onSuccess();   
    } catch (err: any) { 
      if (err.message === "UNAUTHORIZED") {
        alert("Tu sesión ha caducado.");
        localStorage.removeItem('health_token');
        router.push(`/${locale}/login`);
      } else {
        alert(t('HomePage.errorSaving'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Estilos comunes
  const inputClasses = "w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden transition-all ${isOpen ? 'ring-1 ring-slate-200' : ''}`}>
        
        {/* CABECERA (Ahora más limpia, solo título y flecha) */}
        <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex justify-between items-center p-4 cursor-pointer transition-colors select-none ${isOpen ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
            title={isOpen ? "Contraer" : "Desplegar para añadir datos"}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Plus size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-700">
                    {t('HomePage.newRecord')} 
                </h2>
            </div>

            <div className="text-slate-400">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
        
        {/* CUERPO DEL FORMULARIO */}
        {isOpen && (
            <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* SECCIÓN 1: DATOS FISIOLÓGICOS */}
                    <div className="lg:col-span-8 p-5 rounded-xl border border-slate-200 bg-slate-50/30">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold border-b border-slate-200 pb-2">
                            <Heart size={18} /> {t('Form.physiologicalData')}
                        </div>

                        <div className="mb-4">
                            <label className={labelClasses}>{t('Form.contextLabel')}</label>
                            <select className={`${inputClasses} bg-white`} value={formData.measurementContext} onChange={e => setFormData({...formData, measurementContext: e.target.value})}>
                                <option value="">{t('Form.contextPlaceholder')}</option>
                                <option value="Post-Ejercicio">{t('ContextOptions.exercise')}</option>
                                <option value="Post-Drenaje">{t('ContextOptions.drainage')}</option>
                                <option value="Post-Quimioterapia">{t('ContextOptions.chemo')}</option>
                                <option value="Momento de estres">{t('ContextOptions.stress')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className={labelClasses}>{t('Form.bpLabel')}</label><input type="text" placeholder="120/80" className={`${inputClasses} text-center font-mono`} value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} /></div>
                            <div><label className={labelClasses}>{t('Form.pulseLabel')}</label><input type="number" placeholder="80" className={`${inputClasses} text-center font-mono`} value={formData.pulse} onChange={e => setFormData({...formData, pulse: e.target.value})} /></div>
                            <div><label className={labelClasses}>{t('Form.spo2Label')}</label><input type="number" placeholder="98" className={`${inputClasses} text-center font-mono`} value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} /></div>
                            <div><label className={labelClasses}>{t('Form.ca125Label')}</label><input type="number" placeholder="35.5" className={`${inputClasses} text-center font-mono`} value={formData.ca125} onChange={e => setFormData({...formData, ca125: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: CONTROL DE PESO */}
                    <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col h-full">
                         <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold border-b border-slate-200 pb-2">
                            <Scale size={18} /> {t('Form.weightControl')}
                        </div>
                        <div className="space-y-4 grow">
                            <div><label className={labelClasses}>{t('Form.locationLabel')}</label><select className={`${inputClasses} bg-white`} value={formData.weightLocation} onChange={e => setFormData({...formData, weightLocation: e.target.value})}><option value="">{t('Form.locationPlaceholder')}</option><option value="Casa">{t('LocationOptions.home')}</option><option value="Farmacia">{t('LocationOptions.pharmacy')}</option><option value="CAP">{t('LocationOptions.cap')}</option><option value="ICO">{t('LocationOptions.ico')}</option></select></div>
                            <div><label className={labelClasses}>{t('Form.weightLabel')}</label><input type="number" placeholder="75.5" className={`${inputClasses} text-center font-mono text-lg`} value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* FILA INFERIOR: NOTAS Y ACCIONES */}
                    <div className="lg:col-span-12 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('Form.notes')}</label>
                            <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none h-20 resize-none shadow-sm placeholder:text-slate-300 text-slate-700 transition-all" placeholder={t('Form.notesPlaceholder')} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>

                        {/* --- ZONA DE ACCIONES (NUEVO DISEÑO) --- */}
                        <div className="flex gap-3">
                            {/* Botón LIMPIAR (Secundario) */}
                            <button 
                                type="button" 
                                onClick={handleReset}
                                className="px-6 py-4 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center gap-2"
                                title="Limpiar formulario"
                            >
                                <RotateCcw size={18} /> 
                                <span className="hidden sm:inline">{t('HomePage.clear') || 'Limpiar'}</span>
                            </button>

                            {/* Botón GUARDAR (Principal, ocupa el resto) */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="flex-1 bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span>...</span>
                                ) : (
                                    <>
                                        <Save size={20} /> {t('HomePage.saveButton')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        )}
    </div>
  );
}