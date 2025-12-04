// src/app/auth/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // signup only
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // signup only
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  function resetMessages() {
    setMsg(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signup') {
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        const result = await api.authLogin({
          email: email.trim(),
          password,
        });

        setMsg(`Login request OK. User: ${result.user.username}`);
      } else {
        const result = await api.authSignup({
          email: email.trim(),
          password,
          username: username.trim(),
          displayName: username.trim(),
        });

        setMsg(`Signup request OK. User: ${result.user.username}`);
      }

      // ✅ Navigate to dashboard after successful auth
      if(mode === 'login'){
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Network or API error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      <h1 className="text-2xl font-semibold text-center">HabitBuddy</h1>
      <p className="text-sm text-slate-600 text-center">
        Log in to check in habits and keep your pet happy 🐾
      </p>

      {/* Tabs */}
      <div className="flex rounded-xl border bg-white text-slate-900 overflow-hidden text-sm">
        <button
          type="button"
          className={`flex-1 px-4 py-2 text-center transition-colors ${
            mode === 'login'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              : 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
          }`}
          onClick={() => {
            resetMessages();
            setMode('login');
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className={`flex-1 px-4 py-2 text-center transition-colors ${
            mode === 'signup'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              : 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
          }`}
          onClick={() => {
            resetMessages();
            setMode('signup');
          }}
        >
          Sign up
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-white text-slate-900 p-4 space-y-3 text-sm"
      >
        {mode === 'signup' && (
          <label className="flex flex-col gap-1">
            <span>Username</span>
            <input
              className="border rounded-md px-2 py-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="brian123"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            type="email"
            className="border rounded-md px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input
            type="password"
            className="border rounded-md px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {mode === 'signup' && (
          <label className="flex flex-col gap-1">
            <span>Confirm password</span>
            <input
              type="password"
              className="border rounded-md px-2 py-1"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? mode === 'login'
              ? 'Logging in...'
              : 'Signing up...'
            : mode === 'login'
            ? 'Log in'
            : 'Sign up'}
        </button>

        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {msg && <p className="text-xs text-emerald-600 mt-1">{msg}</p>}
      </form>
    </div>
  );
}
