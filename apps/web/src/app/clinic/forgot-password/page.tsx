'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CORAL = '#e76565';

export default function ClinicForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/clinic/reset-password`,
    });

    setLoading(false);

    if (error) return setErr(error.message);
    setSent(true);
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

        {/* FORGOT PASSWORD CARD */}
        <div style={card()}>
          <h1 style={title()}>Forgot password</h1>

          {sent ? (
            <>
              <p style={text()}>Check your email for a reset link.</p>

              <Link href="/clinic/login" style={link()}>
                ← Back to clinic login
              </Link>
            </>
          ) : (
            <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
              <input
                type="email"
                placeholder="Clinic email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input()}
                required
              />

              <button style={btnPrimary()} disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              {err && <div style={error()}>{err}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Styles
========================= */

function wrap(): React.CSSProperties {
  return {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    background:
      'radial-gradient(1000px 500px at 90% 10%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
  };
}

function card(): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    position: 'relative',
    zIndex: 2,

    background: '#ffffff',

    border: '1 px solid #000000',
    borderTop: '4px solid #e76565',

    // boxShadow: `
    //   0 10px 25px rgba(0,0,0,0.08),
    //   0 2px 6px rgba(0,0,0,0.04)
    // `,
  };
}

function title(): React.CSSProperties {
  return {
    fontSize: 22,
    fontWeight: 900,
    color: '#111827',
    marginBottom: 12,
  };
}

function text(): React.CSSProperties {
  return {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  };
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    background: '#f3f4f6',
    color: '#111827',
    fontSize: 14,
    outline: 'none',
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: 'none',
    background: CORAL,
    color: '#101010',
    fontWeight: 900,
    cursor: 'pointer',
  };
}

function error(): React.CSSProperties {
  return {
    color: '#b91c1c',
    fontSize: 13,
  };
}

function link(): React.CSSProperties {
  return {
    color: CORAL,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
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
    top: 380, // controls how much is hidden behind the card
    width: 700, // BIG logo
    opacity: 0.28,
    zIndex: 0,
    pointerEvents: 'none',
    filter: 'blur(1px) drop-shadow(0 60px 120px rgba(231, 101, 101, 0.45))',
  };
}
