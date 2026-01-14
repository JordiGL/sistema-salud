const API_URL = "http://localhost:3000";

export interface HealthMetric {
  id: string;
  createdAt: string;
  bloodPressure?: string;
  measurementContext?: string;
  weightLocation?: string;
  notes?: string;
  pulse?: number;
  spo2?: number;
  weight?: number;
  ca125?: number;
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
  // 1. Recuperamos el token real
  const token = localStorage.getItem("health_token");

  const res = await fetch(`${API_URL}/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 2. Si hay token lo enviamos, si no, enviamos string vacío (fallará en backend)
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(data),
  });

  // 3. Si el backend nos dice "Unauthorized" (401), es que el token caducó o no existe
  if (res.status === 401) {
    // Opcional: Redirigir al login o lanzar un error específico
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) throw new Error("Error guardando datos");
  return await res.json();
}

//Función para actualizar
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
  if (!res.ok) throw new Error("Error actualizando datos");
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
