"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, TrendingUp, Activity, RefreshCw, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthAnalysis } from "@/hooks/useHealthAnalysis";
import { Metric } from "@/types/metrics";
import { API_ROUTES, METRICS_LIMIT } from "@/lib/constants";

interface DailyBriefingSectionProps {
    metrics: Metric[];
    isAdmin: boolean;
}

interface BriefingData {
    status: string;
    trend: string;
    date?: string;
}

export function DailyBriefingSection({ metrics, isAdmin }: DailyBriefingSectionProps) {
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
    const checkDatabase = async (): Promise<'found' | 'not-found' | 'error'> => {
        try {
            // We use API_ROUTES.BASE directly.
            const endpoint = '/latest';
            const response = await fetch(`${API_ROUTES.BASE}${API_ROUTES.DAILY_BRIEFING}${endpoint}`);

            if (response.ok) {
                const text = await response.text();
                // Handle empty body (NestJS returns 200 with empty body for null sometimes, or explicit null)
                if (!text || text === "null" || text === "") return 'not-found';

                const data = JSON.parse(text);
                if (data) {
                    // Map based on locale
                    const status = locale === 'ca' ? data.status_ca : data.status_es;
                    const trend = locale === 'ca' ? data.trend_ca : data.trend_es;

                    if (status && trend) {
                        setBriefing({ status, trend, date: data.date });
                        setHasLoaded(true);
                        return 'found'; // Found in DB
                    }
                }
                return 'not-found'; // 200 OK but invalid/empty structure
            } else if (response.status === 404) {
                return 'not-found';
            } else {
                // 500 or other error
                return 'error';
            }
        } catch (error) {
            console.error("Failed to check daily briefing DB:", error);
            return 'error';
        }
    };

    const handleGenerate = async () => {
        // Take last 5 metrics for context
        const recentMetrics = metrics.slice(0, METRICS_LIMIT);
        const result = await generateBriefing(recentMetrics, undefined, locale);

        if (result) {
            setBriefing({
                ...result,
                date: (result as any).date || new Date().toISOString()
            });
            setHasLoaded(true);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (metrics.length > 0 && !briefing && !hasLoaded) {
                // Try DB first
                const status = await checkDatabase();

                // Only generate if explicitly NOT FOUND (DB is working but has no record)
                if (status === 'not-found') {
                    // Start with empty state, let user trigger generation
                    setHasLoaded(true);
                } else if (status === 'error') {
                    // If DB is down, we stop loading to avoid skeleton valid forever,
                    // but we DO NOT call AI to prevent cost loop.
                    setHasLoaded(true);
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
                className="overflow-hidden bg-card border-border shadow-sm transition-all hover:shadow-md"
            >
                <CardContent className="pt-6">
                    {(!briefing && (!hasLoaded || isScanning)) ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-3/4 bg-primary/5" />
                            <Skeleton className="h-4 w-full bg-primary/5" />
                        </div>
                    ) : !briefing ? (
                        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg">
                            {/* If not found, show button to generate */}
                            <Button variant="link" size="sm" onClick={handleGenerate} className="h-auto p-0 gap-2 font-normal">
                                <Sparkles size={14} />
                                {t('Briefing.generate')}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {briefing.date && (
                                <div className="flex justify-end mb-3">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 border border-border/50 text-xs font-medium text-muted-foreground">
                                        <Calendar size={12} />
                                        <span>{new Date(briefing.date).toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* 1. Status */}
                                <div className="space-y-2 p-3 rounded-lg bg-muted/10 border border-border">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Activity size={16} className="text-metric-stable" />
                                        <span>{t('Briefing.status')}</span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {briefing.status}
                                    </p>
                                </div>

                                {/* 2. Trend */}
                                <div className="space-y-2 p-3 rounded-lg bg-muted/10 border border-border">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <TrendingUp size={16} className="text-vital-ai" />
                                        <span>{t('Briefing.trend')}</span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {briefing.trend}
                                    </p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex justify-end mt-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleGenerate}
                                        disabled={isScanning}
                                        className="h-8 w-8 text-foreground border border-input shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent"
                                        title={t('Briefing.generate') || "Generate Briefing"}
                                    >
                                        <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
