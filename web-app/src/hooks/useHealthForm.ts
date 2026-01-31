import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { metricApi, ApiError } from '@/lib/api';

export interface HealthFormData {
    bloodPressure: string;
    pulse: string;
    weight: string;
    spo2: string;
    ca125: string;
    measurementContext: string;
    weightLocation: string;
    notes: string;
}

const INITIAL_STATE: HealthFormData = {
    bloodPressure: '',
    pulse: '',
    weight: '',
    spo2: '',
    ca125: '',
    measurementContext: '',
    weightLocation: '',
    notes: ''
};

interface UseHealthFormProps {
    onSuccess: () => void;
}

export function useHealthForm({ onSuccess }: UseHealthFormProps) {
    const t = useTranslations();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<HealthFormData>(INITIAL_STATE);

    const resetForm = () => {
        setFormData(INITIAL_STATE);
    };

    const updateField = (field: keyof HealthFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateFromAnalysis = (data: any) => {
        setFormData(prev => ({
            ...prev,
            bloodPressure: data.bloodPressure || prev.bloodPressure,
            pulse: data.pulse ? data.pulse.toString() : prev.pulse,
            spo2: data.spo2 ? data.spo2.toString() : prev.spo2,
            weight: data.weight ? data.weight.toString() : prev.weight,
            notes: prev.notes ? prev.notes : (data.bloodPressure || data.weight || data.spo2 ? t('Form.aiAutoNote') : '')
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await metricApi.create(formData);
            resetForm();
            onSuccess();
        } catch (err: any) {
            if (err instanceof ApiError && err.message === "UNAUTHORIZED") {
                alert(t('HomePage.sessionExpired'));
            } else {
                alert(err.message || t('HomePage.errorSaving'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        isSubmitting,
        resetForm,
        updateField,
        updateFromAnalysis,
        handleSubmit
    };
}
