import { STORAGE_KEYS, API_ROUTES } from "./constants";

// --- INTERFÍCIES ---

import { Metric, MetricsFilters } from "@/types/metrics";

// --- INTERFÍCIES ---
// (Las interfaces Metric y MetricsFilters ahora se importan de types/metrics.ts)

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

// Sanitize payload: Converts empty strings/NaN to undefined/null for backend
function preparePayload(data: any): Partial<Metric> {
  const clean: any = {};

  // Helper per netejar camps numèrics
  const cleanNumber = (val: any) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  // Helper per netejar strings
  const cleanString = (val: any) => {
    if (!val || typeof val !== 'string') return null;
    return val.trim() === '' ? null : val.trim();
  };

  // Mapeig explícit
  if (data.bloodPressure !== undefined) clean.bloodPressure = cleanString(data.bloodPressure);
  if (data.measurementContext !== undefined) clean.measurementContext = cleanString(data.measurementContext);
  if (data.weightLocation !== undefined) clean.weightLocation = cleanString(data.weightLocation);
  if (data.notes !== undefined) clean.notes = cleanString(data.notes);

  if (data.pulse !== undefined) clean.pulse = cleanNumber(data.pulse);
  if (data.spo2 !== undefined) clean.spo2 = cleanNumber(data.spo2);
  if (data.weight !== undefined) clean.weight = cleanNumber(data.weight);
  if (data.ca125 !== undefined) clean.ca125 = cleanNumber(data.ca125);

  return clean;
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

    const data = await httpClient<Metric[]>(
      `${API_ROUTES.METRICS}?${params.toString()}`,
      { cache: "no-store" }
    );

    // Mapper per les gràfiques
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

  create: (data: any) =>
    httpClient<Metric>(API_ROUTES.METRICS, {
      method: "POST",
      body: JSON.stringify(preparePayload(data)),
    }),

  update: (id: string, data: any) =>
    httpClient<Metric>(`${API_ROUTES.METRICS}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(preparePayload(data)),
    }),

  delete: (id: string) =>
    httpClient<void>(`${API_ROUTES.METRICS}/${id}`, { method: "DELETE" }),
};

export interface LoginResponse {
  access_token: string;
}

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    httpClient<LoginResponse>(API_ROUTES.AUTH_LOGIN, {
      method: "POST",
      body: JSON.stringify({
        email: credentials.username,
        password: credentials.password,
      }),
    }),

  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },

  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return false;
  }
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
