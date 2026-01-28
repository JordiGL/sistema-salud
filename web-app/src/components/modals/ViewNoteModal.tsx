'use client';

import { X, FileText, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Capçalera */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-slate-800" /> 
                {t('Form.notes')}
             </h3>
             <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <Calendar size={12} />
                {date.toLocaleDateString()} - {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Contingut */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap mb-4">
            {note}
        </div>

        {/* Footer: Alineat a la dreta i botó amb mida estàndard */}
        <div className="flex justify-end pt-2">
            <button 
                onClick={onClose} 
                className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
                {t('History.close')}
            </button>
        </div>

      </div>
    </div>
  );
}