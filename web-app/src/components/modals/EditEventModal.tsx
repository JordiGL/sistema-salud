'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Save, Pencil, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { eventSchema, EventFormValues } from '@/lib/schemas';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { metricApi, ApiError } from '@/lib/api';
import { HealthEvent } from '@/types/metrics';
import { toast } from 'sonner';

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: HealthEvent;
    onSuccess: () => void;
}

const EVENT_TYPES = [
    'CHEMOTHERAPY',
    'DOCTOR_VISIT',
    'BLOOD_TEST',
    'IMAGING',
    'MEDICATION_CHANGE',
    'SYMPTOM_FLARE',
    'HOSPITALIZATION',
    'OTHER'
];

export function EditEventModal({ isOpen, onClose, event, onSuccess }: EditEventModalProps) {
    const t = useTranslations();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            type: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        }
    });

    useEffect(() => {
        if (event && isOpen) {
            const d = new Date(event.date);
            // Use local date/time for editing to ensure consistency
            // en-CA gives YYYY-MM-DD
            const localDate = d.toLocaleDateString('en-CA');
            const localTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            form.reset({
                type: event.type,
                date: localDate,
                time: localTime,
                notes: event.notes || ''
            });
        }
    }, [event, isOpen, form]);

    const handleSubmit = async (data: EventFormValues) => {
        try {
            // Combine date and time
            const dateStr = data.date;
            const timeStr = data.time || '00:00';
            const dateObj = new Date(`${dateStr}T${timeStr}`);

            const payload = {
                ...data,
                date: dateObj.toISOString()
            };

            // Remove internal time field if desired, but API ignores extra
            await metricApi.updateEvent(event.id, payload);

            toast.success(t('Toast.updateSuccess'));
            onSuccess();
            onClose();
        } catch (e: any) {
            if (e instanceof ApiError && e.message === "UNAUTHORIZED") {
                toast.error(t('Toast.sessionExpired'));
            } else {
                toast.error(e.message || t('Toast.errorSaving'));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md bg-card border-border shadow-2xl [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Pencil size={18} /> {t('HealthEvents.editEvent')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('HealthEvents.label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background border-input">
                                                <SelectValue placeholder="-" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {EVENT_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {t(`HealthEvents.types.${type}` as any)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('History.cols.date')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-background border-input text-foreground" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Hora</FormLabel>
                                        <FormControl>
                                            <Input type="time" className="bg-background border-input text-foreground" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.notes')}</FormLabel>
                                    <FormControl>
                                        <Textarea className="bg-background border-input h-20 resize-none" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={onClose} className="h-auto py-4 rounded-xl font-bold text-muted-foreground border-border hover:bg-hover hover:text-accent-foreground">
                                <ArrowLeft size={18} />
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="h-auto py-4 rounded-xl font-bold flex gap-2 bg-save text-save-foreground border border-border shadow-lg hover:shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                                <Save size={18} />
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
