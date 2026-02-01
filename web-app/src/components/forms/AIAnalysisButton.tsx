import { Camera, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";

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
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onButtonClick}
                disabled={isScanning || isSubmitting}
                className="gap-2 bg-slate-50 text-black border-indigo-100 uppercase tracking-wide"
                title={t('Form.aiButtonTitle')}
            >
                {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                <span className="hidden sm:inline">{isScanning ? t('Form.aiScanning') : t('Form.aiButtonLabel')}</span>
            </Button>
        </div>
    );
}
