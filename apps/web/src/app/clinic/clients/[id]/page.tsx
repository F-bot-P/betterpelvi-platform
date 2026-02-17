// // 'use client';

// // import { useEffect, useMemo, useRef, useState } from 'react';
// // import { useParams, useRouter } from 'next/navigation';
// // import { supabaseBrowser } from '@/lib/supabase-browser';
// // import { QRCodeCanvas } from 'qrcode.react';

// // type ClientCredits = {
// //   total_sessions: number;
// //   remaining_sessions: number;
// // };

// // type Client = {
// //   id: string;
// //   full_name: string;
// //   username?: string | null;
// //   phone?: string | null;
// //   email?: string | null;
// //   location?: string | null;
// //   qr_token: string;
// //   client_credits: ClientCredits;
// // };

// // type ActiveSession = null | {
// //   id: string;
// //   status: 'active';
// //   started_at: string;
// //   auto_end_at: string;
// //   chair_id: string | null;
// // };

// // type SessionHistoryRow = {
// //   id: string;
// //   started_at: string;
// //   ended_at: string | null;
// //   ended_reason: string | null;
// //   status: 'active' | 'ended';
// //   chair_id: string | null;
// // };

// // function fmtDT(iso?: string | null) {
// //   if (!iso) return '';
// //   try {
// //     return new Date(iso).toLocaleString();
// //   } catch {
// //     return iso;
// //   }
// // }

// // function clamp(n: number, a: number, b: number) {
// //   return Math.max(a, Math.min(b, n));
// // }

// // export default function ClientDetailPage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const clientId = params.id as string;

// //   const [initialLoading, setInitialLoading] = useState(true);
// //   const [syncing, setSyncing] = useState(false);

// //   const [client, setClient] = useState<Client | null>(null);
// //   const [chairId, setChairId] = useState<string | null>(null);
// //   const [active, setActive] = useState<ActiveSession>(null);
// //   const [history, setHistory] = useState<SessionHistoryRow[]>([]);

// //   const [fullName, setFullName] = useState('');
// //   const [phone, setPhone] = useState('');
// //   const [email, setEmail] = useState('');
// //   const [location, setLocation] = useState('');
// //   const [notes, setNotes] = useState('');

// //   const [saving, setSaving] = useState(false);
// //   const [busySession, setBusySession] = useState(false);

// //   const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
// //   const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

// //   async function authedFetch(url: string, init?: RequestInit) {
// //     const { data } = await supabaseBrowser.auth.getSession();
// //     if (!data.session) throw new Error('Not authenticated');

// //     return fetch(url, {
// //       ...init,
// //       headers: {
// //         ...(init?.headers ?? {}),
// //         Authorization: `Bearer ${data.session.access_token}`,
// //       },
// //     });
// //   }

// //   async function loadAll(opts?: { silent?: boolean }) {
// //     const silent = opts?.silent ?? false;

// //     if (silent) setSyncing(true);
// //     else setInitialLoading(true);

// //     try {
// //       // client
// //       const cRes = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`,
// //       );
// //       if (!cRes.ok) throw new Error(await cRes.text());
// //       const cData: Client = await cRes.json();
// //       setClient(cData);

// //       setFullName(cData.full_name ?? '');
// //       setPhone(cData.phone ?? '');
// //       setEmail(cData.email ?? '');
// //       setLocation(cData.location ?? '');

// //       // chairs
// //       const chRes = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/chairs`,
// //       );

// //       if (!chRes.ok) {
// //         setChairId(null);
// //       } else {
// //         const chairs: { id: string }[] = await chRes.json();
// //         setChairId(chairs.length > 0 ? chairs[0].id : null);
// //       }

// //       // active session
// //       const aRes = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/sessions/active/${clientId}`,
// //       );

// //       if (aRes.status === 204) {
// //         setActive(null);
// //       } else {
// //         // IMPORTANT: your backend returns session directly (or null) in many setups.
// //         // Your current code expects { active }. We'll keep your structure, but make it resilient.
// //         const txt = await aRes.text();
// //         const parsed = txt ? JSON.parse(txt) : null;
// //         setActive(parsed?.active ?? parsed ?? null);
// //       }

// //       // history
// //       const hRes = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/sessions/client/${clientId}/history`,
// //       );
// //       if (!hRes.ok) throw new Error(await hRes.text());
// //       const hData: SessionHistoryRow[] = await hRes.json();
// //       setHistory(Array.isArray(hData) ? hData : []);
// //     } catch (e: any) {
// //       alert(e?.message ?? String(e));
// //     } finally {
// //       if (silent) setSyncing(false);
// //       else setInitialLoading(false);
// //     }
// //   }

// //   useEffect(() => {
// //     loadAll({ silent: false });
// //   }, [clientId]);

// //   // countdown
// //   useEffect(() => {
// //     if (tickRef.current) {
// //       clearInterval(tickRef.current);
// //       tickRef.current = null;
// //     }

// //     if (!active?.auto_end_at) {
// //       setSecondsLeft(null);
// //       return;
// //     }

// //     const update = () => {
// //       const ms = new Date(active.auto_end_at).getTime() - Date.now();
// //       const s = Math.max(0, Math.floor(ms / 1000));
// //       setSecondsLeft(s);

// //       if (s <= 0) {
// //         loadAll();
// //       }
// //     };

// //     update();
// //     tickRef.current = setInterval(update, 1000);

// //     return () => {
// //       if (tickRef.current) {
// //         clearInterval(tickRef.current);
// //         tickRef.current = null;
// //       }
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [active?.id]);

// //   const credits = client?.client_credits ?? {
// //     total_sessions: 0,
// //     remaining_sessions: 0,
// //   };

// //   const usedSessions = Math.max(
// //     0,
// //     credits.total_sessions - credits.remaining_sessions,
// //   );

// //   const donutStyle = useMemo(() => {
// //     const total = Math.max(1, credits.total_sessions);
// //     const usedPct = clamp((usedSessions / total) * 100, 0, 100);
// //     return {
// //       background: `conic-gradient(#60a5fa ${usedPct}%, rgba(255,255,255,0.10) 0)`,
// //     } as React.CSSProperties;
// //   }, [credits.total_sessions, usedSessions]);

// //   async function startSession() {
// //     if (!chairId) return;
// //     if (credits.remaining_sessions < 1) return;
// //     if (active?.id) return;

// //     setBusySession(true);
// //     try {
// //       const res = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/sessions/start`,
// //         {
// //           method: 'POST',
// //           headers: { 'Content-Type': 'application/json' },
// //           body: JSON.stringify({ clientId, chairId }),
// //         },
// //       );
// //       if (!res.ok) throw new Error(await res.text());
// //       await loadAll();
// //     } finally {
// //       setBusySession(false);
// //     }
// //   }

// //   async function endSession() {
// //     if (!active?.id) return;
// //     if (!confirm('Are you sure you want to end the session?')) return;

// //     setBusySession(true);
// //     try {
// //       const res = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/sessions/${active.id}/stop`,
// //         { method: 'POST' },
// //       );
// //       if (!res.ok) throw new Error(await res.text());
// //       await loadAll();
// //     } finally {
// //       setBusySession(false);
// //     }
// //   }

// //   async function saveClient() {
// //     if (!client) return;

// //     setSaving(true);
// //     try {
// //       const res = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}`,
// //         {
// //           method: 'PATCH',
// //           headers: { 'Content-Type': 'application/json' },
// //           body: JSON.stringify({
// //             full_name: fullName.trim(),
// //             phone: phone.trim() || null,
// //             email: email.trim() || null,
// //             location: location.trim() || null,
// //           }),
// //         },
// //       );

// //       const text = await res.text();
// //       if (!res.ok) throw new Error(text || 'Failed to save client');

// //       await loadAll();
// //     } catch (e: any) {
// //       alert(e?.message ?? String(e));
// //     } finally {
// //       setSaving(false);
// //     }
// //   }

// //   async function adjustSessions(amount: 10 | -10 | 1 | -1) {
// //     if (!client) return;

// //     try {
// //       const res = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}/credits`,
// //         {
// //           method: 'POST',
// //           headers: { 'Content-Type': 'application/json' },
// //           body: JSON.stringify({ amount }),
// //         },
// //       );

// //       const text = await res.text();
// //       if (!res.ok) throw new Error(text || 'Failed to adjust sessions');

// //       await loadAll({ silent: true });
// //     } catch (e: any) {
// //       alert(e?.message ?? String(e));
// //     }
// //   }

// //   if (initialLoading) return <div style={{ padding: 24 }} />;
// //   if (!client) return <div style={{ padding: 24 }}>Client not found</div>;

// //   // ✅ FIX: QR MUST CONTAIN FULL URL, NOT JUST TOKEN
// //   //   const webBase =
// //   //     process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
// //   //     (typeof window !== 'undefined' ? window.location.origin : '');
// //   //   const qrUrl = `${webBase}/qr/${client.qr_token}`;
// //   const webBase =
// //     process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ??
// //     'http://localhost:3000';

// //   // const qrUrl = `${webBase}/qr/${client.qr_token}`;
// //   const [qrToken, setQrToken] = useState<string | null>(null);

// //   useEffect(() => {
// //     if (!client) return;

// //     (async () => {
// //       const res = await authedFetch(
// //         `${process.env.NEXT_PUBLIC_API_URL}/qr/client/${client.id}`,
// //         { method: 'POST' },
// //       );
// //       if (!res.ok) {
// //         console.error(await res.text());
// //         return;
// //       }

// //       const data = await res.json();
// //       setQrToken(data.token);
// //     })();
// //   }, [client?.id]);

// //   return (
// //     <div style={{ padding: 18 }}>
// //       <div
// //         style={{
// //           display: 'flex',
// //           alignItems: 'center',
// //           justifyContent: 'space-between',
// //           marginBottom: 14,
// //         }}
// //       >
// //         <div
// //           style={{
// //             fontWeight: 800,
// //             fontSize: 14,
// //             color: 'rgba(255,255,255,0.85)',
// //           }}
// //         >
// //           Clinic Dashboard
// //         </div>
// //         <button style={btnGhost()} onClick={() => router.back()}>
// //           ← Back
// //         </button>
// //       </div>

// //       <div
// //         style={{
// //           display: 'grid',
// //           gridTemplateColumns: '1.25fr 0.95fr',
// //           gap: 16,
// //         }}
// //       >
// //         {/* LEFT */}
// //         <div style={panel()}>
// //           <div
// //             style={{
// //               display: 'flex',
// //               alignItems: 'baseline',
// //               justifyContent: 'space-between',
// //               gap: 12,
// //             }}
// //           >
// //             <div style={{ fontSize: 18, fontWeight: 900 }}>
// //               {client.full_name}
// //             </div>
// //             <button style={btnPrimary()} onClick={saveClient} disabled={saving}>
// //               {saving ? 'Saving…' : 'Save'}
// //             </button>
// //           </div>

// //           <div
// //             style={{
// //               marginTop: 12,
// //               display: 'grid',
// //               gridTemplateColumns: '1fr 1fr',
// //               gap: 10,
// //             }}
// //           >
// //             <div>
// //               <div style={label()}>Full name</div>
// //               <input
// //                 style={input()}
// //                 value={fullName}
// //                 onChange={(e) => setFullName(e.target.value)}
// //               />
// //             </div>

// //             <div>
// //               <div style={label()}>Phone</div>
// //               <input
// //                 style={input()}
// //                 value={phone}
// //                 onChange={(e) => setPhone(e.target.value)}
// //               />
// //             </div>

// //             <div>
// //               <div style={label()}>Email</div>
// //               <input
// //                 style={input()}
// //                 value={email}
// //                 onChange={(e) => setEmail(e.target.value)}
// //               />
// //             </div>

// //             <div>
// //               <div style={label()}>Location</div>
// //               <input
// //                 style={input()}
// //                 value={location}
// //                 onChange={(e) => setLocation(e.target.value)}
// //               />
// //             </div>
// //           </div>

// //           <div style={{ marginTop: 10 }}>
// //             <div style={label()}>Notes</div>
// //             <textarea
// //               style={{ ...input(), height: 80, resize: 'vertical' }}
// //               value={notes}
// //               onChange={(e) => setNotes(e.target.value)}
// //               placeholder="Optional note (e.g. treatment type)…"
// //             />
// //           </div>

// //           <div
// //             style={{
// //               marginTop: 16,
// //               fontWeight: 800,
// //               color: 'rgba(255,255,255,0.85)',
// //             }}
// //           >
// //             History
// //           </div>

// //           <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
// //             {history.length === 0 && (
// //               <div style={{ color: 'rgba(255,255,255,0.6)' }}>
// //                 No sessions yet.
// //               </div>
// //             )}

// //             {history.map((h) => {
// //               const title =
// //                 h.status === 'active' ? 'SESSION_ACTIVE' : 'SESSION_END';
// //               const subtitle =
// //                 h.status === 'active'
// //                   ? `Started: ${fmtDT(h.started_at)}`
// //                   : `Ended: ${fmtDT(h.ended_at)} (${h.ended_reason ?? 'ended'})`;

// //               return (
// //                 <div key={h.id} style={card()}>
// //                   <div
// //                     style={{
// //                       display: 'flex',
// //                       justifyContent: 'space-between',
// //                       gap: 12,
// //                     }}
// //                   >
// //                     <div style={{ fontWeight: 900 }}>{title}</div>
// //                     <div
// //                       style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
// //                     >
// //                       {fmtDT(h.started_at)}
// //                     </div>
// //                   </div>
// //                   <div
// //                     style={{
// //                       marginTop: 6,
// //                       color: 'rgba(255,255,255,0.75)',
// //                       fontSize: 13,
// //                     }}
// //                   >
// //                     {subtitle}
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </div>

// //         {/* RIGHT */}
// //         <div style={panel()}>
// //           <div
// //             style={{
// //               display: 'flex',
// //               alignItems: 'center',
// //               justifyContent: 'space-between',
// //             }}
// //           >
// //             <div style={{ fontWeight: 900 }}>Sessions</div>
// //             <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
// //               Chair: {chairId ? 'Configured' : 'Missing'}
// //             </div>
// //           </div>

// //           <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.75)' }}>
// //             Used <b>{usedSessions}</b> / <b>{credits.total_sessions}</b>
// //           </div>

// //           <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
// //             Remaining: {credits.remaining_sessions}
// //           </div>

// //           {/* Donut */}
// //           <div
// //             style={{
// //               marginTop: 12,
// //               display: 'flex',
// //               alignItems: 'center',
// //               gap: 14,
// //             }}
// //           >
// //             <div style={{ ...donutWrap(), ...donutStyle }}>
// //               <div style={donutInner()}>
// //                 <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
// //                   Remaining
// //                 </div>
// //                 <div style={{ fontSize: 18, fontWeight: 900 }}>
// //                   {credits.remaining_sessions}
// //                 </div>
// //               </div>
// //             </div>

// //             <div style={{ display: 'grid', gap: 8, flex: 1 }}>
// //               <div
// //                 style={{
// //                   display: 'grid',
// //                   gridTemplateColumns: '1fr 1fr',
// //                   gap: 8,
// //                 }}
// //               >
// //                 <button style={btn()} onClick={() => adjustSessions(10)}>
// //                   +10
// //                 </button>
// //                 <button style={btn()} onClick={() => adjustSessions(-10)}>
// //                   -10
// //                 </button>
// //               </div>
// //               <div
// //                 style={{
// //                   display: 'grid',
// //                   gridTemplateColumns: '1fr 1fr',
// //                   gap: 8,
// //                 }}
// //               >
// //                 <button style={btn()} onClick={() => adjustSessions(1)}>
// //                   +1
// //                 </button>
// //                 <button style={btn()} onClick={() => adjustSessions(-1)}>
// //                   -1
// //                 </button>
// //               </div>
// //             </div>
// //           </div>

// //           {/* ✅ QR */}
// //           <div style={{ marginTop: 14 }}>
// //             <div style={label()}>QR (scan to open client page)</div>
// //             <div
// //               style={{
// //                 background: '#fff',
// //                 padding: 12,
// //                 borderRadius: 12,
// //                 width: 'fit-content',
// //               }}
// //             >
// //               {qrToken && (
// //                 <QRCodeCanvas
// //                   value={`${webBase}/qr/${qrToken}`}
// //                   size={180}
// //                   bgColor="#ffffff"
// //                   fgColor="#000000"
// //                   level="H"
// //                 />
// //               )}
// //             </div>

// //             <div
// //               style={{
// //                 marginTop: 8,
// //                 fontSize: 12,
// //                 color: 'rgba(255,255,255,0.6)',
// //                 wordBreak: 'break-all',
// //               }}
// //             ></div>

// //             <div
// //               style={{
// //                 marginTop: 6,
// //                 fontSize: 12,
// //                 color: 'rgba(255,255,255,0.45)',
// //                 wordBreak: 'break-all',
// //               }}
// //             >
// //               Token: {client.qr_token}
// //             </div>
// //           </div>

// //           {/* Timer + Start/End */}
// //           <div style={{ marginTop: 16 }}>
// //             {active?.id ? (
// //               <>
// //                 <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
// //                   Session active — auto ends at{' '}
// //                   <b>{fmtDT(active.auto_end_at)}</b>
// //                 </div>

// //                 <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
// //                   {secondsLeft === null
// //                     ? '…'
// //                     : `${Math.floor(secondsLeft / 60)
// //                         .toString()
// //                         .padStart(2, '0')}:${(secondsLeft % 60)
// //                         .toString()
// //                         .padStart(2, '0')}`}
// //                 </div>

// //                 <button
// //                   style={btnDanger()}
// //                   onClick={endSession}
// //                   disabled={busySession}
// //                 >
// //                   {busySession ? 'Ending…' : 'End (confirm)'}
// //                 </button>
// //               </>
// //             ) : (
// //               <button
// //                 style={btnPrimary()}
// //                 onClick={startSession}
// //                 disabled={busySession || credits.remaining_sessions < 1}
// //               >
// //                 {busySession ? 'Starting…' : 'Start'}
// //               </button>
// //             )}
// //           </div>

// //           <div style={{ marginTop: 12 }}>
// //             <button
// //               style={btnGhost()}
// //               onClick={() => loadAll({ silent: false })}
// //             >
// //               Refresh
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* ---- styles ---- */

// // function panel(): React.CSSProperties {
// //   return {
// //     background: 'var(--panel)',
// //     border: '1px solid var(--border)',
// //     borderRadius: 14,
// //     padding: 16,
// //     boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
// //   };
// // }
// // function label(): React.CSSProperties {
// //   return { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 };
// // }
// // function input(): React.CSSProperties {
// //   return {
// //     width: '100%',
// //     padding: '10px 12px',
// //     borderRadius: 10,
// //     border: '1px solid rgba(255,255,255,0.12)',
// //     background: 'rgba(255,255,255,0.04)',
// //     color: 'var(--text)',
// //     outline: 'none',
// //   };
// // }
// // function btn(): React.CSSProperties {
// //   return {
// //     padding: '10px 12px',
// //     borderRadius: 10,
// //     border: '1px solid rgba(255,255,255,0.14)',
// //     background: 'rgba(255,255,255,0.06)',
// //     color: 'var(--text)',
// //     cursor: 'pointer',
// //     fontWeight: 800,
// //   };
// // }
// // function btnGhost(): React.CSSProperties {
// //   return {
// //     padding: '10px 12px',
// //     borderRadius: 10,
// //     border: '1px solid rgba(255,255,255,0.14)',
// //     background: 'transparent',
// //     color: 'var(--text)',
// //     cursor: 'pointer',
// //     fontWeight: 800,
// //   };
// // }
// // function btnPrimary(): React.CSSProperties {
// //   return {
// //     padding: '10px 12px',
// //     borderRadius: 10,
// //     border: '1px solid rgba(255,255,255,0.14)',
// //     background: 'var(--primary)',
// //     color: '#0b0b0f',
// //     fontWeight: 900,
// //     cursor: 'pointer',
// //     width: '100%',
// //   };
// // }
// // function btnDanger(): React.CSSProperties {
// //   return {
// //     padding: '10px 12px',
// //     borderRadius: 10,
// //     border: '1px solid rgba(255,255,255,0.14)',
// //     background: '#ef4444',
// //     color: '#0b0b0f',
// //     fontWeight: 900,
// //     cursor: 'pointer',
// //     width: '100%',
// //     marginTop: 10,
// //   };
// // }
// // function card(): React.CSSProperties {
// //   return {
// //     border: '1px solid rgba(255,255,255,0.10)',
// //     background: 'rgba(255,255,255,0.03)',
// //     borderRadius: 12,
// //     padding: 12,
// //   };
// // }
// // function donutWrap(): React.CSSProperties {
// //   return {
// //     width: 120,
// //     height: 120,
// //     borderRadius: 999,
// //     padding: 10,
// //   };
// // }
// // function donutInner(): React.CSSProperties {
// //   return {
// //     width: '100%',
// //     height: '100%',
// //     borderRadius: 999,
// //     background: 'rgba(0,0,0,0.55)',
// //     border: '1px solid rgba(255,255,255,0.10)',
// //     display: 'flex',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     flexDirection: 'column',
// //     gap: 2,
// //   };
// // }

// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { supabaseBrowser } from '@/lib/supabase-browser';
// import { QRCodeCanvas } from 'qrcode.react';

// const CORAL = '#f15b5b';

// /* =========================
//    Types
// ========================= */

// type ClientCredits = {
//   total_sessions: number;
//   remaining_sessions: number;
// };

// type Client = {
//   id: string;
//   full_name: string;
//   username?: string | null;
//   phone?: string | null;
//   email?: string | null;
//   location?: string | null;
//   qr_token: string;
//   client_credits: ClientCredits;
// };

// type ActiveSession = null | {
//   id: string;
//   status: 'active';
//   started_at: string;
//   auto_end_at: string;
//   chair_id: string | null;
// };

// type SessionHistoryRow = {
//   id: string;
//   started_at: string;
//   ended_at: string | null;
//   ended_reason: string | null;
//   status: 'active' | 'ended';
//   chair_id: string | null;
// };

// /* =========================
//    Utils
// ========================= */

// function fmtDT(iso?: string | null) {
//   if (!iso) return '';
//   try {
//     return new Date(iso).toLocaleString();
//   } catch {
//     return iso;
//   }
// }

// function clamp(n: number, a: number, b: number) {
//   return Math.max(a, Math.min(b, n));
// }

// /* =========================
//    Page
// ========================= */

// export default function ClientDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const clientId = params.id as string;

//   /* ---------- State (ALL HOOKS FIRST) ---------- */

//   const [initialLoading, setInitialLoading] = useState(true);
//   const [syncing, setSyncing] = useState(false);

//   const [client, setClient] = useState<Client | null>(null);
//   const [chairId, setChairId] = useState<string | null>(null);
//   const [active, setActive] = useState<ActiveSession>(null);
//   const [history, setHistory] = useState<SessionHistoryRow[]>([]);

//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [location, setLocation] = useState('');
//   const [notes, setNotes] = useState('');

//   const [saving, setSaving] = useState(false);
//   const [busySession, setBusySession] = useState(false);

//   const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
//   const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const [qrToken, setQrToken] = useState<string | null>(null);

//   /* ---------- Auth Fetch ---------- */

//   async function authedFetch(url: string, init?: RequestInit) {
//     const { data } = await supabaseBrowser.auth.getSession();
//     if (!data.session) throw new Error('Not authenticated');

//     return fetch(url, {
//       ...init,
//       headers: {
//         ...(init?.headers ?? {}),
//         Authorization: `Bearer ${data.session.access_token}`,
//       },
//     });
//   }

//   /* ---------- Load Data ---------- */

//   async function loadAll(opts?: { silent?: boolean }) {
//     const silent = opts?.silent ?? false;

//     if (silent) setSyncing(true);
//     else setInitialLoading(true);

//     try {
//       const cRes = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`,
//       );
//       if (!cRes.ok) throw new Error(await cRes.text());
//       const cData: Client = await cRes.json();

//       setClient(cData);
//       setFullName(cData.full_name ?? '');
//       setPhone(cData.phone ?? '');
//       setEmail(cData.email ?? '');
//       setLocation(cData.location ?? '');

//       const chRes = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/chairs`,
//       );
//       if (chRes.ok) {
//         const chairs: { id: string }[] = await chRes.json();
//         setChairId(chairs[0]?.id ?? null);
//       }

//       const aRes = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/sessions/active/${clientId}`,
//       );
//       if (aRes.status === 204) setActive(null);
//       else {
//         const txt = await aRes.text();
//         const parsed = txt ? JSON.parse(txt) : null;
//         setActive(parsed?.active ?? parsed ?? null);
//       }

//       const hRes = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/sessions/client/${clientId}/history`,
//       );
//       if (hRes.ok) {
//         const hData = await hRes.json();
//         setHistory(Array.isArray(hData) ? hData : []);
//       }
//     } catch (e: any) {
//       alert(e?.message ?? String(e));
//     } finally {
//       if (silent) setSyncing(false);
//       else setInitialLoading(false);
//     }
//   }

//   /* ---------- Effects ---------- */

//   useEffect(() => {
//     loadAll();
//   }, [clientId]);

//   useEffect(() => {
//     if (!client) return;

//     (async () => {
//       const res = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/qr/client/${client.id}`,
//         { method: 'POST' },
//       );
//       if (!res.ok) return;
//       const data = await res.json();
//       setQrToken(data.token);
//     })();
//   }, [client?.id]);

//   useEffect(() => {
//     if (tickRef.current) clearInterval(tickRef.current);

//     if (!active?.auto_end_at) {
//       setSecondsLeft(null);
//       return;
//     }

//     const update = () => {
//       const ms = new Date(active.auto_end_at).getTime() - Date.now();
//       setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
//     };

//     update();
//     tickRef.current = setInterval(update, 1000);

//     return () => {
//       if (tickRef.current) clearInterval(tickRef.current);
//     };
//   }, [active?.id]);

//   /* ---------- Derived ---------- */

//   const credits = client?.client_credits ?? {
//     total_sessions: 0,
//     remaining_sessions: 0,
//   };

//   const usedSessions = Math.max(
//     0,
//     credits.total_sessions - credits.remaining_sessions,
//   );

//   const donutStyle = useMemo(() => {
//     const pct = clamp(
//       (usedSessions / Math.max(1, credits.total_sessions)) * 100,
//       0,
//       100,
//     );
//     return {
//       background: `conic-gradient(#f47272 ${pct}%, #f1f1f1 0)`,
//     } as React.CSSProperties;
//   }, [credits.total_sessions, usedSessions]);

//   const webBase =
//     process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ??
//     'http://localhost:3000';

//   /* ---------- Guards ---------- */

//   if (initialLoading) return <div style={{ padding: 24 }} />;
//   if (!client) return <div style={{ padding: 24 }}>Client not found</div>;

//   /* =========================
//      Render
//   ========================= */
//   const btnPrimary = (): React.CSSProperties => ({
//     width: '100%',
//     padding: '10px 14px',
//     borderRadius: 12,
//     border: 'none',
//     background: '#e76565',
//     color: '#262424',
//     fontWeight: 900,
//     cursor: 'pointer',
//   });

//   return (
//     <div style={{ padding: 18, background: '#fff', minHeight: '100vh' }}>
//       {/* HEADER */}
//       <div style={header()}>
//         <div style={{ fontWeight: 800, color: '#111827' }}>
//           Clinic Dashboard
//         </div>
//         <button style={btnGhost()} onClick={() => router.back()}>
//           ← Back
//         </button>
//       </div>

//       <div style={grid()}>
//         {/* LEFT */}
//         <div style={panel()}>
//           <h2 style={{ marginBottom: 12, color: '#111827' }}>
//             {client.full_name}
//           </h2>
//           <button style={btnPrimary()} onClick={saveClient} disabled={saving}>
//             {saving ? 'Saving…' : 'Save'}
//           </button>

//           <div style={formGrid()}>
//             <Input label="Full name" value={fullName} onChange={setFullName} />
//             <Input label="Phone" value={phone} onChange={setPhone} />
//             <Input label="Email" value={email} onChange={setEmail} />
//             <Input label="Location" value={location} onChange={setLocation} />
//           </div>

//           <label style={label()}>Notes</label>
//           <textarea
//             style={{ ...input(), height: 80 }}
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//           />

//           <h3 style={{ marginTop: 18, color: '#111827' }}>History</h3>

//           {history.length === 0 && (
//             <div style={{ fontSize: 13, color: '#0f0f0f' }}>
//               No sessions yet.
//             </div>
//           )}

//           {history.map((h) => (
//             <div key={h.id} style={card()}>
//               <b style={{ color: '#111827' }}>{h.status.toUpperCase()}</b>
//               <div style={{ fontSize: 13, color: '#101112' }}>
//                 {fmtDT(h.started_at)}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* RIGHT */}
//         <div style={panel()}>
//           <div style={{ fontWeight: 800, color: '#111827' }}>Sessions</div>

//           <div style={{ marginTop: 6, color: '#6b7280' }}>
//             Used {usedSessions} / {credits.total_sessions}
//           </div>

//           <div style={{ ...donutWrap(), ...donutStyle }}>
//             <div style={donutInner()}>{credits.remaining_sessions}</div>
//           </div>

//           <div style={{ marginTop: 18 }}>
//             {qrToken && (
//               <div
//                 style={{
//                   padding: 12,
//                   borderRadius: 12,
//                   border: '1px solid #545353',
//                   background: '#fff',
//                   width: 'fit-content',
//                 }}
//               >
//                 <QRCodeCanvas
//                   value={`${webBase}/qr/${qrToken}`}
//                   size={180}
//                   level="H"
//                 />
//               </div>
//             )}
//           </div>
//           {qrToken && (
//             <div
//               style={{
//                 fontSize: 12,
//                 marginTop: 6,
//                 color: '#6b7280',
//                 wordBreak: 'break-all',
//               }}
//             >
//               {`${webBase}/qr/${qrToken}`}
//             </div>
//           )}
//           {/*Adjust Session*/}
//           <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
//             <div
//               style={{
//                 display: 'grid',
//                 gridTemplateColumns: '1fr 1fr',
//                 gap: 8,
//               }}
//             >
//               <button style={btnGhost()} onClick={() => adjustSessions(10)}>
//                 +10
//               </button>
//               <button style={btnGhost()} onClick={() => adjustSessions(-10)}>
//                 -10
//               </button>
//             </div>

//             <div
//               style={{
//                 display: 'grid',
//                 gridTemplateColumns: '1fr 1fr',
//                 gap: 8,
//               }}
//             >
//               <button style={btnGhost()} onClick={() => adjustSessions(1)}>
//                 +1
//               </button>
//               <button style={btnGhost()} onClick={() => adjustSessions(-1)}>
//                 -1
//               </button>
//             </div>
//           </div>
//           <div style={{ marginTop: 16 }}>
//             {active?.id ? (
//               <>
//                 <div style={{ fontSize: 13, color: '#6b7280' }}>
//                   Session active — auto ends at{' '}
//                   <b>{fmtDT(active.auto_end_at)}</b>
//                 </div>

//                 <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
//                   {secondsLeft === null
//                     ? '…'
//                     : `${Math.floor(secondsLeft / 60)
//                         .toString()
//                         .padStart(2, '0')}:${(secondsLeft % 60)
//                         .toString()
//                         .padStart(2, '0')}`}
//                 </div>

//                 <button style={btnPrimary()} onClick={endSession}>
//                   End (confirm)
//                 </button>
//               </>
//             ) : (
//               <button
//                 style={btnPrimary()}
//                 onClick={startSession}
//                 disabled={credits.remaining_sessions < 1}
//               >
//                 Start
//               </button>
//             )}
//           </div>
//           <div style={{ marginTop: 12 }}>
//             <button style={btnGhost()} onClick={() => loadAll()}>
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   /* =========================
//    Small Components
// ========================= */

//   function Input({
//     label,
//     value,
//     onChange,
//   }: {
//     label: string;
//     value: string;
//     onChange: (v: string) => void;
//   }) {
//     return (
//       <div>
//         <div style={labelStyle()}>{label}</div>
//         <input
//           style={input()}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//         />
//       </div>
//     );
//   }

//   /* =========================
//    Styles (White + Soft Coral)
// ========================= */
//   async function saveClient() {
//     if (!client) return;

//     setSaving(true);
//     try {
//       const res = await authedFetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}`,
//         {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             full_name: fullName.trim(),
//             phone: phone.trim() || null,
//             email: email.trim() || null,
//             location: location.trim() || null,
//           }),
//         },
//       );

//       if (!res.ok) throw new Error(await res.text());
//       await loadAll();
//     } finally {
//       setSaving(false);
//     }
//   }

//   function header(): React.CSSProperties {
//     return {
//       display: 'flex',
//       justifyContent: 'space-between',
//       marginBottom: 16,
//     };
//   }

//   function grid(): React.CSSProperties {
//     return {
//       display: 'grid',
//       gridTemplateColumns: '1.25fr 1fr',
//       gap: 16,
//     };
//   }

//   function panel(): React.CSSProperties {
//     return {
//       border: '1px solid #e5e7eb',
//       borderRadius: 14,
//       padding: 16,
//       background: '#ffffff',
//       boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
//     };
//   }

//   function labelStyle(): React.CSSProperties {
//     return {
//       fontSize: 12,
//       color: '#6b7280',
//       marginBottom: 6,
//     };
//   }

//   function label(): React.CSSProperties {
//     return {
//       fontSize: 12,
//       marginTop: 10,
//       color: '#6b7280',
//     };
//   }

//   function input(): React.CSSProperties {
//     return {
//       width: '100%',
//       padding: '10px 12px',
//       borderRadius: 10,
//       border: '3.3px solid #e5e7eb',
//       background: '#ffffff',
//       color: '#111827',
//       outline: 'none',
//     };
//   }

//   function btnGhost(): React.CSSProperties {
//     return {
//       border: '1.5px solid ${CORAL}',
//       background: '#ffffff',
//       color: CORAL,
//       padding: '8px 12px',
//       borderRadius: 10,
//       cursor: 'pointer',
//       fontWeight: 700,
//     };
//   }

//   function card(): React.CSSProperties {
//     return {
//       border: '1px solid #b5b6b7',
//       borderRadius: 10,
//       padding: 10,
//       marginTop: 8,
//       background: '#ffffff',
//     };
//   }

//   function donutWrap(): React.CSSProperties {
//     return {
//       width: 120,
//       height: 120,
//       borderRadius: '50%',
//       padding: 10,
//       marginTop: 12,
//       border: '1px solid #d0d1d2',
//     };
//   }

//   function donutInner(): React.CSSProperties {
//     return {
//       width: '100%',
//       height: '100%',
//       borderRadius: '50%',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       fontWeight: 900,
//       background: '#ffffff',
//       border: '1px solid #d0d1d2',
//       color: '#111827',
//     };
//   }

//   function formGrid(): React.CSSProperties {
//     return {
//       display: 'grid',
//       gridTemplateColumns: '1fr 1fr',
//       gap: 10,
//     };
//   }
// }

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';

const CORAL = '#f15b5b';

/* =========================
   Types
========================= */

type ClientCredits = {
  total_sessions: number;
  remaining_sessions: number;
};

type Client = {
  id: string;
  full_name: string;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  qr_token: string;
  client_credits: ClientCredits;
};

type ActiveSession = null | {
  id: string;
  status: 'active';
  started_at: string;
  auto_end_at: string;
  chair_id: string | null;
};

type SessionHistoryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  ended_reason: string | null;
  status: 'active' | 'ended';
  chair_id: string | null;
};

/* =========================
   Utils
========================= */

function fmtDT(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/* =========================
   Page
========================= */

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  /* ---------- State ---------- */

  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [chairId, setChairId] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveSession>(null);
  const [history, setHistory] = useState<SessionHistoryRow[]>([]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [busySession, setBusySession] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrPrintRef = useRef<HTMLDivElement | null>(null);

  const [qrToken, setQrToken] = useState<string | null>(null);
  const qrPdfRef = useRef<HTMLDivElement>(null);

  /* ---------- Auth Fetch ---------- */

  async function authedFetch(url: string, init?: RequestInit) {
    const { data } = await supabaseBrowser.auth.getSession();
    if (!data.session) throw new Error('Not authenticated');

    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });
  }

  /* ---------- Load Data ---------- */

  async function loadAll(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;

    if (silent) setSyncing(true);
    else setInitialLoading(true);

    try {
      const cRes = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`,
      );
      if (!cRes.ok) throw new Error(await cRes.text());
      const cData: Client = await cRes.json();

      setClient(cData);
      setFullName(cData.full_name ?? '');
      setPhone(cData.phone ?? '');
      setEmail(cData.email ?? '');
      setLocation(cData.location ?? '');

      const chRes = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chairs`,
      );
      if (chRes.ok) {
        const chairs: { id: string }[] = await chRes.json();
        setChairId(chairs[0]?.id ?? null);
      }

      const aRes = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/active/${clientId}`,
      );
      if (aRes.status === 204) setActive(null);
      else {
        const txt = await aRes.text();
        const parsed = txt ? JSON.parse(txt) : null;
        setActive(parsed?.active ?? parsed ?? null);
      }

      const hRes = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/client/${clientId}/history`,
      );
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (e: any) {
      alert(e?.message ?? String(e));
    } finally {
      if (silent) setSyncing(false);
      else setInitialLoading(false);
    }
  }

  /* ---------- Effects ---------- */

  useEffect(() => {
    loadAll();
  }, [clientId]);

  useEffect(() => {
    if (!client) return;

    (async () => {
      const res = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/client/${client.id}`,
        { method: 'POST' },
      );
      if (!res.ok) return;
      const data = await res.json();
      setQrToken(data.token);
    })();
  }, [client?.id]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (!active?.auto_end_at) {
      setSecondsLeft(null);
      return;
    }

    const update = () => {
      const ms = new Date(active.auto_end_at).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };

    update();
    tickRef.current = setInterval(update, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [active?.id]);

  /* ---------- Derived ---------- */

  const credits = client?.client_credits ?? {
    total_sessions: 0,
    remaining_sessions: 0,
  };

  const usedSessions = Math.max(
    0,
    credits.total_sessions - credits.remaining_sessions,
  );

  const donutStyle = useMemo(() => {
    const pct = clamp(
      (usedSessions / Math.max(1, credits.total_sessions)) * 100,
      0,
      100,
    );
    return {
      background: `conic-gradient(  #e76565 ${pct}%,
    #e5e7eb 0)`,
    } as React.CSSProperties;
  }, [credits.total_sessions, usedSessions]);

  const webBase =
    process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';

  /* ---------- Guards ---------- */

  if (initialLoading) return <div style={{ padding: 24 }} />;
  if (!client) return <div style={{ padding: 24 }}>Client not found</div>;

  /* ---------- Session Actions (OLD LOGIC, RESTORED) ---------- */

  async function startSession() {
    if (!chairId) return;
    if (credits.remaining_sessions < 1) return;
    if (active?.id) return;

    setBusySession(true);
    try {
      const res = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, chairId }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
    } finally {
      setBusySession(false);
    }
  }

  async function endSession() {
    if (!active?.id) return;
    if (!confirm('Are you sure you want to end the session?')) return;

    setBusySession(true);
    try {
      const res = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${active.id}/stop`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(await res.text());
      await loadAll(); // → history refresh
    } finally {
      setBusySession(false);
    }
  }

  async function adjustSessions(amount: 10 | -10 | 1 | -1) {
    if (!client) return;

    const res = await authedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}/credits`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      },
    );

    if (!res.ok) throw new Error(await res.text());
    await loadAll({ silent: true });
  }

  /* =========================
     Render
  ========================= */
  // async function downloadQrPdf() {
  //   if (!qrPrintRef.current || !client || !qrToken) return;

  //   const dataUrl = await htmlToImage.toPng(qrPrintRef.current, {
  //     pixelRatio: 2,
  //     backgroundColor: '#ffffff',
  //   });

  //   const pdf = new jsPDF({
  //     orientation: 'portrait',
  //     unit: 'pt',
  //     format: 'a4',
  //   });

  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const imgProps = pdf.getImageProperties(dataUrl);
  //   const imgWidth = pageWidth - 80; // margins
  //   const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  //   const x = 40;
  //   const y = 40;

  //   pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);

  //   const safeName = (client.full_name || 'client').replace(/[^\w\-]+/g, '-');
  //   pdf.save(`${safeName}-QR.pdf`);
  // }

  const btnPrimary = (): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 12,
    border: 'none',
    background: '#e76565',
    color: '#262424',
    fontWeight: 900,
    cursor: 'pointer',
  });

  return (
    <div style={{ padding: 18, background: '#fff', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={header()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/brand/logo-full-small-ui.png"
            alt="BetterPelvi"
            style={{
              height: 36,
              width: 'auto',
              display: 'block',
            }}
          />
          <div style={{ fontWeight: 800, color: '#111827' }}>
            Clinic Dashboard
          </div>
        </div>

        <button style={btnGhost()} onClick={() => router.back()}>
          ← Back
        </button>
      </div>

      <div style={grid()}>
        {/* LEFT */}
        <div style={panel()}>
          <h2 style={{ marginBottom: 12, color: '#111827' }}>
            {client.full_name}
          </h2>

          <button style={btnPrimary()} onClick={saveClient} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>

          <div style={formGrid()}>
            <Input label="Full name" value={fullName} onChange={setFullName} />
            <Input label="Phone" value={phone} onChange={setPhone} />
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Location" value={location} onChange={setLocation} />
          </div>

          <label style={label()}>Notes</label>
          <textarea
            style={{ ...input(), height: 80 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <h3 style={{ marginTop: 18, color: '#111827' }}>History</h3>

          {history.length === 0 && (
            <div style={{ fontSize: 13, color: '#0f0f0f' }}>
              No sessions yet.
            </div>
          )}

          {history.map((h) => (
            <div key={h.id} style={card()}>
              <b
                style={{
                  color: h.status === 'ended' ? '#080808' : '#15803d',
                  fontSize: 14,
                }}
              >
                {h.status.toUpperCase()}
              </b>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 4,
                  color: '#0f0f0f',
                }}
              >
                <div>Started: {fmtDT(h.started_at)}</div>
                {h.ended_at && <div>Ended: {fmtDT(h.ended_at)}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div style={panel()}>
          <div style={{ fontWeight: 800, color: '#0f0e0e' }}>Sessions</div>

          <div style={{ marginTop: 6, fontWeight: 500, color: '#0f0e0e' }}>
            Used {usedSessions} / {credits.total_sessions}
          </div>

          <div style={{ ...donutWrap(), ...donutStyle, color: '#0f0e0e' }}>
            <div style={donutInner()}>{credits.remaining_sessions}</div>
          </div>
          {/* Adjust sessions */}
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <button style={btnGhost()} onClick={() => adjustSessions(10)}>
                +10
              </button>
              <button style={btnGhost()} onClick={() => adjustSessions(-10)}>
                -10
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <button style={btnGhost()} onClick={() => adjustSessions(1)}>
                +1
              </button>
              <button style={btnGhost()} onClick={() => adjustSessions(-1)}>
                -1
              </button>
            </div>
          </div>
          {/* 
          {qrToken && (
            <>
              <div style={{ marginTop: 25 }}>
                <QRCodeCanvas
                  value={`${webBase}/qr/${qrToken}`}
                  size={180}
                  level="H"
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  wordBreak: 'break-all',
                  marginTop: 6,
                  color: '#0f0e0e',
                }}
              >
                {`${webBase}/qr/${qrToken}`}
              </div>
            </>
          )} */}
          {qrToken && (
            <div ref={qrPdfRef}>
              <div style={{ marginTop: 25, textAlign: 'center' }}>
                <QRCodeCanvas
                  value={`${webBase}/qr/${qrToken}`}
                  size={180}
                  level="H"
                />
              </div>

              {/* <div
                style={{
                  fontSize: 12,
                  wordBreak: 'break-all',
                  marginTop: 8,
                  textAlign: 'center',
                  color: '#0f0e0e',
                  fontWeight: 600,
                }}
              >
                {client.full_name}
              </div> */}

              <div
                style={{
                  fontSize: 11,
                  wordBreak: 'break-all',
                  marginTop: 4,
                  textAlign: 'center',
                  color: '#555',
                }}
              >
                {`${webBase}/qr/${qrToken}`}
              </div>
            </div>
          )}

          {/* Active / Start */}
          <div style={{ marginTop: 16 }}>
            {active?.id ? (
              <>
                <div style={{ fontSize: 13, color: '#0c0c0c' }}>
                  Session active — auto ends at{' '}
                  <b>{fmtDT(active.auto_end_at)}</b>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginTop: 6,
                    color: '#111010',
                  }}
                >
                  {secondsLeft === null
                    ? '…'
                    : `${Math.floor(secondsLeft / 60)
                        .toString()
                        .padStart(2, '0')}:${(secondsLeft % 60)
                        .toString()
                        .padStart(2, '0')}`}
                </div>
                <button style={btnPrimary()} onClick={endSession}>
                  End (confirm)
                </button>
              </>
            ) : (
              <button
                style={btnPrimary()}
                onClick={startSession}
                disabled={credits.remaining_sessions < 1}
              >
                Start
              </button>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <button style={btnGhost()} onClick={downloadQrPdf}>
              Download QR (PDF)
            </button>

            <button style={btnGhost()} onClick={() => loadAll()}>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* =========================
     Small Components & Styles
  ========================= */

  function Input({ label, value, onChange }: any) {
    return (
      <div>
        <div style={labelStyle()}>{label}</div>
        <input
          style={input()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  // async function downloadQrPdf() {
  //   if (!qrPdfRef.current || !client || !qrToken) return;

  //   try {
  //     // Convert QR block to image
  //     const dataUrl = await htmlToImage.toPng(qrPdfRef.current, {
  //       backgroundColor: '#ffffff',
  //       pixelRatio: 2,
  //     });

  //     const pdf = new jsPDF({
  //       orientation: 'portrait',
  //       unit: 'mm',
  //       format: 'a4',
  //     });

  //     // Logo
  //     const logo = new Image();
  //     logo.src = '/brand/logo-full.png';

  //     await new Promise((res) => {
  //       logo.onload = res;
  //     });

  //     pdf.addImage(logo, 'PNG', 70, 15, 70, 30);

  //     // Title
  //     pdf.setFontSize(16);
  //     pdf.text('Client QR Code', 105, 55, { align: 'center' });

  //     // QR Image
  //     pdf.addImage(dataUrl, 'PNG', 40, 65, 130, 130);

  //     // Footer info
  //     pdf.setFontSize(11);
  //     pdf.text(client.full_name, 105, 205, { align: 'center' });
  //     pdf.text(`${webBase}/qr/${qrToken}`, 105, 213, { align: 'center' });

  //     const safeName = client.full_name.replace(/\s+/g, '-');
  //     pdf.save(`${safeName}-QR.pdf`);
  //   } catch (e) {
  //     console.error(e);
  //     alert('Failed to generate PDF');
  //   }
  // }
  //
  async function downloadQrPdf() {
    if (!qrPdfRef.current || !client || !qrToken) return;

    try {
      // 1. Convert QR block to image
      const dataUrl = await htmlToImage.toPng(qrPdfRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      // 2. Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      // 3. Load logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/brand/logo-full.png';
      await logo.decode();

      // 4. Logo (top, centered)
      const logoWidth = 117;
      const logoHeight = 74;
      pdf.addImage(
        logo,
        'PNG',
        (pageWidth - logoWidth) / 2,
        26,
        logoWidth,
        logoHeight,
      );

      // 6. QR (main focus)
      const imgProps = pdf.getImageProperties(dataUrl);
      const qrSize = 260;
      const qrY = 120;

      pdf.addImage(
        dataUrl,
        'PNG',
        (pageWidth - qrSize) / 2,
        qrY,
        qrSize,
        (imgProps.height * qrSize) / imgProps.width,
      );

      // 7. Client name (ONLY ONCE, closer to QR)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      pdf.text(client.full_name, pageWidth / 2, qrY + qrSize + 12, {
        align: 'center',
      });

      // 8. URL (directly under name, fully visible)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${webBase}/qr/${qrToken}`, pageWidth / 2, qrY + qrSize + 26, {
        align: 'center',
      });

      // 9. Save
      const safeName = client.full_name.replace(/[^\w\-]+/g, '-');
      pdf.save(`${safeName}-QR.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
  }

  async function saveClient() {
    if (!client) return;

    setSaving(true);
    try {
      const res = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            location: location.trim() || null,
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  function header(): React.CSSProperties {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20,
      alignItems: 'center',
    };
  }
  function grid(): React.CSSProperties {
    return { display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 };
  }
  function panel(): React.CSSProperties {
    return {
      border: '1px solid #68696a',
      borderTop: '3px solid #242424',
      borderRadius: 14,
      padding: 16,
      background: '#fff',
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    };
  }
  function labelStyle(): React.CSSProperties {
    return { fontSize: 12, color: '#161617', marginBottom: 6, fontWeight: 600 };
  }
  function label(): React.CSSProperties {
    return {
      fontSize: 12,
      marginTop: 10,
      color: '#171718',
      fontWeight: 600,
    };
  }
  function input(): React.CSSProperties {
    return {
      width: '100%',
      padding: '10px 12px',
      borderRadius: 10,
      border: '1 px solid #727374',
    };
  }
  function btnGhost(): React.CSSProperties {
    return {
      border: '1.5px solid ${CORAL}',
      background: '#d8d6d6',
      color: '#',
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 700,
    };
  }
  function card(): React.CSSProperties {
    return {
      border: '1px solid #29292a',
      borderTop: '1px solid #29292a',
      borderRadius: 10,
      padding: 10,
      marginTop: 8,
    };
  }
  function donutWrap(): React.CSSProperties {
    return {
      width: 120,
      height: 120,
      borderRadius: '80%',

      padding: 10,
      marginTop: 12,
    };
  }
  function donutInner(): React.CSSProperties {
    return {
      width: '100%',
      height: '100%',
      borderRadius: 999,
      background: '#b6b3b3',
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
      color: '#111827',
      fontWeight: 800,
    };
  }
  function formGrid(): React.CSSProperties {
    return { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
  }
}
