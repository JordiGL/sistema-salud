'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2, Mail } from 'lucide-react'; // Añadimos icono Mail
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState(''); // <--- Nuevo estado
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // 1. Enviamos email y password usando authApi
      const data = await authApi.login({ email, password });

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
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="bg-card max-w-md w-full rounded-2xl shadow-sm border border-border p-8">

        <div className="text-center mb-8">
          <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-foreground">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('Login.title')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t('Login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">

          {/* CAMPO EMAIL */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Login.emailPlaceholder')}
              className={`w-full p-3 pl-10 bg-background border rounded-xl outline-none transition-all text-sm font-medium ${error ? 'border-destructive' : 'border-input focus:border-ring focus:ring-1 focus:ring-ring'}`}
              required
            />
          </div>

          {/* CAMPO PASSWORD */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Login.passwordPlaceholder')}
              className={`w-full p-3 pl-10 bg-background border rounded-xl outline-none transition-all text-sm font-medium ${error ? 'border-destructive ring-2 ring-destructive/20' : 'border-input focus:border-ring focus:ring-1 focus:ring-ring'}`}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center font-bold">{t('Toast.loginError')}</p>
          )}

          <Button
            disabled={loading || !password || !email}
            className="w-full h-auto py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>{t('Login.button')} <ArrowRight size={18} /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}