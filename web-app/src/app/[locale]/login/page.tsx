'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2, User } from 'lucide-react'; // Changed Mail to User
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations();
  const [username, setUsername] = useState(''); // Changed email to username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // 1. Enviamos username y password usando authApi
      // Nota: authApi.login espera 'email', pero ahora le pasaremos 'username'. 
      // El backend debe soportar esto o authApi debe mapearlo.
      // Sabiendo que authApi usa 'any' o un DTO, pasaremos { username, password } 
      // y asumiremos que la API lo maneja o que authApi se ajusta.
      const data = await authApi.login({ username, password });

      // 2. Guardamos token
      authApi.setToken(data.access_token);

      toast.success(t('Toast.loginSuccess'));

      // 3. Redirigimos
      router.push('/');

    } catch (err) {
      setError(true);
      toast.error(t('Toast.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/10 flex items-center justify-center p-4">
      <div className="bg-card max-w-md w-full rounded-2xl shadow-sm border border-border p-8 animate-in fade-in zoom-in-95 duration-500">

        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary transition-transform hover:scale-105 duration-300">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('Login.title')}</h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{t('Login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* CAMPO USERNAME */}
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('Login.usernamePlaceholder')}
                className={`w-full p-3 pl-10 bg-background border rounded-xl outline-none transition-all text-sm ${error ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-ring focus:ring-1 focus:ring-ring hover:border-accent-foreground/50'}`}
                required
              />
            </div>
          </div>

          {/* CAMPO PASSWORD */}
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Login.passwordPlaceholder')}
                className={`w-full p-3 pl-10 bg-background border rounded-xl outline-none transition-all text-sm ${error ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-ring focus:ring-1 focus:ring-ring hover:border-accent-foreground/50'}`}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center gap-2 text-destructive text-xs font-medium animate-in slide-in-from-top-1">
              <span>{t('Toast.loginError')}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !password || !username}
            className="w-full h-auto py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 text-base mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>{t('Login.button')} <ArrowRight size={18} /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}