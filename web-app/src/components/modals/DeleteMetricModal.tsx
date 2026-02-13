'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { metricApi } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";

interface DeleteMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricId: string;
  onSuccess: () => void;
  type?: 'metric' | 'event';
}

export function DeleteMetricModal({ isOpen, onClose, metricId, onSuccess, type = 'metric' }: DeleteMetricModalProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (type === 'event') {
        await metricApi.deleteEvent(metricId);
      } else {
        await metricApi.delete(metricId);
      }
      toast.success(t('Toast.deleteSuccess'));
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || t('Toast.deleteError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm [&>button]:hidden">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-metric-alert/20 p-3 rounded-full text-metric-alert"><AlertTriangle size={32} /></div>
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {type === 'event' ? t('HealthEvents.deleteTitle') || t('History.deleteTitle') : t('History.deleteTitle')}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex justify-end gap-3 w-full mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-auto py-4 rounded-xl font-bold text-muted-foreground"
          >
            <ArrowLeft size={18} className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">{t('History.cancel')}</span>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="h-auto py-4 rounded-xl font-bold shadow-lg hover:shadow-xl"
          >
            <Trash2 size={18} className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">{t('History.delete')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}