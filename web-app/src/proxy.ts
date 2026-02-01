import createMiddleware from "next-intl/middleware";

export default createMiddleware({
    // Lista de idiomas soportados
    locales: ["es", "ca"],

    // Idioma por defecto si no detecta ninguno
    defaultLocale: "es",
});

export const config = {
    // Ignorar archivos internos de next, imágenes, etc.
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
