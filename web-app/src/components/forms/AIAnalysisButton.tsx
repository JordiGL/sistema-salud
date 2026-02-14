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
                className="gap-2 bg-background text-foreground border-input shadow-sm hover:bg-accent hover:text-accent-foreground"
                title={t('Form.aiButtonTitle')}
            >
                {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </Button>
        </div>
    );
}
