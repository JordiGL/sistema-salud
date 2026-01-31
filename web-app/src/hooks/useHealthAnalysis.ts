import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { API_ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

interface AnalysisResult {
    bloodPressure?: string;
    pulse?: number;
    spo2?: number;
    weight?: number;
}

export function useHealthAnalysis() {
    const t = useTranslations();
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const analyzeImage = async (file: File): Promise<AnalysisResult | null> => {
        setIsScanning(true);
        const toastId = toast.loading(t('Form.aiScanning')); // Feedback visual immediat

        try {
            const uploadData = new FormData();
            uploadData.append("file", file);

            // Use the constant instead of hardcoded string
            const response = await fetch(API_ROUTES.ANALYZE, {
                method: "POST",
                body: uploadData,
            });

            if (!response.ok) throw new Error(t('Form.aiErrorAnalysis'));

            const data = await response.json();
            toast.success(t('Form.aiAutoNote'), { id: toastId }); // Actualitza el toast
            return data;
        } catch (error) {
            console.error(error);
            toast.error(t('Form.aiErrorRead'), { id: toastId });
            return null;
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return {
        isScanning,
        fileInputRef,
        analyzeImage,
        triggerFileInput,
    };
}
