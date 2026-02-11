export const STORAGE_KEYS = {
  TOKEN: "health_token",
};

export const API_ROUTES = {
  BASE: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  METRICS: "/metrics",
  ANALYZE: "/api/analyze",
  AUTH_LOGIN: "/auth/login",
  DAILY_BRIEFING: "/daily-briefing",
};

export const APP_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
};
