'use client';

import { useState } from 'react';
import { login } from './actions';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[390px] mx-auto space-y-6">
        {/* App Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 mb-2 border border-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Expense Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your personal dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-muted-foreground block"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground block"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 min-h-touch bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-muted-foreground/70">
          Private single-user instance • Public signups disabled
        </p>
      </div>
    </main>
  );
}
