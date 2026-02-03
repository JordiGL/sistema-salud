"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm hover:opacity-90 dark:hover:bg-slate-700 transition-all mr-2"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}