import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vital.ai",
  description: "App de seguimiento",
};

// CAMBIO IMPORTANTE: Definimos params como Promise
import { cookies } from 'next/headers';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";

  return (
    <html lang={locale} className={theme} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme={theme}>
            {children}
            <Toaster
              position="top-center"
              theme={theme as 'light' | 'dark' | 'system'}
              toastOptions={{
                classNames: {
                  toast: 'group bg-card dark:bg-slate-900 border-border text-foreground shadow-lg rounded-xl font-sans text-sm p-4',
                  description: 'text-muted-foreground text-xs',
                  actionButton: 'bg-primary text-primary-foreground',
                  cancelButton: 'bg-muted text-muted-foreground',
                  success: 'border-l-4 border-l-slate-700 dark:border-l-slate-300',
                  error: 'border-l-4 border-l-red-500/70',
                  info: 'border-l-4 border-l-blue-500/70'
                },
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }
              }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}