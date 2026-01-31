import { STORAGE_KEYS, API_ROUTES } from "./constants";

// --- INTERFÍCIES ---

export interface HealthMetric {
  id: string;
  createdAt: string;
  // Afegim | null perquè la BD retorna null
  bloodPressure?: string | null;
  measurementContext?: string | null;
  weightLocation?: string | null;
  notes?: string | null;
  pulse?: number | null;
  spo2?: number | null;
  weight?: number | null;
  ca125?: number | null;
  // Camps virtuals (frontend)
  systolic_graph?: number;
  diastolic_graph?: number;
}

export interface MetricsFilters {
  range?: "7d" | "30d" | "all";
  context?: string;
  location?: string;
}

export interface SelectOption {
  key: string;
  value: string;
}

// --- ERROR CLASS ---
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- CORE HTTP CLIENT ---
async function httpClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers, ...customConfig } = options;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.TOKEN)
      : null;

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_ROUTES.BASE}${endpoint}`;

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Aquí podries netejar el token si volguessis
      // localStorage.removeItem(STORAGE_KEYS.TOKEN);
      throw new ApiError("UNAUTHORIZED", 401);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        errorBody.message || errorBody.error || "Error desconegut";
      throw new ApiError(message, response.status, errorBody);
    }

    if (response.status === 204) return null as unknown as T;
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Error de xarxa",
      0
    );
  }
}

// --- MÈTODES PÚBLICS ---

export const metricApi = {
  getAll: async (filters?: MetricsFilters) => {
    const params = new URLSearchParams();
    if (filters?.range) params.append("range", filters.range);
    if (filters?.context && filters.context !== "all")
      params.append("context", filters.context);
    if (filters?.location && filters.location !== "all")
      params.append("location", filters.location);

    const data = await httpClient<HealthMetric[]>(
      `${API_ROUTES.METRICS}?${params.toString()}`,
      { cache: "no-store" }
    );

    // Mapper per les gràfiques (es manté igual)
    return data.map((item) => {
      let sys, dia;
      if (item.bloodPressure) {
        const parts = item.bloodPressure.split("/");
        if (parts.length === 2) {
          sys = Number(parts[0]);
          dia = Number(parts[1]);
        }
      }
      return { ...item, systolic_graph: sys, diastolic_graph: dia };
    });
  },

  create: (data: Partial<HealthMetric>) =>
    httpClient<HealthMetric>(API_ROUTES.METRICS, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<HealthMetric>) =>
    httpClient<HealthMetric>(`${API_ROUTES.METRICS}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    httpClient<void>(`${API_ROUTES.METRICS}/${id}`, { method: "DELETE" }),
};

export const optionsApi = {
  fetchContexts: async (): Promise<SelectOption[]> => {
    // Simulació (a substituir per endpoint real quan el tinguis)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            { key: "exercise", value: "Post-Ejercicio" },
            { key: "drainage", value: "Post-Drenaje" },
            { key: "chemo", value: "Post-Quimioterapia" },
            { key: "stress", value: "Momento de estres" },
          ]),
        100
      )
    );
  },
  fetchLocations: async (): Promise<SelectOption[]> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            { key: "home", value: "Casa" },
            { key: "pharmacy", value: "Farmacia" },
            { key: "cap", value: "CAP" },
            { key: "ico", value: "ICO" },
          ]),
        100
      )
    );
  },
};
