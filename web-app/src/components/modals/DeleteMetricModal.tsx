'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { toast } from 'sonner';

interface DeleteMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricId: string;
  onSuccess: () => void;
}

export function DeleteMetricModal({ isOpen, onClose, metricId, onSuccess }: DeleteMetricModalProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await metricApi.delete(metricId); // NOVA CRIDA
      toast.success(t('History.delete')); // Feedback 
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || t('HomePage.errorSaving'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={32} /></div>
          <h3 className="text-lg font-bold text-slate-800">{t('History.deleteTitle')}</h3>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('History.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {t('History.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}