'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Save, Pencil, ArrowLeft, Heart, Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { metricSchema, MetricFormInput, MetricFormValues } from '@/lib/schemas';
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
import { metricApi, SelectOption, ApiError } from '@/lib/api';
import { Metric } from '@/types/metrics';
import { toast } from 'sonner';

interface EditMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: Metric;
  onSuccess: () => void;
  contextOptions: SelectOption[];
  locationOptions: SelectOption[];
  translateOption: (cat: string, opt: SelectOption) => string;
}

export function EditMetricModal({ isOpen, onClose, metric, onSuccess, contextOptions, locationOptions, translateOption }: EditMetricModalProps) {
  const t = useTranslations();

  const form = useForm<MetricFormInput>({
    resolver: zodResolver(metricSchema) as any,
    defaultValues: {
      bloodPressure: '',
      pulse: '',
      spo2: '',
      ca125: '',
      weight: '',
      notes: '',
      measurementContext: '',
      weightLocation: '',
      createdAt: '',
      editDate: '',
      editTime: ''
    }
  });

  useEffect(() => {
    if (metric && isOpen) {
      form.reset({
        bloodPressure: metric.bloodPressure || '',
        pulse: metric.pulse?.toString() || '',
        spo2: metric.spo2?.toString() || '',
        ca125: metric.ca125?.toString() || '',
        weight: metric.weight?.toString() || '',
        notes: metric.notes || '',
        measurementContext: metric.measurementContext || '',
        weightLocation: metric.weightLocation || '',
        createdAt: metric.createdAt || '',
        editDate: metric.createdAt ? (() => {
          const d = new Date(metric.createdAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : '',
        editTime: metric.createdAt ? (() => {
          const d = new Date(metric.createdAt);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        })() : ''
      });
    }
  }, [metric, isOpen, form]);

  const handleSubmit = async (data: MetricFormValues) => {
    try {
      const submitData = { ...data };
      if (submitData.editDate) {
        const timeStr = submitData.editTime || '00:00';
        submitData.createdAt = new Date(`${submitData.editDate}T${timeStr}`).toISOString();
      } else {
        delete submitData.createdAt;
      }
      delete (submitData as any).editDate;
      delete (submitData as any).editTime;
      await metricApi.update(metric.id, submitData);
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
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil size={18} /> {t('History.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">

            {/* DATE (Full width top) */}
            <div className="lg:col-span-12 grid grid-cols-2 gap-4 md:w-2/3 lg:w-1/2">
              <FormField
                control={form.control}
                name="editDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('HealthEvents.date') || 'Fecha'}</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-background border-border text-foreground" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="editTime"
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

            {/* SECCIÓN 1: DATOS FISIOLÓGICOS */}
            <div className="lg:col-span-8 p-5 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-4 text-foreground font-bold border-b border-border pb-2">
                <Heart size={18} /> {t('Form.physiologicalData')}
              </div>

              {/* Grid de 3 columnas exactas */}
              <div className="grid grid-cols-3 gap-4 pt-2">

                {/* Contexto: Ocupa 2 de las 3 columnas */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="measurementContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.contextLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="-">-</SelectItem>
                            {contextOptions.map(opt => (
                              <SelectItem key={opt.key} value={opt.key}>{translateOption('ContextOptions', opt)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* CA125: Ocupa la 3ª columna */}
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="ca125"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.ca125Label')}</FormLabel>
                        <FormControl>
                          <Input type="number" className="text-center font-mono bg-background border-border text-foreground" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Segunda fila: Cada uno ocupa 1 columna (Máximo 3 por fila) */}
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="bloodPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.bpLabel')}</FormLabel>
                        <FormControl>
                          <Input className="text-center font-mono bg-background border-border text-foreground" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="pulse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.pulseLabel')}</FormLabel>
                        <FormControl>
                          <Input type="number" className="text-center font-mono bg-background border-border text-foreground" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="spo2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.spo2Label')}</FormLabel>
                        <FormControl>
                          <Input type="number" className="text-center font-mono bg-background border-border text-foreground" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONTROL DE PESO */}
            <div className="lg:col-span-4 p-5 rounded-xl border border-border bg-muted/30 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 text-foreground font-bold border-b border-border pb-2">
                <Scale size={18} /> {t('Form.weightLabel')}
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
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          {locationOptions.map(opt => (
                            <SelectItem key={opt.key} value={opt.key}>{translateOption('LocationOptions', opt)}</SelectItem>
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
                      <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Form.kgLabel')}</FormLabel>
                      <FormControl>
                        <Input type="number" className="text-center font-mono text-lg bg-background border-border text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* FILA INFERIOR (Notas + Botones) */}
            <div className="lg:col-span-12 space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">{t('Form.notes')}</FormLabel>
                    <FormControl>
                      <Textarea className="bg-background border-border text-foreground placeholder:text-muted-foreground h-20 resize-none" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="h-auto py-4 px-6 rounded-xl font-bold text-muted-foreground border-border hover:bg-hover hover:text-accent-foreground">
                  <ArrowLeft size={18} />
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="h-auto py-4 px-6 rounded-xl font-bold flex gap-2 bg-save text-save-foreground border border-border shadow-lg hover:shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                  <Save size={18} />
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </DialogContent >
    </Dialog >
  );
}