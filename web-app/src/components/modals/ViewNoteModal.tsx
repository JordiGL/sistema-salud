'use client';

import { FileText, Calendar, Check } from 'lucide-react';
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
      <DialogContent className="max-w-md bg-card border-border shadow-2xl [&>button]:hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
            <FileText size={20} className="text-foreground" />
            {t('Form.notes')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-1">
              <Calendar size={12} />
              {date.toLocaleDateString()} - {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Contingut */}
        <div className="bg-muted/50 p-4 rounded-lg text-foreground text-sm leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap mb-4">
          {note}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="h-auto px-8 py-4 rounded-xl font-bold text-muted-foreground border-border hover:bg-hover hover:text-accent-foreground shadow-sm transition-all"
          >
            <Check size={18} className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">{t('History.close')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}