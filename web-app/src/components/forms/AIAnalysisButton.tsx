import { Camera, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AIAnalysisButtonProps {
    isScanning: boolean;
    isSubmitting: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onButtonClick: () => void;
}

export function AIAnalysisButton({
    isScanning,
    isSubmitting,
    fileInputRef,
    onFileChange,
    onButtonClick
}: AIAnalysisButtonProps) {
    const t = useTranslations();

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileChange}
            />
            <button
                type="button"
                onClick={onButtonClick}
                disabled={isScanning || isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-black hover:bg-slate-100 transition-colors text-xs font-bold disabled:opacity-50 uppercase tracking-wide border border-indigo-100"
                title={t('Form.aiButtonTitle')}
            >
                {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                <span className="hidden sm:inline">{isScanning ? t('Form.aiScanning') : t('Form.aiButtonLabel')}</span>
            </button>
        </div>
    );
}
