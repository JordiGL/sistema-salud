export type HealthStatus = "normal" | "warning" | "danger";

export const STATUS_COLORS = {
  normal: {
    border: "border-l-emerald-500",
    text: "text-foreground",
    icon: "text-muted-foreground",
  },
  warning: {
    border: "border-l-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  danger: {
    border: "border-l-red-500",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500",
  },
};

export class HealthCriteria {
  /**
   * ESTADO SISTÓLICA (La Alta)
   * Danger: >= 140
   * Warning: >= 130
   */
  static getSystolicStatus(sys: number): HealthStatus {
    if (sys >= 140) return "danger";
    if (sys >= 130) return "warning";
    return "normal";
  }

  /**
   * ESTADO DIASTÓLICA (La Baja)
   * Danger: >= 90
   * Warning: >= 85
   */
  static getDiastolicStatus(dia: number): HealthStatus {
    if (dia >= 90) return "danger";
    if (dia >= 85) return "warning";
    return "normal";
  }

  // ... (El resto de métodos getPulseStatus, getSpO2Status y getWorstStatus se quedan igual)
  static getPulseStatus(bpm: number): HealthStatus {
    if (bpm > 120 || bpm < 45) return "danger";
    if (bpm > 100 || bpm < 60) return "warning";
    return "normal";
  }

  static getSpO2Status(spo2: number): HealthStatus {
    if (spo2 < 93) return "danger";
    if (spo2 < 95) return "warning";
    return "normal";
  }

  static getWorstStatus(statuses: HealthStatus[]): HealthStatus {
    if (statuses.includes("danger")) return "danger";
    if (statuses.includes("warning")) return "warning";
    return "normal";
  }
}
