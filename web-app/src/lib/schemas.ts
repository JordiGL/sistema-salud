import * as z from "zod"

const CONTEXT_KEYS = ['exercise', 'drainage', 'chemo', 'stress'] as const;
const LOCATION_KEYS = ['home', 'pharmacy', 'cap', 'ico'] as const;

export const metricSchema = z.object({
    bloodPressure: z.string()
        .optional()
        .or(z.literal(''))
        .refine((val) => {
            if (!val) return true;
            return /^\d+\/\d+$/.test(val);
        }, { message: "Formato inválido (Ej: 120/80)" })
        .refine((val) => {
            if (!val) return true;
            const [sys, dia] = val.split('/').map(Number);
            return sys >= dia;
        }, { message: "La sistólica debe ser mayor o igual a la diastólica" }),

    measurementContext: z.enum(CONTEXT_KEYS).optional().or(z.literal('')),

    weightLocation: z.enum(LOCATION_KEYS).optional().or(z.literal('')),

    notes: z.string().optional(),

    pulse: z.string() // Inputs are strings initially
        .transform(val => val === '' ? undefined : Number(val))
        .pipe(z.number().min(0).max(250).optional()),

    spo2: z.string()
        .transform(val => val === '' ? undefined : Number(val))
        .pipe(z.number().min(0).max(100).optional()),

    weight: z.string()
        .transform(val => val === '' ? undefined : Number(val))
        .pipe(z.number().min(0).max(500).optional()),

    ca125: z.string()
        .transform(val => val === '' ? undefined : Number(val))
        .pipe(z.number().min(0).optional()),

}).refine(data => {
    // At least one metric or note is present? User didn't specify, but usually good practice.
    // Not enforcing for now as legacy code didn't seem to enforce strictly other than individual checks.
    return true;
});

export type MetricFormValues = z.infer<typeof metricSchema>;
export type MetricFormInput = z.input<typeof metricSchema>;

export const eventSchema = z.object({
    type: z.string().min(1, { message: "Selecciona un tipo" }),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
    time: z.string().optional(),
    notes: z.string().optional(),
});
export type EventFormValues = z.infer<typeof eventSchema>;
