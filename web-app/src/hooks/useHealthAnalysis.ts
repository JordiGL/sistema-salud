import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { API_ROUTES } from '@/lib/constants';

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
            return data;
        } catch (error) {
            console.error(error);
            alert(t('Form.aiErrorRead'));
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
