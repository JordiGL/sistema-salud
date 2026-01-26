export interface ChartStats {
  min: number;
  max: number;
  avg: number;
}

export function calculateStats(data: number[]): ChartStats | null {
  if (!data || data.length === 0) return null;

  // Filtrem valors nuls o 0 si fos necessari, però assumim que arriben nets
  const validData = data.filter((n) => typeof n === "number" && !isNaN(n));

  if (validData.length === 0) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const sum = validData.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / validData.length) * 10) / 10; // Arrodonir a 1 decimal

  return { min, max, avg };
}
