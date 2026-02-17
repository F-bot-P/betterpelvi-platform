'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ClinicLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) return setError(error.message);

    router.replace('/clinic/clients');
  }
  return (
    <div style={wrap()}>
      <div style={stage()}>
        {/* BIG BACKGROUND LOGO */}
        <img
          src="/brand/logo-full.png"
          alt="BetterPelvi"
          style={backgroundLogo()}
        />

        {/* LOGIN CARD */}
        <div style={card()}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 18 }}>
            Clinic Login
          </div>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
            <input
              style={input()}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              style={input()}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button disabled={loading} style={btnPrimary()}>
              {loading ? 'Logging in…' : 'Login'}
            </button>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
            )}
          </form>

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Link href="/clinic/forgot-password" style={{ color: '#0b0b0b' }}>
              Forgot password?
            </Link>
            <Link href="/clinic/signup" style={{ color: '#0b0b0b' }}>
              No account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function wrap(): React.CSSProperties {
  return {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    justifyItems: 'center',
    paddingTop: 80,
    background:
      'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
    color: '#111827',
  };
}
function card(): React.CSSProperties {
  return {
    position: 'relative',
    zIndex: 2,
    width: 'min(520px, 92vw)',
    borderRadius: 18,
    padding: 22,
    background: 'rgba(163, 95, 95, 0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(30px)',
  };
}
function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db', // light grey border
    background: '#f1f3f5', // light grey background
    color: '#111827', // black text
    outline: 'none',
    fontSize: 14,
    caretColor: '#111827', // black cursor
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(205, 198, 198, 0.14)',
    background: '#e66262',
    color: '#0b0b0f',
    fontWeight: 900,
    cursor: 'pointer',
  };
}
function stage(): React.CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    paddingTop: 120,
    paddingBottom: 120,
    overflow: 'hidden',
  };
}

function backgroundLogo(): React.CSSProperties {
  return {
    position: 'absolute',
    top: 370, // controls how much is hidden by the card
    width: 800, // BIG logo
    opacity: 0.35,
    zIndex: 0,
    pointerEvents: 'none',
    filter: `
      blur(1px)
      drop-shadow(0 60px 120px rgba(231, 101, 101, 0.45))
    `,
  };
}
