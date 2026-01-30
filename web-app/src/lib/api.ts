const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface HealthMetric {
  id: string;
  createdAt: string;
  bloodPressure?: string | null;
  measurementContext?: string | null;
  weightLocation?: string | null;
  notes?: string | null;
  pulse?: number | null;
  spo2?: number | null;
  weight?: number | null;
  ca125?: number | null;
  // Propiedades virtuales para la gráfica
  systolic_graph?: number;
  diastolic_graph?: number;
}

// NUEVA INTERFAZ: Definimos qué filtros acepta nuestra API
export interface MetricsFilters {
  range?: "7d" | "30d" | "all";
  context?: string;
  location?: string;
}

// MODIFICADO: Acepta el objeto de filtros opcionalmente
export async function fetchMetrics(
  filters?: MetricsFilters
): Promise<HealthMetric[]> {
  try {
    // 1. Construimos la URL base
    const url = new URL(`${API_URL}/metrics`);

    // 2. Añadimos los parámetros si existen
    if (filters?.range) {
      url.searchParams.append("range", filters.range);
    }

    // Solo enviamos el contexto si no es 'all' (para que el backend entienda que no hay filtro)
    if (filters?.context && filters.context !== "all") {
      url.searchParams.append("context", filters.context);
    }

    if (filters?.location && filters.location !== "all") {
      url.searchParams.append("location", filters.location);
    }

    // 3. Hacemos la petición a la URL construida (ej: .../metrics?range=7d&context=Post-Ejercicio)
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) throw new Error("Error al conectar");

    const data: HealthMetric[] = await res.json();

    // PROCESAMIENTO DE DATOS (Se mantiene igual)
    // Convertimos "120/80" en números para la gráfica
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
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveMetric(data: Partial<HealthMetric>) {
  const token = localStorage.getItem("health_token");

  const res = await fetch(`${API_URL}/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    // 🔍 LLEGIM EL MISSATGE REAL DEL SERVIDOR
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.error || errorData.message || "Error guardando datos";

    console.error("❌ Error detallado del servidor:", errorData); // Mira la consola del navegador!
    throw new Error(errorMessage);
  }

  return await res.json();
}

export async function updateMetric(id: string, data: Partial<HealthMetric>) {
  const token = localStorage.getItem("health_token");

  const res = await fetch(`${API_URL}/metrics/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");

  if (!res.ok) {
    // 🔍 LLEGIM EL MISSATGE REAL DEL SERVIDOR TAMBÉ AQUÍ
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.error || errorData.message || "Error actualizando datos";

    console.error("❌ Error detallado del servidor:", errorData);
    throw new Error(errorMessage);
  }

  return await res.json();
}

//Función para eliminar
export async function deleteMetric(id: string) {
  const token = localStorage.getItem("health_token");

  const res = await fetch(`${API_URL}/metrics/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error eliminando datos");
  return true;
}

export interface SelectOption {
  key: string; // La clave para guardar en BD y para traducir (ej: "exercise")
  value: string; // El valor por defecto o fallback (ej: "Post-Ejercicio")
}

export async function fetchContextOptions(): Promise<SelectOption[]> {
  // TODO: Conectar con tu endpoint real
  // const res = await fetch(`${API_URL}/options/context`, { headers: getHeaders() });
  // if (!res.ok) throw new Error('Failed to fetch contexts');
  // return res.json();

  // MOCK TEMPORAL (Simula la BD):
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve([
          { key: "exercise", value: "Post-Ejercicio" },
          { key: "drainage", value: "Post-Drenaje" },
          { key: "chemo", value: "Post-Quimioterapia" },
          { key: "stress", value: "Momento de estres" },
        ]),
      100
    );
  });
}

export async function fetchLocationOptions(): Promise<SelectOption[]> {
  // TODO: Conectar con tu endpoint real
  // const res = await fetch(`${API_URL}/options/location`, { headers: getHeaders() });
  // if (!res.ok) throw new Error('Failed to fetch locations');
  // return res.json();

  // MOCK TEMPORAL (Simula la BD):
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve([
          { key: "home", value: "Casa" },
          { key: "pharmacy", value: "Farmacia" },
          { key: "cap", value: "CAP" },
          { key: "ico", value: "ICO" },
        ]),
      100
    );
  });
}
