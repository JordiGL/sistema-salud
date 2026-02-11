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

interface BriefingResult {
    status: string;
    trend: string;
}

export function useHealthAnalysis() {
    const t = useTranslations();
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const analyzeImage = async (file: File, options?: { skipSuccessToast?: boolean }): Promise<AnalysisResult | null> => {
        setIsScanning(true);
        const toastId = toast.loading(t('Toast.aiScanning')); // Feedback visual immediat

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

            if (options?.skipSuccessToast) {
                toast.dismiss(toastId);
            } else {
                toast.success(t('Toast.analysisSuccess'), { id: toastId }); // Actualitza el toast
            }

            return data;
        } catch (error) {
            console.error(error);
            toast.error(t('Toast.aiErrorRead'), { id: toastId });
            return null;
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const generateBriefing = async (metrics: any[], context?: string, locale?: string): Promise<BriefingResult | null> => {
        setIsScanning(true);
        try {
            const response = await fetch(API_ROUTES.ANALYZE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ metrics, context, locale }),
            });

            if (!response.ok) throw new Error("Failed to generate briefing");

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Briefing Generation Error:", error);
            return null;
        } finally {
            setIsScanning(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return {
        isScanning,
        fileInputRef,
        analyzeImage,
        generateBriefing,
        triggerFileInput,
    };
}
