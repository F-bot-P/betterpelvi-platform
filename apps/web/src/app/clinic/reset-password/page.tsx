// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

// const CORAL = '#e76565';

// export default function ClinicResetPasswordPage() {
//   const router = useRouter();
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   async function submit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setErr(null);

//     const { error } = await supabase.auth.updateUser({ password });

//     setLoading(false);
//     if (error) return setErr(error.message);

//     router.replace('/clinic/login');
//   }

//   return (
//     <div style={wrap()}>
//       <div style={stage()}>
//         {/* BIG BACKGROUND LOGO */}
//         <img
//           className="bp-logo"
//           src="/brand/logo-full.png"
//           alt="BetterPelvi"
//           style={backgroundLogo()}
//         />

//         <div style={card()}>
//           <h1 style={title()}>Set new password</h1>

//           <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
//             <input
//               type="password"
//               placeholder="New password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               style={input()}
//               required
//             />

//             <button style={btnPrimary()} disabled={loading}>
//               {loading ? 'Saving…' : 'Update password'}
//             </button>

//             {err && <div style={error()}>{err}</div>}
//           </form>

//           <div style={footer()}>
//             <button onClick={() => router.push('/clinic/login')} style={link()}>
//               ← Back to clinic login
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================
//    Styles
// ========================= */

// function wrap(): React.CSSProperties {
//   return {
//     minHeight: '100vh',
//     display: 'grid',
//     placeItems: 'center',
//     background:
//       'radial-gradient(1000px 500px at 90% 10%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
//     padding: 16,
//     color: '#111827',
//   };
// }

// function stage(): React.CSSProperties {
//   return {
//     position: 'relative',
//     width: '100%',
//     minHeight: '100svh',
//     display: 'grid',
//     placeItems: 'center',
//     paddingTop: 40,
//     paddingBottom: 40,
//     overflow: 'hidden',
//   };
// }

// function card(): React.CSSProperties {
//   return {
//     width: 'min(420px, 92vw)',
//     background: 'rgba(255,255,255,0.88)',
//     borderRadius: 16,
//     padding: 22,
//     border: '1px solid rgba(17, 24, 39, 0.10)',
//     borderTop: `4px solid ${CORAL}`,
//     boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
//     backdropFilter: 'blur(14px)',
//     position: 'relative',
//     zIndex: 2,
//   };
// }

// function title(): React.CSSProperties {
//   return {
//     fontSize: 24,
//     fontWeight: 900,
//     color: '#111827',
//     marginBottom: 14,
//     lineHeight: 1.1,
//   };
// }

// function input(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 12,
//     border: '1px solid #d1d5db',
//     background: '#f3f4f6',
//     color: '#111827',
//     fontSize: 16, // IMPORTANT: iOS smooth typing / no zoom
//     outline: 'none',
//   };
// }

// function btnPrimary(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 12,
//     border: 'none',
//     background: CORAL,
//     color: '#101010',
//     fontWeight: 900,
//     cursor: 'pointer',
//   };
// }

// function error(): React.CSSProperties {
//   return {
//     color: '#b91c1c',
//     fontSize: 13,
//     fontWeight: 600,
//   };
// }

// function footer(): React.CSSProperties {
//   return {
//     marginTop: 16,
//     textAlign: 'center',
//   };
// }

// function link(): React.CSSProperties {
//   return {
//     background: 'none',
//     border: 'none',
//     color: CORAL,
//     fontSize: 13,
//     cursor: 'pointer',
//     fontWeight: 800,
//   };
// }

// function backgroundLogo(): React.CSSProperties {
//   return {
//     position: 'absolute',
//     left: '50%',
//     transform: 'translateX(-50%)',
//     bottom: -160,
//     width: 'min(720px, 140vw)',
//     opacity: 0.22,
//     zIndex: 0,
//     pointerEvents: 'none',
//     filter: 'blur(1px)',
//   };
// }
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CORAL = '#e76565';

export default function ClinicResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Hydrate auth session from recovery link (fixes "Auth session missing")
  useEffect(() => {
    let alive = true;

    async function ensureSession() {
      try {
        setErr(null);
        setChecking(true);

        // 1) existing session?
        const { data: s1, error: e1 } = await supabase.auth.getSession();
        if (!alive) return;

        if (!e1 && s1?.session) {
          setHasSession(true);
          setChecking(false);
          return;
        }

        // 2) recovery tokens in URL hash (most common)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const params = new URLSearchParams(
          hash.startsWith('#') ? hash.slice(1) : hash,
        );

        const access_token = params.get('access_token') || '';
        const refresh_token = params.get('refresh_token') || '';

        if (access_token && refresh_token) {
          const { data: s2, error: e2 } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!alive) return;

          if (e2) {
            setHasSession(false);
            setErr(e2.message);
            setChecking(false);
            return;
          }

          if (s2?.session) {
            setHasSession(true);
            setChecking(false);

            // Clean URL so refresh doesn't re-run token parsing
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
            return;
          }
        }

        // 3) Optional fallback (PKCE/code links) — safe to attempt
        try {
          const href = window.location.href;
          const { data: s3, error: e3 } =
            await supabase.auth.exchangeCodeForSession(href);
          if (!alive) return;

          if (!e3 && s3?.session) {
            setHasSession(true);
            setChecking(false);
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
            return;
          }
        } catch {
          // ignore
        }

        setHasSession(false);
        setChecking(false);
        setErr(
          'Reset link expired or invalid. Please request a new password reset email.',
        );
      } catch (e: any) {
        if (!alive) return;
        setHasSession(false);
        setChecking(false);
        setErr(e?.message || 'Could not validate reset link.');
      }
    }

    ensureSession();

    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setOk(null);

    if (!hasSession) {
      setErr(
        'Reset link expired or invalid. Please request a new reset email.',
      );
      return;
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErr(error.message);
        return;
      }

      setOk('Password updated. Redirecting to login…');

      // Optional: clean state
      // await supabase.auth.signOut();

      setTimeout(() => router.replace('/clinic/login'), 700);
    } finally {
      setLoading(false);
    }
  }

  const disabled = useMemo(
    () => checking || loading || !hasSession,
    [checking, loading, hasSession],
  );

  return (
    <div style={WRAP}>
      <style jsx global>{`
        @keyframes bp-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile performance mode + visual consistency */
        @media (max-width: 640px) {
          .bp-card {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .bp-logo {
            filter: none !important;
            opacity: 0.12 !important;
            transform: translateX(-50%) !important;
          }
        }
      `}</style>

      <div style={STAGE}>
        <img
          className="bp-logo"
          src="/brand/logo-full.png"
          alt="BetterPelvi"
          style={BACKGROUND_LOGO}
          loading="eager"
          draggable={false}
        />

        <div className="bp-card" style={CARD}>
          <h1 style={TITLE}>Set new password</h1>

          {checking && (
            <div style={INFO_TEXT}>
              <span style={DOT_SPINNER} /> Verifying reset link…
            </div>
          )}

          {!checking && !hasSession && <div style={ERR_TEXT}>{err}</div>}

          <form onSubmit={submit} style={FORM}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={INPUT}
              required
              disabled={disabled}
              autoComplete="new-password"
            />

            <button style={BTN_PRIMARY} disabled={disabled}>
              {loading ? 'Saving…' : 'Update password'}
            </button>

            {err && hasSession && <div style={ERR_TEXT}>{err}</div>}
            {ok && <div style={OK_TEXT}>{ok}</div>}
          </form>

          <div style={FOOTER}>
            <button
              onClick={() => router.push('/clinic/login')}
              style={LINK_BTN}
              type="button"
            >
              ← Back to clinic login
            </button>

            {!checking && !hasSession && (
              <button
                onClick={() => router.push('/clinic/forgot-password')}
                style={LINK_BTN_SECONDARY}
                type="button"
              >
                Request a new reset link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Hoisted styles (stable layout + no churn)
========================= */

const WRAP: React.CSSProperties = {
  minHeight: '100svh',
  display: 'grid',
  placeItems: 'center',
  padding:
    'max(12px, env(safe-area-inset-top)) 14px max(12px, env(safe-area-inset-bottom))',
  background:
    'radial-gradient(1000px 500px at 90% 10%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
  color: '#111827',
};

const STAGE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: '100svh',
  display: 'grid',
  placeItems: 'center',
  paddingTop: 'clamp(14px, 4vh, 48px)',
  paddingBottom: 'clamp(14px, 4vh, 48px)',
  overflow: 'hidden',
};

const CARD: React.CSSProperties = {
  width: 'min(420px, 92vw)',
  background: 'rgba(255,255,255,0.88)',
  borderRadius: 16,
  padding: 22,
  border: '1px solid rgba(17, 24, 39, 0.10)',
  borderTop: `4px solid ${CORAL}`,
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  position: 'relative',
  zIndex: 2,
};

const TITLE: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: '#111827',
  marginBottom: 10,
  lineHeight: 1.1,
};

const FORM: React.CSSProperties = { display: 'grid', gap: 12, marginTop: 10 };

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#f3f4f6',
  color: '#111827',
  fontSize: 16,
  outline: 'none',
  fontWeight: 700,
};

const BTN_PRIMARY: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: 'none',
  background: CORAL,
  color: '#101010',
  fontWeight: 900,
  cursor: 'pointer',
};

const FOOTER: React.CSSProperties = {
  marginTop: 16,
  display: 'grid',
  gap: 8,
  textAlign: 'center',
};

const LINK_BTN: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: CORAL,
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 800,
};

const LINK_BTN_SECONDARY: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 800,
  opacity: 0.75,
};

const BACKGROUND_LOGO: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: -160,
  width: 'min(720px, 140vw)',
  opacity: 0.22,
  zIndex: 0,
  pointerEvents: 'none',
  filter: 'blur(1px)',
};

const INFO_TEXT: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 13,
  fontWeight: 800,
  color: '#111827',
  opacity: 0.8,
};

const DOT_SPINNER: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 999,
  border: '2px solid rgba(0,0,0,0.18)',
  borderTopColor: 'rgba(0,0,0,0.60)',
  animation: 'bp-spin 0.9s linear infinite',
};

const ERR_TEXT: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 700,
  marginTop: 10,
};

const OK_TEXT: React.CSSProperties = {
  color: '#166534',
  fontSize: 13,
  fontWeight: 800,
  marginTop: 10,
};
