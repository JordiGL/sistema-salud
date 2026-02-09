'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Heart, Scale, Save, Eraser,
    ChevronDown, ChevronUp, Plus, Loader2, Zap
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
import { Toggle } from "@/components/ui/toggle";
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
    const [autoSave, setAutoSave] = useState(false);

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
    const handleUndo = async (id: string, data: any) => {
        try {
            await metricApi.delete(id);
            toast.info(t('Toast.undoSuccess') || "Desfet correctament");
            // Restore values
            form.reset(data);
            onSuccess();
        } catch (err) {
            toast.error(t('Toast.errorUndo') || "Error al desfer");
        }
    };

    const saveMetric = async (data: any, isAuto: boolean = false) => {
        try {
            const newMetric = await metricApi.create(data);
            form.reset();

            if (isAuto) {
                toast.success(t('Toast.aiAutoSaveSuccess') || "AI analysis successful: Record saved automatically", {
                    action: {
                        label: t('Toast.undo') || "Undo",
                        onClick: () => handleUndo(newMetric.id, data),
                    },
                    duration: 5000,
                });
            } else {
                toast.success(t('Toast.saveSuccess'));
            }

            onSuccess();
        } catch (err: any) {
            if (err instanceof ApiError && err.message === "UNAUTHORIZED") {
                toast.error(t('Toast.sessionExpired'));
            } else {
                toast.error(err.message || t('Toast.errorSaving'));
            }
        }
    };

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Pass skipSuccessToast if autoSave is enabled so we can show the custom auto-save toast instead
        const result = await analyzeImage(file, { skipSuccessToast: autoSave });

        if (result) {
            // Actualizar formulario
            if (result.bloodPressure) form.setValue('bloodPressure', result.bloodPressure);
            if (result.pulse) form.setValue('pulse', result.pulse.toString());
            if (result.spo2) form.setValue('spo2', result.spo2.toString());
            if (result.weight) form.setValue('weight', result.weight.toString());

            const currentNotes = form.getValues('notes');
            if (!currentNotes) {
                form.setValue('notes', result.bloodPressure || result.weight || result.spo2 ? t('Form.aiAutoNote') : '');
            }

            if (!isOpen && !autoSave) setIsOpen(true);

            // Auto-save logic
            if (autoSave) {
                // Wait for form updates to settle (optional, but good practice)
                // Trigger validation
                const isValid = await form.trigger();
                if (isValid) {
                    await saveMetric(form.getValues(), true);
                } else {
                    toast.warning(t('Toast.autoSaveFailedValidation') || "Auto-save failed validation");
                }
            }
        }
    };

    const onSubmit = (data: MetricFormValues) => saveMetric(data, false);

    // --- HOLD TO CLEAR LOGIC ---
    const [resetProgress, setResetProgress] = useState(0);
    const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const clearResetInterval = () => {
        if (resetIntervalRef.current) {
            clearInterval(resetIntervalRef.current);
            resetIntervalRef.current = null;
        }
    };

    const handleResetStart = (e?: React.MouseEvent | React.TouchEvent) => {
        // Prevent default only if needed, usually we want to allow mouse down
        if (e && e.cancelable) e.preventDefault();

        clearResetInterval();

        resetIntervalRef.current = setInterval(() => {
            setResetProgress((prev) => {
                // Adjust speed: 100 / 8 approx 12 steps. 12 * 30ms = 360ms
                const next = prev + 8;
                if (next >= 100) {
                    return 100;
                }
                return next;
            });
        }, 30);
    };

    const handleResetEnd = () => {
        clearResetInterval();
        setResetProgress((prev) => (prev >= 100 ? 100 : 0));
    };

    // Handle Reset Completion
    useEffect(() => {
        if (resetProgress >= 100) {
            clearResetInterval();
            form.reset();
            // Wait to show completion before resetting
            const timer = setTimeout(() => {
                setResetProgress(0);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [resetProgress, form]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearResetInterval();
    }, []);

    return (
        <div className={`bg-card dark:bg-slate-950 rounded-2xl shadow-sm border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden transition-all ${isOpen ? 'ring-1 ring-border' : ''}`}>

            {/* CABECERA */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors select-none ${isOpen ? 'bg-muted/50 border-b border-border' : 'bg-card'}`}
                title={isOpen ? t('Form.toggleCollapse') : t('Form.toggleExpand')}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-hover hover:text-foreground'}`}>
                        <Plus size={20} />
                    </div>
                    <h2 className="hidden sm:block text-lg font-bold text-foreground">
                        {t('HomePage.newRecord')}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div onClick={(e) => e.stopPropagation()}>
                        <Toggle
                            pressed={autoSave}
                            onPressedChange={setAutoSave}
                            variant="outline"
                            size="sm"
                            aria-label={t('Form.autoSave')}
                            title={autoSave ? t('Form.autoSave') : t('Form.enableAutoSave')}
                            className={`
                                gap-2 transition-all border-dashed
                                data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary data-[state=on]:border-solid
                                hover:bg-hover font-medium
                            `}
                        >
                            <Zap size={16} className={autoSave ? "fill-current" : ""} />
                        </Toggle>
                    </div>

                    <AIAnalysisButton
                        isScanning={isScanning}
                        isSubmitting={form.formState.isSubmitting}
                        fileInputRef={fileInputRef}
                        onFileChange={handleCameraCapture}
                        onButtonClick={triggerFileInput}
                    />

                    <div className="text-muted-foreground">
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
                            <div className="lg:col-span-8 p-5 rounded-xl border border-border bg-muted/30">
                                <div className="flex items-center gap-2 mb-4 text-foreground font-bold border-b border-border pb-2">
                                    <Heart size={18} /> {t('Form.physiologicalData')}
                                </div>

                                <div className="mb-4">
                                    <FormField
                                        control={form.control}
                                        name="measurementContext"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.contextLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background dark:bg-slate-900/50 border-border">
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.bpLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="120/80" className="text-center font-mono bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.pulseLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="80" className="text-center font-mono bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.spo2Label')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="98" className="text-center font-mono bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.ca125Label')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="35.5" className="text-center font-mono bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* SECCIÓN 2: CONTROL DE PESO */}
                            <div className="lg:col-span-4 p-5 rounded-xl border border-border bg-muted/30 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-4 text-foreground font-bold border-b border-border pb-2">
                                    <Scale size={18} /> {t('Form.weightControl')}
                                </div>
                                <div className="space-y-4 grow">
                                    <FormField
                                        control={form.control}
                                        name="weightLocation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.locationLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background dark:bg-slate-900/50 border-border">
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.weightLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="75.5" className="text-center font-mono text-lg bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                            <FormLabel className="text-sm font-medium text-foreground">{t('Form.notes')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('Form.notesPlaceholder')}
                                                    className="resize-none h-20 bg-background dark:bg-slate-900/50 border-border text-foreground placeholder:text-muted-foreground"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onMouseDown={handleResetStart}
                                        onMouseUp={handleResetEnd}
                                        onMouseLeave={handleResetEnd}
                                        onTouchStart={handleResetStart}
                                        onTouchEnd={handleResetEnd}
                                        className="relative overflow-hidden h-auto px-6 py-4 rounded-xl font-bold text-muted-foreground border-dashed border-border bg-background hover:bg-hover hover:text-foreground group select-none"
                                        title={t('Form.holdToClear') || "Mantén presionado para limpiar"}
                                    >
                                        <div
                                            className={`absolute inset-y-0 left-0 transition-all ease-linear duration-75 pointer-events-none ${resetProgress >= 100 ? 'bg-destructive/20' : 'bg-destructive/10'}`}
                                            style={{ width: `${resetProgress}%` }}
                                        />
                                        <div className="relative z-10 flex items-center gap-2">
                                            <Eraser size={18} className={`transition-transform duration-700 ${resetProgress > 0 ? 'rotate-12' : ''}`} />
                                            <span className="hidden sm:inline">{t('HomePage.clear') || 'Limpiar'}</span>
                                        </div>
                                    </Button>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1 h-auto py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl bg-primary text-primary-foreground dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 dark:hover:bg-slate-700 transition-all">
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