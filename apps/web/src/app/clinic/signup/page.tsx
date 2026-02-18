'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClinicSignupPage() {
  const router = useRouter();

  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);

    if (!clinicName.trim()) return setErr('Clinic name is required');
    if (!email.trim()) return setErr('Email is required');
    if (password.length < 6)
      return setErr('Password must be at least 6 characters');

    setLoading(true);

    try {
      //
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(
        /\/+$/,
        '',
      );

      const res = await fetch(`${apiBase}/auth/clinic-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          clinic_name: clinicName.trim(),
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Signup failed');
      }

      setOkMsg('Clinic created. You can now log in.');
      setTimeout(() => router.replace('/clinic/login'), 900);
    } catch (e: any) {
      setErr(e?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
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

        {/* SIGNUP CARD */}
        <div style={card()}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 18 }}>
            Clinic Sign Up
          </div>

          <form onSubmit={handleSignup} style={{ display: 'grid', gap: 10 }}>
            <input
              style={input()}
              placeholder="Clinic name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />

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
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button style={btnPrimary()} disabled={loading}>
              {loading ? 'Creating…' : 'Create clinic'}
            </button>

            {err && <div style={{ color: '#ef4444', fontSize: 13 }}>{err}</div>}
            {okMsg && (
              <div style={{ color: '#22c55e', fontSize: 13 }}>{okMsg}</div>
            )}
          </form>

          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Link href="/clinic/login" style={{ color: '#0c0c0c' }}>
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function wrap(): React.CSSProperties {
  return {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 18,
    background:
      'radial-gradient(1200px 600px at 50% 20%, rgba(242, 114, 114, 0.15), transparent 60%), #ececf1',
    color: 'black',
  };
}

function card(): React.CSSProperties {
  return {
    width: 'min(520px, 92vw)',
    borderRadius: 18,
    padding: 22,
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(10px)',
  };
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(163, 161, 161, 0.35)',
    color: '#000000',
    outline: 'none',
    fontSize: 14,
    fontWeight: 700,
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
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
    top: 347, // controls how much is hidden behind the card
    width: 800, // BIG logo
    opacity: 0.28,
    zIndex: 0,
    pointerEvents: 'none',
    filter: 'blur(1px) drop-shadow(0 60px 120px rgba(231, 101, 101, 0.45))',
  };
}
