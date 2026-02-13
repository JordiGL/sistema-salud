export type HealthStatus = "normal" | "warning" | "danger";

export const STATUS_COLORS = {
  normal: {
    border: "border-l-metric-stable",
    text: "text-foreground",
    icon: "text-muted-foreground",
  },
  warning: {
    border: "border-l-metric-warning",
    text: "text-metric-warning",
    icon: "text-metric-warning",
  },
  danger: {
    border: "border-l-metric-alert",
    text: "text-metric-alert",
    icon: "text-metric-alert",
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
