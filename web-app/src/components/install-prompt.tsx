"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTranslations } from "next-intl";

export function InstallPrompt() {
    const { isInstallable, promptInstall } = useInstallPrompt();
    // We might not have translations for this specific button yet, but I'll try to key it or use a fallback.
    // Since I don't want to edit translation files right now unless necessary, I will use a hardcoded label or a generic key if I suspect one exists.
    // Actually, I'll check if I can add a translation key or just use "Install App" for now.
    // The user didn't explicitly ask for translations, but the app is multilingual.
    // Safest bet is to make it look good with an icon and maybe no text or a simple text.
    // Let's us an icon button for distinctiveness, similar to the theme toggle.

    if (!isInstallable) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={promptInstall}
            className="h-9 w-9 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Install App"
        >
            <Download className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Install App</span>
        </Button>
    );
}
