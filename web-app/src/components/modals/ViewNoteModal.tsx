'use client';

import { FileText, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";

interface ViewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  date: Date;
}

export function ViewNoteModal({ isOpen, onClose, note, date }: ViewNoteModalProps) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <FileText size={20} className="text-slate-800" />
            {t('Form.notes')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium mt-1">
              <Calendar size={12} />
              {date.toLocaleDateString()} - {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Contingut */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap mb-4">
          {note}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            {t('History.close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}