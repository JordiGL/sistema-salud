export interface ChartStats {
  min: number;
  max: number;
  avg: number;
}

// Ara acceptem (number | null | undefined)[]
export function calculateStats(
  data: (number | null | undefined)[]
): ChartStats | null {
  if (!data || data.length === 0) return null;

  // Filtrem per quedar-nos només amb números vàlids
  // TypeScript entendrà que 'validData' és number[] gràcies al predicate "val is number" implícit
  const validData = data.filter(
    (n): n is number => typeof n === "number" && !isNaN(n)
  );

  if (validData.length === 0) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const sum = validData.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / validData.length);

  return { min, max, avg };
}
