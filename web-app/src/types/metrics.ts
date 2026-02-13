export type MeasurementContext = 'exercise' | 'drainage' | 'chemo' | 'stress';
export type WeightLocation = 'home' | 'pharmacy' | 'cap' | 'ico';

export interface CreateMetricDto {
    bloodPressure?: string;
    measurementContext?: MeasurementContext;
    weightLocation?: WeightLocation;
    notes?: string;
    pulse?: number;
    spo2?: number;
    weight?: number;
    ca125?: number;
}

export interface Metric extends CreateMetricDto {
    id: string;
    createdAt: string;
    // Campos virtuales para el frontend
    systolic_graph?: number;
    diastolic_graph?: number;
}

export interface MetricsFilters {
    range?: "7d" | "30d" | "all";
    context?: string;
    location?: string;
}

export interface HealthEvent {
    id: string;
    date: string;
    createdAt: string;
    type: string;
    notes?: string;
    severity?: string;
    medication?: string;
}
