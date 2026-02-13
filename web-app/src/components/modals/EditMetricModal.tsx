'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Save, Pencil, ArrowLeft } from 'lucide-react';
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
      weightLocation: ''
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
        weightLocation: metric.weightLocation || ''
      });
    }
  }, [metric, isOpen, form]);

  const handleSubmit = async (data: MetricFormValues) => {
    try {
      await metricApi.update(metric.id, data);
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
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md max-h-[90vh] overflow-y-auto bg-card dark:bg-slate-950 border-border shadow-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil size={18} /> {t('History.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.bpLabel')}</FormLabel>
                    <FormControl>
                      <Input className="bg-background dark:bg-slate-900/50 border-input text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.pulseLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background dark:bg-slate-900/50 border-input text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.spo2Label')}</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background dark:bg-slate-900/50 border-input text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
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
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.ca125Label')}</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background dark:bg-slate-900/50 border-input text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Context */}
              <FormField
                control={form.control}
                name="measurementContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.contextLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="bg-background dark:bg-slate-900/50 border-input">
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

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.weightLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background dark:bg-slate-900/50 border-input text-foreground placeholder:text-muted-foreground" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="weightLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.locationLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="bg-background dark:bg-slate-900/50 border-input">
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-muted-foreground uppercase">{t('Form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea className="bg-background dark:bg-slate-900/50 border-input h-20 resize-none" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-auto py-4 rounded-xl font-bold text-muted-foreground border-border hover:bg-hover hover:text-accent-foreground">
                <ArrowLeft size={18} className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">{t('History.cancel')}</span>
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="h-auto py-4 rounded-xl font-bold flex gap-2 bg-primary text-primary-foreground dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 dark:hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all">
                <Save size={18} /> <span className="hidden sm:inline">{t('History.save')}</span>
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}