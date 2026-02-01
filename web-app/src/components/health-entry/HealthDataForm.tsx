'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Heart, Scale, Save, RotateCcw,
    ChevronDown, ChevronUp, Plus, Loader2
} from 'lucide-react';
import { useMetricManager } from '@/hooks/useMetricManager';
import { useHealthAnalysis } from '@/hooks/useHealthAnalysis';
import { AIAnalysisButton } from '@/components/forms/AIAnalysisButton';
import { metricSchema, MetricFormValues, MetricFormInput } from '@/lib/schemas';
import { metricApi, ApiError } from '@/lib/api';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Metric } from '@/types/metrics';

interface HealthDataFormProps {
    onSuccess: () => void;
}

export function HealthDataForm({ onSuccess }: HealthDataFormProps) {
    const t = useTranslations();
    const { contextOptions, locationOptions, translateOption } = useMetricManager();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<MetricFormInput>({
        resolver: zodResolver(metricSchema) as any,
        defaultValues: {
            bloodPressure: '',
            pulse: '', // String inputs for easier handling of empty states
            spo2: '',
            ca125: '',
            weight: '',
            notes: '',
            measurementContext: '',
            weightLocation: ''
        },
    });

    const {
        isScanning,
        fileInputRef,
        analyzeImage,
        triggerFileInput
    } = useHealthAnalysis();

    // Integració AI
    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await analyzeImage(file);
        if (result) {
            // Actualizar formulario
            if (result.bloodPressure) form.setValue('bloodPressure', result.bloodPressure);
            if (result.pulse) form.setValue('pulse', result.pulse.toString() as any);
            if (result.spo2) form.setValue('spo2', result.spo2.toString() as any);
            if (result.weight) form.setValue('weight', result.weight.toString() as any);

            const currentNotes = form.getValues('notes');
            if (!currentNotes) {
                form.setValue('notes', result.bloodPressure || result.weight || result.spo2 ? t('Form.aiAutoNote') : '');
            }

            if (!isOpen) setIsOpen(true);
        }
    };

    const onSubmit = async (data: MetricFormValues) => {
        try {
            await metricApi.create(data);
            form.reset();
            toast.success(t('HomePage.saveButton'));
            onSuccess();
        } catch (err: any) {
            if (err instanceof ApiError && err.message === "UNAUTHORIZED") {
                toast.error(t('HomePage.sessionExpired'));
            } else {
                toast.error(err.message || t('HomePage.errorSaving'));
            }
        }
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        form.reset();
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden transition-all ${isOpen ? 'ring-1 ring-slate-200' : ''}`}>

            {/* CABECERA */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors select-none ${isOpen ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
                title={isOpen ? t('Form.toggleCollapse') : t('Form.toggleExpand')}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Plus size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700">
                        {t('HomePage.newRecord')}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <AIAnalysisButton
                        isScanning={isScanning}
                        isSubmitting={form.formState.isSubmitting}
                        fileInputRef={fileInputRef}
                        onFileChange={handleCameraCapture}
                        onButtonClick={triggerFileInput}
                    />

                    <div className="text-slate-400">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            {/* CUERPO DEL FORMULARIO */}
            {isOpen && (
                <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* SECCIÓN 1: DATOS FISIOLÓGICOS */}
                            <div className="lg:col-span-8 p-5 rounded-xl border border-slate-200 bg-slate-50/30">
                                <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold border-b border-slate-200 pb-2">
                                    <Heart size={18} /> {t('Form.physiologicalData')}
                                </div>

                                <div className="mb-4">
                                    <FormField
                                        control={form.control}
                                        name="measurementContext"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.contextLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder={t('Form.contextPlaceholder')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contextOptions.map((opt) => (
                                                            <SelectItem key={opt.key} value={opt.key}>
                                                                {translateOption('ContextOptions', opt)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bloodPressure"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.bpLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="120/80" className="text-center font-mono bg-white" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pulse"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.pulseLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="80" className="text-center font-mono bg-white" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="spo2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.spo2Label')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="98" className="text-center font-mono bg-white" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ca125"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.ca125Label')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="35.5" className="text-center font-mono bg-white" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* SECCIÓN 2: CONTROL DE PESO */}
                            <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold border-b border-slate-200 pb-2">
                                    <Scale size={18} /> {t('Form.weightControl')}
                                </div>
                                <div className="space-y-4 grow">
                                    <FormField
                                        control={form.control}
                                        name="weightLocation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.locationLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder={t('Form.locationPlaceholder')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {locationOptions.map((opt) => (
                                                            <SelectItem key={opt.key} value={opt.key}>
                                                                {translateOption('LocationOptions', opt)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Form.weightLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="75.5" className="text-center font-mono text-lg bg-white" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* FILA INFERIOR */}
                            <div className="lg:col-span-12 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-slate-700">{t('Form.notes')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('Form.notesPlaceholder')}
                                                    className="resize-none h-20 bg-white"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={handleResetClick} className="h-auto px-6 py-4 rounded-xl font-bold text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300" title={t('Form.clearTitle')}>
                                        <RotateCcw size={18} /> <span className="hidden sm:inline">{t('HomePage.clear') || 'Limpiar'}</span>
                                    </Button>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1 h-auto py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl">
                                        {form.formState.isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {t('HomePage.saveButton')}</>}
                                    </Button>
                                </div>
                            </div>

                        </form>
                    </Form>
                </div>
            )}
        </div>
    );
}