"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const t = useTranslations()

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-all mr-2 text-muted-foreground hover:text-foreground"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

            <span className="sr-only">{t('Sidebar.theme')}</span>
        </Button>
    )
}