// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import { supabaseBrowser } from '@/lib/supabase-browser';

// type Client = {
//   id: string;
//   full_name: string;
//   client_credits?: {
//     remaining_sessions: number;
//   };
// };

// export default function ClinicClientsPage() {
//   const [clients, setClients] = useState<Client[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [q, setQ] = useState('');
//   const [openCreate, setOpenCreate] = useState(false);

//   // create form state
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [location, setLocation] = useState('');
//   const [initialSessions, setInitialSessions] = useState('10');

//   async function loadClients() {
//     setLoading(true);

//     const { data } = await supabaseBrowser.auth.getSession();
//     const session = data.session;
//     if (!session) {
//       setLoading(false);
//       return;
//     }

//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
//       headers: { Authorization: `Bearer ${session.access_token}` },
//     });

//     if (!res.ok) {
//       console.error('Failed to fetch clients', await res.text());
//       setClients([]);
//       setLoading(false);
//       return;
//     }

//     const dataJson = await res.json();
//     setClients(Array.isArray(dataJson) ? dataJson : []);
//     setLoading(false);
//   }

//   useEffect(() => {
//     loadClients();
//   }, []);

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return clients;
//     return clients.filter((c) => (c.full_name ?? '').toLowerCase().includes(s));
//   }, [clients, q]);

//   async function createClient() {
//     const { data } = await supabaseBrowser.auth.getSession();
//     const session = data.session;
//     if (!session) return alert('Not logged in');

//     if (!fullName.trim()) return alert('Full name is required');

//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${session.access_token}`,
//       },
//       body: JSON.stringify({
//         full_name: fullName.trim(),
//         phone: phone.trim() || null,
//         email: email.trim() || null,
//         location: location.trim() || null,
//         initial_sessions: Math.max(10, Number(initialSessions) || 10),
//       }),
//     });

//     if (!res.ok) {
//       const t = await res.text();
//       console.error('Create client failed', t);
//       return alert(t || 'Create client failed');
//     }

//     // reset + refresh list
//     setFullName('');
//     setPhone('');
//     setEmail('');
//     setLocation('');
//     setInitialSessions('');
//     setOpenCreate(false);
//     await loadClients();
//   }

//   return (
//     <div
//       style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}
//     >
//       {/* LEFT: Clients list */}
//       <div style={panel()}>
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             gap: 12,
//           }}
//         >
//           <div style={{ fontWeight: 700 }}>Clients</div>
//           <button style={btn()} onClick={() => setOpenCreate(true)}>
//             + Create client
//           </button>
//         </div>

//         <div style={{ marginTop: 12 }}>
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Search client by name…"
//             style={input()}
//           />
//         </div>

//         <div style={{ marginTop: 14 }}>
//           {loading && (
//             <div style={{ color: 'rgba(255,255,255,0.65)' }}>Loading…</div>
//           )}

//           {!loading && filtered.length === 0 && (
//             <div style={{ color: 'rgba(255,255,255,0.65)' }}>
//               No clients found
//             </div>
//           )}

//           {!loading &&
//             filtered.map((c) => (
//               <div key={c.id} style={row()}>
//                 <div
//                   style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
//                 >
//                   <Link
//                     href={`/clinic/clients/${c.id}`}
//                     style={{ fontWeight: 700 }}
//                   >
//                     {c.full_name}
//                   </Link>
//                   <div
//                     style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}
//                   >
//                     Sessions : {c.client_credits?.remaining_sessions ?? 0}
//                   </div>
//                 </div>
//               </div>
//             ))}
//         </div>

//         <div style={{ marginTop: 10 }}>
//           <button style={btnGhost()} onClick={loadClients}>
//             Refresh list
//           </button>
//         </div>
//       </div>

//       {/* RIGHT: Create client panel (ONLY when open) */}
//       {openCreate && (
//         <div style={panel()}>
//           <div
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//             }}
//           >
//             <div style={{ fontWeight: 700 }}>Create Client</div>
//             <button style={btnGhost()} onClick={() => setOpenCreate(false)}>
//               Close
//             </button>
//           </div>

//           <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
//             <input
//               style={input()}
//               placeholder="Full name *"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//             />
//             <input
//               style={input()}
//               placeholder="Phone"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//             />
//             <input
//               style={input()}
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <input
//               style={input()}
//               placeholder="Location"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//             />

//             <input
//               style={input()}
//               type="number"
//               min={10}
//               step={10}
//               inputMode="numeric"
//               placeholder="Initial sessions (10, 20, 30…)"
//               value={initialSessions}
//               onChange={(e) => setInitialSessions(e.target.value)}
//             />

//             <div style={{ display: 'flex', gap: 10 }}>
//               <button style={btnPrimary()} onClick={createClient}>
//                 Create
//               </button>
//               <button style={btnGhost()} onClick={() => setOpenCreate(false)}>
//                 Cancel
//               </button>
//             </div>

//             <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
//               Sessions start at 10 by default. You can edit later on the client
//               page.
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /** tiny style helpers */
// function panel(): React.CSSProperties {
//   return {
//     background: 'var(--panel)',
//     border: '1px solid var(--border)',
//     borderRadius: 14,
//     padding: 16,
//     boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
//     minHeight: 240,
//   };
// }
// function input(): React.CSSProperties {
//   return {
//     width: '100%',
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: '1px solid rgba(255,255,255,0.12)',
//     background: 'rgba(255,255,255,0.04)',
//     color: 'var(--text)',
//     outline: 'none',
//   };
// }
// function row(): React.CSSProperties {
//   return {
//     padding: '12px 0',
//     borderTop: '1px solid rgba(255,255,255,0.08)',
//   };
// }
// function btn(): React.CSSProperties {
//   return {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: '1px solid rgba(255,255,255,0.14)',
//     background: 'rgba(255,255,255,0.06)',
//     color: 'var(--text)',
//     cursor: 'pointer',
//   };
// }
// function btnGhost(): React.CSSProperties {
//   return {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: '1px solid rgba(255,255,255,0.14)',
//     background: 'transparent',
//     color: 'var(--text)',
//     cursor: 'pointer',
//   };
// }
// function btnPrimary(): React.CSSProperties {
//   return {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: '1px solid rgba(255,255,255,0.14)',
//     background: 'var(--primary)',
//     color: '#0b0b0f',
//     fontWeight: 800,
//     cursor: 'pointer',
//   };
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Client = {
  id: string;
  full_name: string;
  client_credits?: {
    remaining_sessions: number;
  };
};

export default function ClinicClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [q, setQ] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  // create form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [initialSessions, setInitialSessions] = useState('10');

  async function loadClients(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;

    if (silent) setSyncing(true);
    else setInitialLoading(true);

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data.session;

      if (!session) {
        setClients([]);
        // if not logged in, send to login (no “loading” hanging)
        router.replace('/clinic/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        console.error('Failed to fetch clients', await res.text());
        setClients([]);
        return;
      }

      const dataJson = await res.json();
      setClients(Array.isArray(dataJson) ? dataJson : []);
    } catch (e) {
      console.error(e);
      setClients([]);
    } finally {
      if (silent) setSyncing(false);
      else setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadClients({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => (c.full_name ?? '').toLowerCase().includes(s));
  }, [clients, q]);

  async function createClient() {
    const { data } = await supabaseBrowser.auth.getSession();
    const session = data.session;
    if (!session) return router.replace('/clinic/login');

    if (!fullName.trim()) return alert('Full name is required');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        location: location.trim() || null,
        initial_sessions: Math.max(10, Number(initialSessions) || 10),
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('Create client failed', t);
      return alert(t || 'Create client failed');
    }

    // reset + refresh list (silent = no full-screen Loading)
    setFullName('');
    setPhone('');
    setEmail('');
    setLocation('');
    setInitialSessions('10');
    setOpenCreate(false);
    await loadClients({ silent: true });
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.replace('/clinic/login');
  }

  // only show a full-page loader the FIRST time.
  // afterwards we keep the UI and use a tiny "Syncing…" hint.
  if (initialLoading) {
    return (
      <div style={panel()}>
        <div style={{ color: 'rgba(255,255,255,0.75)' }}> </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 800, color: 'rgba(4, 4, 4, 0.85)' }}>
          Clinic Dashboard
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {syncing && (
            <div style={{ fontSize: 12, color: 'rgba(5, 5, 5, 0.55)' }}>
              Syncing…
            </div>
          )}
          <button style={btnGhost()} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}
      >
        {/* LEFT: Clients list */}
        <div style={panel()}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: '#161616' }}>Clients</div>
            <button style={btn()} onClick={() => setOpenCreate(true)}>
              + Create client
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search client by name…"
              style={input()}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            {filtered.length === 0 && (
              <div style={{ color: 'rgba(14, 13, 13, 0.65)' }}>
                No clients found
              </div>
            )}

            {filtered.map((c) => (
              <div key={c.id} style={row()}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <Link
                    href={`/clinic/clients/${c.id}`}
                    style={{ fontWeight: 700, color: '#111827' }}
                  >
                    {c.full_name}
                  </Link>
                  <div style={{ fontSize: 13, color: '#111827' }}>
                    Sessions : {c.client_credits?.remaining_sessions ?? 0}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              style={btnGhost()}
              onClick={() => loadClients({ silent: true })}
            >
              Refresh list
            </button>
          </div>
        </div>

        {/* RIGHT: Create client panel (ONLY when open) */}
        {openCreate && (
          <div style={panel()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontWeight: 700, color: '#111827' }}>
                Create Client
              </div>
              <button style={btnGhost()} onClick={() => setOpenCreate(false)}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <input
                style={input()}
                placeholder="Full name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                style={input()}
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                style={input()}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                style={input()}
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <input
                style={input()}
                type="number"
                min={10}
                step={10}
                inputMode="numeric"
                placeholder="Initial sessions (10, 20, 30…)"
                value={initialSessions}
                onChange={(e) => setInitialSessions(e.target.value)}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btnPrimary()} onClick={createClient}>
                  Create
                </button>
                <button style={btnGhost()} onClick={() => setOpenCreate(false)}>
                  Cancel
                </button>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(9, 9, 9, 0.55)',
                  fontWeight: '600',
                }}
              >
                Sessions start at 10 by default. You can edit later on the
                client page.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function panel(): React.CSSProperties {
  return {
    background: '#ffffff',
    border: '1px solid #141414',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    minHeight: 240,
  };
}
function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #606162',
    background: '#e8e8e9',
    color: '#111827',
    outline: 'none',
  };
}
function row(): React.CSSProperties {
  return {
    padding: '12px 0',
    borderTop: '1px solid #e5be7eb)',
    color: '#11827',
  };
}
function btn(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #0b0b0b',
    background: '#ffffff',
    color: '#f15b5b',
    cursor: 'pointer',
    fontWeight: 600,
  };
}
function btnGhost(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '2px solid  #171717)',
    background: '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 800,
  };
}
function btnPrimary(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '2px solid #111827',
    background: '#ffffff',
    color: '#f15b5b',
    fontWeight: 800,
    cursor: 'pointer',
  };
}
