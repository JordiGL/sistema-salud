"use client";

import { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
    children,
    defaultTheme
}: {
    children: React.ReactNode;
    defaultTheme?: string;
}) {
    // Prefer the cookie value on the client, or fallback to server-passed default
    // Note: During SSR, Cookies.get() is undefined, so defaultTheme is used (which comes from server cookies)
    const [theme, setTheme] = useState<Theme>(
        (defaultTheme as Theme) || "light"
    );

    useEffect(() => {
        const root = document.documentElement;
        // Ensure the class is present on mount (in case hydration missed it or for soft navs)
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.style.colorScheme = theme;

        // Also set the cookie if it's missing (sync client state)
        if (!Cookies.get("theme")) {
            Cookies.set("theme", theme, { expires: 365 });
        }
    }, [theme]);

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        Cookies.set("theme", newTheme, { expires: 365 });

        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
        root.style.colorScheme = newTheme;
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
