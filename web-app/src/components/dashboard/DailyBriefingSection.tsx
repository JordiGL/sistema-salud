"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, TrendingUp, Activity, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthAnalysis } from "@/hooks/useHealthAnalysis";
import { Metric } from "@/types/metrics";
import { API_ROUTES } from "@/lib/constants";

interface DailyBriefingSectionProps {
    metrics: Metric[];
}

interface BriefingData {
    status: string;
    trend: string;
}

export function DailyBriefingSection({ metrics }: DailyBriefingSectionProps) {
    const t = useTranslations();
    const locale = useLocale();
    const { generateBriefing, isScanning } = useHealthAnalysis();
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Auto-generate on mount or when metrics change (debounced/throttled conceptually)
    // But to avoid cost, maybe only once per session or explicit trigger?
    // User said "Integration... add a new section... Use the existing hook to trigger."
    // And "Performance: Ensure the rest... remains functional while AI generates... use skeleton".
    // This implies auto-load.



    // Auto-generate on mount or when metrics change
    const checkDatabase = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Assuming API runs on localhost:3000 or typically configured via env
            // We use API_ROUTES.BASE directly.
            const response = await fetch(`${API_ROUTES.BASE}${API_ROUTES.DAILY_BRIEFING}/today`);

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    // Map based on locale
                    const status = locale === 'ca' ? data.status_ca : data.status_es;
                    const trend = locale === 'ca' ? data.trend_ca : data.trend_es;

                    if (status && trend) {
                        setBriefing({ status, trend });
                        setHasLoaded(true);
                        return true; // Found in DB
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check daily briefing DB:", error);
        }
        return false;
    };

    const handleGenerate = async () => {
        // Take last 5 metrics for context
        const recentMetrics = metrics.slice(0, 5);
        const result = await generateBriefing(recentMetrics, undefined, locale);

        if (result) {
            setBriefing(result);
            setHasLoaded(true);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (metrics.length > 0 && !briefing && !hasLoaded) {
                // Try DB first
                const found = await checkDatabase();
                // If not found, generate
                if (!found) {
                    handleGenerate();
                }
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metrics]);

    if (!metrics || metrics.length === 0) return null;

    return (
        <section
            id="daily-briefing"
            className="scroll-mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
            <Card
                className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md"
                style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--vital-ai), transparent 92%), var(--background))"
                }}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Sparkles size={18} />
                            </div>
                            <CardTitle className="text-lg font-bold tracking-tight">
                                {t('Dashboard.dailyBriefing') || "AI Daily Briefing"}
                            </CardTitle>
                        </div>
                        {/* Optional Refresh Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={isScanning}
                            className="h-8 w-8 p-0"
                        >
                            <Sparkles size={14} className={isScanning ? "animate-spin text-muted-foreground" : "text-muted-foreground"} />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {isScanning || !briefing ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-3/4 bg-primary/5" />
                            <Skeleton className="h-4 w-full bg-primary/5" />
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* 1. Status */}
                            <div className="space-y-2 p-3 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <Activity size={16} className="text-emerald-500" />
                                    <span>{t('Briefing.status')}</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {briefing.status}
                                </p>
                            </div>

                            {/* 2. Trend */}
                            <div className="space-y-2 p-3 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <TrendingUp size={16} className="text-blue-500" />
                                    <span>{t('Briefing.trend')}</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {briefing.trend}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
