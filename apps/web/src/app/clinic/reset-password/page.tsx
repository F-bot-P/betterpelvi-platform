'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CORAL = '#e76565';

export default function ClinicResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) return setErr(error.message);

    router.replace('/clinic/login');
  }

  return (
    <div style={wrap()}>
      <div style={card()}>
        <h1 style={title()}>Set new password</h1>

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input()}
            required
          />

          <button style={btnPrimary()} disabled={loading}>
            {loading ? 'Saving…' : 'Update password'}
          </button>

          {err && <div style={error()}>{err}</div>}
        </form>

        <div style={footer()}>
          <button onClick={() => router.push('/clinic/login')} style={link()}>
            ← Back to clinic login
          </button>
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
    background:
      'radial-gradient(1000px 500px at 90% 10%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
    padding: 16,
  };
}

function card(): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: 420,
    background: '#ffffff',
    borderRadius: 16,
    padding: 22,
    border: '1px solid #e5e7eb',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  };
}

function title(): React.CSSProperties {
  return {
    fontSize: 22,
    fontWeight: 900,
    color: '#111827',
    marginBottom: 14,
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
    color: '#ffffff',
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

function footer(): React.CSSProperties {
  return {
    marginTop: 16,
    textAlign: 'center',
  };
}

function link(): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: CORAL,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 700,
  };
}
