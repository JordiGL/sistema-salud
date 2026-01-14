import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const locales = ["es", "ca"];

// CAMBIO IMPORTANTE: Usamos requestLocale
export default getRequestConfig(async ({ requestLocale }) => {
  // Esperamos a que se resuelva la promesa del idioma
  let locale = await requestLocale;

  // Si no hay locale o no es válido, usamos 'es' por defecto o lanzamos 404
  if (!locale || !locales.includes(locale as any)) {
    // Opción A: Forzar español si falla
    // locale = 'es';
    // Opción B: Dar error 404 (más estricto)
    notFound();
  }

  return {
    locale, // Devolvemos el locale resuelto
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
