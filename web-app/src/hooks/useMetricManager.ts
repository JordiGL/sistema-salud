"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
// Importem la nova API
import { SelectOption, optionsApi } from "@/lib/api";

export function useMetricManager() {
  const t = useTranslations();

  const [contextOptions, setContextOptions] = useState<SelectOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        // Usem la nova estructura optionsApi
        const [ctx, loc] = await Promise.all([
          optionsApi.fetchContexts(),
          optionsApi.fetchLocations(),
        ]);

        if (mounted) {
          setContextOptions(ctx);
          setLocationOptions(loc);
        }
      } catch (error) {
        console.error("Error loading options manager", error);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const translateOption = (category: string, option: SelectOption) => {
    const translationKey = `${category}.${option.key}`;
    const translated = t(translationKey as any);
    return translated === translationKey ? option.value : translated;
  };

  const renderContext = (contextKey: string) => {
    const option = contextOptions.find((o) => o.key === contextKey);
    return option ? translateOption("ContextOptions", option) : contextKey;
  };

  const renderLocation = (locationKey: string) => {
    const option = locationOptions.find((o) => o.key === locationKey);
    return option ? translateOption("LocationOptions", option) : locationKey;
  };

  return {
    contextOptions,
    locationOptions,
    loadingOptions,
    translateOption,
    renderContext,
    renderLocation,
  };
}
