import type { Config } from "tailwindcss"

const config = {
    darkMode: "class",
    content: [
        './src/pages/**/*.{ts,tsx}',
        './src/components/**/*.{ts,tsx}',
        './src/app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                vital: {
                    main: "var(--vital-main)",
                    ai: "var(--vital-ai)",
                    success: "#10b981", // emerald-500
                    warning: "#f59e0b", // amber-500
                    danger: "#ef4444", // red-500
                },
                chart: {
                    systolic: "var(--chart-systolic)",
                    diastolic: "var(--chart-diastolic)",
                    metric: "var(--chart-metric)",
                },
                hover: "var(--hover)",
                metric: {
                    stable: "var(--metric-stable)",
                    warning: "var(--metric-warning)",
                    alert: "var(--metric-alert)",
                },
                event: {
                    DEFAULT: "var(--chart-event)",
                    chemo: {
                        DEFAULT: "var(--event-chemo)",
                        muted: "var(--event-chemo-muted)",
                    }
                },

                // Semantic Button colors
                btn: {
                    save: {
                        DEFAULT: "var(--btn-save)",
                        foreground: "var(--btn-save-foreground)",
                    },
                    clear: {
                        DEFAULT: "var(--btn-clear)",
                        foreground: "var(--btn-clear-foreground)",
                        hover: "var(--btn-clear-hover)",
                    },
                    delete: {
                        DEFAULT: "var(--btn-delete)",
                        foreground: "var(--btn-delete-foreground)",
                    },
                },
                // Keep 'save' for backward compatibility if any
                save: {
                    DEFAULT: "var(--btn-save)",
                    foreground: "var(--btn-save-foreground)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
