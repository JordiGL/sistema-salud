"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full shadow-sm border border-border w-8 h-8 flex items-center justify-center transition-colors"
        >
            {/* Icona de Sol: es mostra quan el tema és light (scale-100) i s'amaga en dark (dark:scale-0) */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

            {/* Icona de Lluna: s'amaga en light (scale-0) i es mostra en dark (dark:scale-100) */}
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}