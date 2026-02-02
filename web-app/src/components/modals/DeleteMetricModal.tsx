'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
}

export function DeleteMetricModal({ isOpen, onClose, metricId, onSuccess }: DeleteMetricModalProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await metricApi.delete(metricId);
      toast.success(t('History.delete'));
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full text-red-600 dark:text-red-400"><AlertTriangle size={32} /></div>
            <DialogTitle className="text-lg font-bold text-foreground text-center">{t('History.deleteTitle')}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex gap-3 w-full mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-6 rounded-xl font-bold text-muted-foreground"
          >
            {t('History.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex-1 py-6 rounded-xl font-bold"
          >
            {t('History.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}