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
//       <div style={card()}>
//         <h1 style={title()}>Set new password</h1>

//         <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
//           <input
//             type="password"
//             placeholder="New password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             style={input()}
//             required
//           />

//           <button style={btnPrimary()} disabled={loading}>
//             {loading ? 'Saving…' : 'Update password'}
//           </button>

//           {err && <div style={error()}>{err}</div>}
//         </form>

//         <div style={footer()}>
//           <button onClick={() => router.push('/clinic/login')} style={link()}>
//             ← Back to clinic login
//           </button>
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
//   };
// }

// function card(): React.CSSProperties {
//   return {
//     width: '100%',
//     maxWidth: 420,
//     background: '#ffffff',
//     borderRadius: 16,
//     padding: 22,
//     border: '1px solid #e5e7eb',
//     boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
//   };
// }

// function title(): React.CSSProperties {
//   return {
//     fontSize: 22,
//     fontWeight: 900,
//     color: '#111827',
//     marginBottom: 14,
//   };
// }

// function input(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 10,
//     border: '1px solid #d1d5db',
//     background: '#f3f4f6',
//     color: '#111827',
//     fontSize: 14,
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
//     color: '#ffffff',
//     fontWeight: 900,
//     cursor: 'pointer',
//   };
// }

// function error(): React.CSSProperties {
//   return {
//     color: '#b91c1c',
//     fontSize: 13,
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
//     fontWeight: 700,
//   };
// }

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
      <div style={stage()}>
        {/* BIG BACKGROUND LOGO */}
        <img
          className="bp-logo"
          src="/brand/logo-full.png"
          alt="BetterPelvi"
          style={backgroundLogo()}
        />

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
    color: '#111827',
  };
}

function stage(): React.CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    height: '100dvh',
    display: 'grid',
    placeItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    overflow: 'hidden',
  };
}

function card(): React.CSSProperties {
  return {
    width: 'min(420px, 92vw)',
    background: 'rgba(255,255,255,0.88)',
    borderRadius: 16,
    padding: 22,
    border: '1px solid rgba(17, 24, 39, 0.10)',
    borderTop: `4px solid ${CORAL}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(14px)',
    position: 'relative',
    zIndex: 2,
  };
}

function title(): React.CSSProperties {
  return {
    fontSize: 24,
    fontWeight: 900,
    color: '#111827',
    marginBottom: 14,
    lineHeight: 1.1,
  };
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#f3f4f6',
    color: '#111827',
    fontSize: 16, // IMPORTANT: iOS smooth typing / no zoom
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
    fontWeight: 600,
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
    fontWeight: 800,
  };
}

function backgroundLogo(): React.CSSProperties {
  return {
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
}
