import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  fetchContextOptions,
  fetchLocationOptions,
  SelectOption,
} from "@/lib/api";

export function useMetricManager() {
  const t = useTranslations();
  const [contextOptions, setContextOptions] = useState<SelectOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [ctx, loc] = await Promise.all([
          fetchContextOptions(),
          fetchLocationOptions(),
        ]);
        setContextOptions(ctx);
        setLocationOptions(loc);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  // Helpers de traducció (Visualització)
  const renderContext = (key: string | null) => {
    if (!key) return null;
    const label = t(`ContextOptions.${key}` as any);
    return label.includes("ContextOptions.") ? key : label;
  };

  const renderLocation = (key: string | null) => {
    if (!key) return null;
    const label = t(`LocationOptions.${key}` as any);
    return label.includes("LocationOptions.") ? key : label;
  };

  // Helper per als Selects (Dropdowns)
  const translateOption = (category: string, option: SelectOption) => {
    const translated = t(`${category}.${option.key}` as any);
    return translated.includes(category) ? option.value : translated;
  };

  return {
    contextOptions,
    locationOptions,
    renderContext,
    renderLocation,
    translateOption,
  };
}
