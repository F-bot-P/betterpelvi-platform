'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace('/admin');
  }

  return (
    <main className="bp-auth-layout">
      <div className="bp-auth-orbit bp-auth-orbit-one" />
      <div className="bp-auth-orbit bp-auth-orbit-two" />
      <section className="bp-auth-card" aria-labelledby="platform-login-title">
        <Link href="/" className="bp-brand-link" aria-label="BetterPelvi home">
          <img src="/brand/logo-full-dashboard.png" alt="BetterPelvi" />
        </Link>
        <p className="bp-eyebrow">Platform operations</p>
        <h1 id="platform-login-title">Manage clinic access.</h1>
        <p className="bp-auth-copy">
          Create clinic accounts, review activity, and keep operations organised.
        </p>

        <form className="bp-form" onSubmit={handleLogin}>
          <label>
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </label>
          {error && <p className="bp-form-error">{error}</p>}
          <button className="bp-button bp-button-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Open platform dashboard'}
          </button>
        </form>

        <p className="bp-auth-footnote">
          Clinic team member? <Link href="/clinic/login">Go to clinic login</Link>
        </p>
      </section>
    </main>
  );
}
