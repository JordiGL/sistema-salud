'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Plus,
    Minus,
    Camera,
    X,
    ChevronDown,
    ChevronUp,
    Zap, // Import Zap icon
    Save,
    RotateCw,
    Eraser,
    Loader2,
    Activity, // Added
    Calendar,  // Added
    Heart, // Restored
    Scale // Restored
} from 'lucide-react';
import { useMetricManager } from '@/hooks/useMetricManager';
import { useHealthAnalysis } from '@/hooks/useHealthAnalysis';
import { AIAnalysisButton } from '@/components/forms/AIAnalysisButton';
import { metricSchema, MetricFormValues, MetricFormInput, eventSchema, EventFormValues } from '@/lib/schemas';
import { metricApi, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

    // EVENT FORM
    const [activeTab, setActiveTab] = useState<'metrics' | 'events'>('metrics');
    const eventForm = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            type: '',
            date: new Date().toLocaleDateString('en-CA'),
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            notes: ''
        }
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

    const onEventSubmit = async (data: EventFormValues) => {
        try {
            // Combine date and time
            const hasTime = !!data.time;
            const dateStr = data.date;
            const timeStr = data.time || '00:00';

            const dateObj = new Date(`${dateStr}T${timeStr}`);
            const payload = {
                ...data,
                date: dateObj.toISOString()
            };

            await metricApi.createEvent(payload);
            eventForm.reset({
                type: '',
                date: new Date().toLocaleDateString('en-CA'),
                time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                notes: ''
            });

            toast.success("Evento registrado correctamente");
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Error al guardar el evento");
        }
    };

    // --- HOLD TO CLEAR LOGIC ---
    const [resetProgress, setResetProgress] = useState(0);
    const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Lógica para borrar manteniendo pulsado (Eventos)
    const [eventResetProgress, setEventResetProgress] = useState(0);
    const eventResetTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleEventResetStart = () => {
        setEventResetProgress(0);
        const startTime = Date.now();
        const duration = 1000; // 1 segundo para borrar

        eventResetTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setEventResetProgress(progress);

            if (progress >= 100) {
                if (eventResetTimerRef.current) clearInterval(eventResetTimerRef.current);
                eventForm.reset({
                    type: '',
                    date: new Date().toLocaleDateString('en-CA'),
                    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    notes: ''
                });
                setEventResetProgress(0);
            }
        }, 50);
    };

    const handleEventResetEnd = () => {
        if (eventResetTimerRef.current) {
            clearInterval(eventResetTimerRef.current);
            eventResetTimerRef.current = null;
        }
        setEventResetProgress(0);
    };

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
        <div className={`bg-card rounded-2xl shadow-sm border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden transition-all ${isOpen ? 'ring-1 ring-border' : ''}`}>

            {/* CABECERA */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors select-none ${isOpen ? 'bg-muted/50 border-b border-border' : 'bg-card'}`}
                title={isOpen ? t('Form.toggleCollapse') : t('Form.toggleExpand')}
            >
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center bg-muted border border-border shadow-inner p-1 rounded-lg">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setActiveTab('metrics');
                                if (!isOpen) setIsOpen(true);
                            }}
                            className={cn(
                                "h-8 w-8 rounded-md transition-all",
                                activeTab === 'metrics'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <Activity size={16} />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setActiveTab('events');
                                if (!isOpen) setIsOpen(true);
                            }}
                            className={cn(
                                "h-8 w-8 rounded-md transition-all",
                                activeTab === 'events'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                            title={t('HealthEvents.newEvent')}
                        >
                            <Calendar size={16} />
                        </Button>
                    </div>
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
                                gap-2 transition-all bg-background shadow-sm
                                border-2 border-dotted border-muted-foreground/40 text-muted-foreground
                                data-[state=on]:border-solid data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
                                hover:bg-accent hover:text-accent-foreground font-medium
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

                    {/* TABS - Moved to Header */}

                    {activeTab === 'metrics' ? (
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
                                                            <SelectTrigger className="bg-background border-border">
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
                                                        <Input placeholder="120/80" className="text-center font-mono bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                        <Input type="number" placeholder="80" className="text-center font-mono bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                        <Input type="number" placeholder="98" className="text-center font-mono bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                        <Input type="number" placeholder="35.5" className="text-center font-mono bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                            <SelectTrigger className="bg-background border-border">
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
                                                        <Input type="number" placeholder="75.5" className="text-center font-mono text-lg bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                                                        className="resize-none h-20 bg-background border-border text-foreground placeholder:text-muted-foreground"
                                                        {...field}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex gap-3 justify-end">
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
                                                className={`absolute inset-y-0 left-0 transition-all ease-linear duration-75 pointer-events-none ${resetProgress >= 100 ? 'bg-metric-alert/50' : 'bg-metric-alert/30'}`}
                                                style={{ width: `${resetProgress}%` }}
                                            />
                                            <div className="relative z-10 flex items-center gap-2">
                                                <Eraser size={18} className={`transition-transform duration-700 ${resetProgress > 0 ? 'rotate-12' : ''}`} />
                                            </div>
                                        </Button>
                                        <Button type="submit" disabled={form.formState.isSubmitting} className="h-auto px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl bg-save text-save-foreground border border-border hover:bg-primary hover:text-primary-foreground transition-all">
                                            {form.formState.isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                        </Button>
                                    </div>
                                </div>

                            </form>
                        </Form>

                    ) : (
                        // EVENT FORM RENDER
                        <Form {...eventForm}>
                            <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={eventForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('HealthEvents.type')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background border-border">
                                                            <SelectValue placeholder={t('HealthEvents.typePlaceholder')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CHEMOTHERAPY">{t('HealthEvents.types.CHEMOTHERAPY')}</SelectItem>
                                                        <SelectItem value="DOCTOR_VISIT">{t('HealthEvents.types.DOCTOR_VISIT')}</SelectItem>
                                                        <SelectItem value="BLOOD_TEST">{t('HealthEvents.types.BLOOD_TEST')}</SelectItem>
                                                        <SelectItem value="IMAGING">{t('HealthEvents.types.IMAGING')}</SelectItem>
                                                        <SelectItem value="OTHER">{t('HealthEvents.types.OTHER')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={eventForm.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('HealthEvents.date')}</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="bg-background border-border text-foreground" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={eventForm.control}
                                            name="time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hora</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" className="bg-background border-border text-foreground" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={eventForm.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-foreground">{t('HealthEvents.notes')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('HealthEvents.notes')}
                                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground h-32 resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3 justify-end pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onMouseDown={handleEventResetStart}
                                        onMouseUp={handleEventResetEnd}
                                        onMouseLeave={handleEventResetEnd}
                                        onTouchStart={handleEventResetStart}
                                        onTouchEnd={handleEventResetEnd}
                                        className="relative overflow-hidden h-auto px-6 py-4 rounded-xl font-bold text-muted-foreground border-dashed border-border bg-background hover:bg-hover hover:text-foreground group select-none"
                                        title={t('Form.holdToClear') || "Mantén presionado para limpiar"}
                                    >
                                        <div
                                            className={`absolute inset-y-0 left-0 transition-all ease-linear duration-75 pointer-events-none ${eventResetProgress >= 100 ? 'bg-metric-alert/50' : 'bg-metric-alert/30'}`}
                                            style={{ width: `${eventResetProgress}%` }}
                                        />
                                        <div className="relative z-10 flex items-center gap-2">
                                            <Eraser size={18} className={`transition-transform duration-700 ${eventResetProgress > 0 ? 'rotate-12' : ''}`} />
                                        </div>
                                    </Button>
                                    <Button type="submit" disabled={eventForm.formState.isSubmitting} className="h-auto px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl bg-save text-save-foreground border border-border hover:bg-primary hover:text-primary-foreground transition-all">
                                        {eventForm.formState.isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            )
            }
        </div >
    );
}