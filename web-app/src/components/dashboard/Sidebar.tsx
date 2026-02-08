"use client"

import * as React from "react"
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
    Menu, Activity, Heart, Scale, Droplets, TestTube,
    LayoutList, ShieldCheck, Sparkles, LogOut,
    Globe
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { InstallPrompt } from "@/components/install-prompt";
import { STORAGE_KEYS, APP_ROUTES } from '@/lib/constants';

interface SidebarProps {
    isAdmin: boolean;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onLogout: () => void;
}

export function Sidebar({ isAdmin, activeTab, setActiveTab, onLogout }: SidebarProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [open, setOpen] = React.useState(false);

    const tabs = [
        { id: 'history', label: t('Tabs.history'), icon: LayoutList },
        { id: 'bp', label: t('Tabs.bp'), icon: Activity },
        { id: 'pulse', label: t('Tabs.pulse'), icon: Heart },
        { id: 'weight', label: t('Tabs.weight'), icon: Scale },
        { id: 'spo2', label: t('Tabs.spo2'), icon: Droplets },
        { id: 'ca125', label: t('Tabs.ca125'), icon: TestTube },
    ];

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        setOpen(false); // Close sidebar on selection
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>

            {/* Desktop Trigger (Custom - if we wanted a persistent sidebar on desktop, 
          but for now we are just cleaning up the header. 
          The prompt says: "This should be the primary navigation method for mobile, 
          but it should also look great and functional on desktop."
          
          If we want it on desktop, we might want a persistent sidebar or just the same drawer.
          Given "Navigation Drawer that slides", I'll stick to the drawer for now, 
          triggered by the menu button which should be visible on desktop too if we move 
          everything into it. 
       */}

            <SheetContent side="left" className="w-[300px] sm:w-[350px] flex flex-col gap-0 p-0 bg-card">

                {/* HEADER */}
                <SheetHeader className="p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                            <Activity size={20} className="stroke-[2.5]" />
                        </div>
                        <div className="text-left space-y-0.5">
                            <SheetTitle className="text-lg font-bold tracking-tight">Vital.ai</SheetTitle>
                            <div className="flex items-center gap-1.5">
                                {isAdmin ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('HomePage.adminAccess')}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-muted-foreground">{t('Sidebar.guestUser')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">

                    {/* Main Nav */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest pl-1 mb-4">
                            {t('Sidebar.menu')}
                        </h4>

                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <Button
                                    key={tab.id}
                                    variant="ghost"
                                    className={`w-full justify-start gap-4 h-11 px-4 rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-secondary/80 text-foreground font-semibold shadow-sm ring-1 ring-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-hover"
                                        }`}
                                    onClick={() => handleTabClick(tab.id)}
                                >
                                    <Icon size={18} className={isActive ? "text-primary" : ""} />
                                    {tab.label}
                                </Button>
                            )
                        })}
                    </div>

                    {/* AI Feature */}
                    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-background to-muted/30 shadow-sm p-0.5">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={80} strokeWidth={1} />
                        </div>
                        <div className="relative p-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Sparkles size={16} />
                                </div>
                                <span className="font-semibold text-sm tracking-tight">{t('Sidebar.aiInsights')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                                {t('Sidebar.aiDescription')}
                            </p>
                            <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-md transition-all">
                                {t('Sidebar.exploreInsights')}
                            </Button>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-border bg-muted/20 space-y-4">

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        {/* Language */}
                        <div className="flex h-8.5 items-center gap-2 bg-background p-1 rounded-full shadow-sm border border-border">
                            <Globe size={14} className="ml-2 text-muted-foreground" />
                            <Link href="/es" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'es' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm' : 'text-muted-foreground bg-muted/30 hover:bg-hover hover:text-foreground'}`}>ES</Link>
                            <Link href="/ca" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${locale === 'ca' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 shadow-sm' : 'text-muted-foreground bg-muted/30 hover:bg-hover hover:text-foreground'}`}>CA</Link>
                        </div>

                        {/* Theme & Auth */}
                        <div className="flex items-center">
                            <ModeToggle />

                            {isAdmin ? (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-9 h-9 rounded-full border border-border bg-background shadow-sm hover:bg-destructive/10 hover:border-destructive/30 group transition-all"
                                    onClick={() => {
                                        onLogout();
                                        setOpen(false);
                                    }}
                                    title={t('Dashboard.logout')}
                                >
                                    <LogOut size={16} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                                    <span className="sr-only">{t('Dashboard.logout')}</span>
                                </Button>
                            ) : (
                                <Link
                                    href={`/${locale}${APP_ROUTES.LOGIN}`}
                                    title={t('Sidebar.login')}
                                    onClick={() => setOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-9 h-9 rounded-full border border-border bg-background shadow-sm hover:bg-hover transition-all text-muted-foreground hover:text-foreground"
                                    >
                                        <ShieldCheck size={16} />
                                        <span className="sr-only">{t('Sidebar.login')}</span>
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <InstallPrompt />

                </div>
            </SheetContent>
        </Sheet>
    )
}
