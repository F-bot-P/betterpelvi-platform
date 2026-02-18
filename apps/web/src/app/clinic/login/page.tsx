// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

// export default function ClinicLoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const { error } = await supabase.auth.signInWithPassword({
//       email: email.trim(),
//       password,
//     });

//     setLoading(false);

//     if (error) return setError(error.message);

//     router.replace('/clinic/clients');
//   }
//   return (
//     <div style={wrap()}>
//       <div style={stage()}>
//         {/* BIG BACKGROUND LOGO */}
//         <img
//           src="/brand/logo-full.png"
//           alt="BetterPelvi"
//           style={backgroundLogo()}
//         />

//         {/* LOGIN CARD */}
//         <div style={card()}>
//           <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 18 }}>
//             Clinic Login
//           </div>

//           <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
//             <input
//               style={input()}
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               autoComplete="email"
//             />
//             <input
//               style={input()}
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               autoComplete="current-password"
//             />

//             <button disabled={loading} style={btnPrimary()}>
//               {loading ? 'Logging in…' : 'Login'}
//             </button>

//             {error && (
//               <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
//             )}
//           </form>

//           <div
//             style={{
//               marginTop: 12,
//               fontSize: 13,
//               display: 'flex',
//               justifyContent: 'space-between',
//             }}
//           >
//             <Link href="/clinic/forgot-password" style={{ color: '#0b0b0b' }}>
//               Forgot password?
//             </Link>
//             <Link href="/clinic/signup" style={{ color: '#0b0b0b' }}>
//               No account? Sign up
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function wrap(): React.CSSProperties {
//   return {
//     minHeight: '100vh',
//     display: 'grid',
//     gridTemplateRows: 'auto 1fr',
//     justifyItems: 'center',
//     paddingTop: 80,
//     background:
//       'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
//     color: '#111827',
//   };
// }
// function card(): React.CSSProperties {
//   return {
//     position: 'relative',
//     zIndex: 2,
//     width: 'min(520px, 92vw)',
//     borderRadius: 18,
//     padding: 22,
//     background: 'rgba(163, 95, 95, 0.05)',
//     border: '1px solid rgba(255,255,255,0.12)',
//     boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
//     backdropFilter: 'blur(30px)',
//   };
// }
// function input(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 12,
//     border: '1px solid #d1d5db', // light grey border
//     background: '#f1f3f5', // light grey background
//     color: '#111827', // black text
//     outline: 'none',
//     fontSize: 14,
//     caretColor: '#111827', // black cursor
//   };
// }
// function btnPrimary(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 12,
//     border: '1px solid rgba(205, 198, 198, 0.14)',
//     background: '#e66262',
//     color: '#0b0b0f',
//     fontWeight: 900,
//     cursor: 'pointer',
//   };
// }
// function stage(): React.CSSProperties {
//   return {
//     position: 'relative',
//     width: '100%',
//     minHeight: '100vh',
//     display: 'grid',
//     placeItems: 'center',
//     paddingTop: 120,
//     paddingBottom: 120,
//     overflow: 'hidden',
//   };
// }

// function backgroundLogo(): React.CSSProperties {
//   return {
//     position: 'absolute',
//     top: 370, // controls how much is hidden by the card
//     width: 800, // BIG logo
//     opacity: 0.35,
//     zIndex: 0,
//     pointerEvents: 'none',
//     filter: `
//       blur(1px)
//       drop-shadow(0 60px 120px rgba(231, 101, 101, 0.45))
//     `,
//   };
// }
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
    if (loading) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      return setError(error.message);
    }

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
              inputMode="email"
              disabled={loading}
            />
            <input
              style={input()}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />

            <button disabled={loading} style={btnPrimary(loading)}>
              {loading ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Spinner />
                  Logging in…
                </span>
              ) : (
                'Login'
              )}
            </button>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>
                {error}
              </div>
            )}
          </form>

          <div style={linksRow()}>
            <Link href="/clinic/forgot-password" style={linkStyle()}>
              Forgot password?
            </Link>
            <Link href="/clinic/signup" style={linkStyle()}>
              No account? Sign up
            </Link>
          </div>

          {/* Optional: hard feedback overlay while waiting */}
          {loading && (
            <div style={loadingOverlay()}>
              <div style={loadingChip()}>
                <Spinner />
                <div style={{ fontWeight: 800 }}>Signing in…</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Styles ---------------- */

function wrap(): React.CSSProperties {
  return {
    minHeight: '100vh',
    background:
      'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
    color: '#111827',
  };
}

function stage(): React.CSSProperties {
  return {
    position: 'relative',
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px 16px', // ✅ single, consistent padding (mobile-safe)
    overflow: 'hidden',
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(30px)',
  };
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#f1f3f5',
    color: '#111827',
    outline: 'none',
    fontSize: 14,
    caretColor: '#111827',
  };
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(205, 198, 198, 0.14)',
    background: '#e66262',
    color: '#0b0b0f',
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.85 : 1,
  };
}

function linksRow(): React.CSSProperties {
  return {
    marginTop: 12,
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap', // ✅ prevents ugly overflow on small screens
  };
}

function linkStyle(): React.CSSProperties {
  return { color: '#0b0b0b', fontWeight: 700, textDecoration: 'none' };
}

function backgroundLogo(): React.CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: -220, // ✅ responsive: anchor to bottom instead of fixed top pixels
    width: 'min(820px, 160vw)', // ✅ scales on mobile
    maxWidth: 900,
    opacity: 0.28,
    zIndex: 0,
    pointerEvents: 'none',
    filter: 'blur(1px) drop-shadow(0 60px 120px rgba(231, 101, 101, 0.35))',
  };
}

function loadingOverlay(): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(2px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 5,
  };
}

function loadingChip(): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.9)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    color: '#111827',
  };
}

/* ---------------- Small component ---------------- */

function Spinner() {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        border: '2px solid rgba(17, 24, 39, 0.25)',
        borderTopColor: 'rgba(17, 24, 39, 0.85)',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

/* Add keyframes once (inline style cannot define @keyframes, so we inject it) */
if (typeof document !== 'undefined') {
  const id = '_spin_keyframes_';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;
    document.head.appendChild(style);
  }
}
