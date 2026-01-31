'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2, Mail } from 'lucide-react'; // Añadimos icono Mail
import { authApi } from '@/lib/api';

export default function LoginPage() {
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

      // 3. Redirigimos
      router.push('/');

    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-100 p-8">

        <div className="text-center mb-8">
          <div className="bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Acceso Admin</h1>
          <p className="text-slate-500 text-sm mt-2">Introduce tus credenciales para gestionar registros.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">

          {/* CAMPO EMAIL */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@salud.com"
              className={`w-full p-3 pl-10 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-medium ${error ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`}
              required
            />
          </div>

          {/* CAMPO PASSWORD */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña..."
              className={`w-full p-3 pl-10 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-medium ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:border-slate-400'}`}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center font-bold">Credenciales incorrectas</p>
          )}

          <button
            disabled={loading || !password || !email}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}