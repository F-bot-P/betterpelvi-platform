'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

/* =========================
   Types
========================= */

type Credits = {
  total_sessions: number;
  remaining_sessions: number;
};

type QrClientResponse = {
  id: string;
  clinic_id: string;
  full_name: string;
  credits?: Credits;
  client_credits?: any;
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
   Helpers
========================= */

function fmtDT(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function normalizeCredits(rel: any): Credits {
  if (!rel) return { total_sessions: 0, remaining_sessions: 0 };
  const row = Array.isArray(rel) ? rel[0] : rel;
  return {
    total_sessions: Number(row?.total_sessions ?? 0),
    remaining_sessions: Number(row?.remaining_sessions ?? 0),
  };
}

/**
 * ✅ SAFE: read body ONCE, return both text + json
 */
async function readResponse(res: Response) {
  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {}
  }
  return { text, json };
}

/* =========================
   Component
========================= */

export default function QrClientPage() {
  const params = useParams();
  const token = (params?.token as string) ?? '';

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const api = (path: string) => `${API}${path}`;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [client, setClient] = useState<{
    id: string;
    clinic_id: string;
    full_name: string;
  } | null>(null);

  const [credits, setCredits] = useState<Credits>({
    total_sessions: 0,
    remaining_sessions: 0,
  });

  const [active, setActive] = useState<ActiveSession>(null);
  const [history, setHistory] = useState<SessionHistoryRow[]>([]);
  const [busySession, setBusySession] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadAll(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;
    silent ? setSyncing(true) : setLoading(true);
    setErrMsg(null);

    try {
      if (!token) throw new Error('Missing QR token in URL');

      const res = await fetch(api(`/qr/${token}`));
      const { text, json } = await readResponse(res);

      if (!res.ok) {
        throw new Error(json?.message || json?.error || text || 'Invalid QR');
      }

      const c = json as any;

      setClient({
        id: c.id,
        clinic_id: c.clinic_id,
        full_name: c.full_name,
      });

      setCredits(normalizeCredits(c.credits ?? c.client_credits));
      setActive(c.active ?? null);
      setHistory(c.history ?? []);
    } catch (e: any) {
      setErrMsg(e?.message ?? String(e));
      setClient(null);
      setCredits({ total_sessions: 0, remaining_sessions: 0 });
      setActive(null);
      setHistory([]);
    } finally {
      silent ? setSyncing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* =========================
     Countdown
  ========================= */

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (!active?.auto_end_at) {
      setSecondsLeft(null);
      return;
    }

    const update = () => {
      const ms = new Date(active.auto_end_at).getTime() - Date.now();
      const s = Math.max(0, Math.floor(ms / 1000));
      setSecondsLeft(s);
      if (s <= 0) loadAll({ silent: true });
    };

    update();
    tickRef.current = setInterval(update, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  async function start() {
    if (credits.remaining_sessions < 1) {
      setErrMsg('No sessions remaining.');
      return;
    }

    setBusySession(true);
    setErrMsg(null);

    try {
      const res = await fetch(api(`/qr/${token}/start`), { method: 'POST' });
      const { text, json } = await readResponse(res);

      if (!res.ok) {
        throw new Error(json?.message || json?.error || text);
      }

      // Trust backend state
      setClient({
        id: json.id,
        clinic_id: json.clinic_id,
        full_name: json.full_name,
      });
      setCredits(normalizeCredits(json.credits));
      setActive(json.active ?? null);
      setHistory(json.history ?? []);
    } catch (e: any) {
      setErrMsg(e?.message ?? String(e));
    } finally {
      setBusySession(false);
    }
  }

  async function stop() {
    if (!active?.id) return;
    if (!confirm('End the session?')) return;

    setBusySession(true);
    setErrMsg(null);

    try {
      const res = await fetch(api(`/qr/${token}/stop`), { method: 'POST' });
      const { text, json } = await readResponse(res);

      if (!res.ok) {
        throw new Error(json?.message || json?.error || text);
      }

      // Backend sends full updated state
      setClient({
        id: json.id,
        clinic_id: json.clinic_id,
        full_name: json.full_name,
      });
      setCredits(normalizeCredits(json.credits));
      setActive(null);
      setHistory(json.history ?? []);
    } catch (e: any) {
      setErrMsg(e?.message ?? String(e));
    } finally {
      setBusySession(false);
    }
  }
  const used = Math.max(0, credits.total_sessions - credits.remaining_sessions);

  const donutStyle = useMemo(() => {
    const total = Math.max(1, credits.total_sessions);
    const usedPct = Math.min(100, Math.max(0, (used / total) * 100));

    return {
      background: `conic-gradient(
      #e76565 ${usedPct}%,
  #e5e7eb 0
    )`,
    } as React.CSSProperties;
  }, [credits.total_sessions, used]);
  // -------------------------
  // UI
  // -------------------------
  if (loading) {
    return <QrClientSkeleton />;
  }

  if (!client) {
    return (
      <div
        style={{
          padding: 18,
          display: 'grid',
          placeItems: 'center',
          minHeight: '70vh',
          color: '#111827',
        }}
      >
        <div style={panel()}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Invalid QR</div>
          <div style={{ marginTop: 8, color: '#111827' }}>
            {errMsg ?? 'This QR token does not match any client.'}
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              style={btnGhost()}
              onClick={() => loadAll({ silent: false })}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 18,
        maxWidth: 560,
        margin: '0 auto',
        position: 'relative', //
      }}
    >
      <div style={panel()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'baseline',
            color: '#111827',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>
            {client.full_name}
          </div>
        </div>
        {/* Logo is a sibling, not inside flex */}
        <img
          className="bp-logo"
          src="/brand/logo-full.png"
          alt="BetterPelvi"
          style={{
            position: 'absolute',
            top: 14,
            right: 34,
            height: 88,
            opacity: 1,
            zIndex: 10,
            pointerEvents: 'none',
            border: 'none ', // R
          }}
        />

        {errMsg && (
          <div
            style={{
              marginTop: 10,
              color: '#fecaca',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
            }}
          >
            {errMsg}
          </div>
        )}

        {/* Credits */}
        <div style={{ marginTop: 14, color: '#111827' }}>
          <div style={{ fontWeight: 900 }}>Sessions</div>
          <div style={{ marginTop: 6, color: '#111827' }}>
            Used <b>{used}</b> / <b>{credits.total_sessions}</b>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            Remaining: {credits.remaining_sessions}
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#111827',
            }}
          >
            <div style={{ ...donutWrap(), ...donutStyle }}>
              <div style={donutInner()}>
                <div style={{ fontSize: 12, color: '#111827' }}>Remaining</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {credits.remaining_sessions}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {active?.id ? (
                <>
                  <div style={{ color: '#111827', fontSize: 13 }}>
                    Session active — auto ends at{' '}
                    <b>{fmtDT(active.auto_end_at)}</b>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 22,
                      fontWeight: 900,
                      color: '#111827',
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

                  <button
                    style={btnDanger()}
                    onClick={stop}
                    disabled={busySession}
                  >
                    {busySession ? 'Ending…' : 'End (confirm)'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={btnPrimary()}
                    onClick={start}
                    disabled={busySession || credits.remaining_sessions < 1}
                  >
                    {busySession
                      ? 'Starting…'
                      : credits.remaining_sessions < 1
                        ? 'No sessions left'
                        : 'Start'}
                  </button>

                  {credits.remaining_sessions < 1 && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#111827',
                      }}
                    >
                      Please ask the clinic to add sessions.
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: 10 }}>
                <button
                  style={btnGhost()}
                  onClick={() => loadAll({ silent: false })}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900, color: '#111827' }}>History</div>

          {history.length === 0 ? (
            <div style={{ marginTop: 10, color: '#111827' }}>
              No sessions yet.
            </div>
          ) : (
            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gap: 10,
                color: '#111827',
              }}
            >
              {history.map((h) => {
                const title =
                  h.status === 'active' ? 'SESSION_ACTIVE' : 'SESSION_END';
                const subtitle =
                  h.status === 'active'
                    ? `Started:${fmtDT(h.started_at)}`
                    : `Ended: ${fmtDT(h.ended_at)} (${h.ended_reason ?? 'ended'})`;

                return (
                  <div key={h.id} style={card()}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        color: '#111827',
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{title}</div>
                      <div style={{ fontSize: 12, color: '#111827' }}>
                        {fmtDT(h.started_at)}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        color: '#111827',
                        fontSize: 13,
                      }}
                    >
                      {subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function QrClientSkeleton() {
  return (
    <div
      style={{
        padding: 18,
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <div style={panel()}>
        {/* Header row (client name placeholder) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          <div style={{ ...skLine(120, 20) }} />
        </div>

        {/* Logo placeholder exactly where your logo is */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 34,
            height: 88,
            width: 190,
            borderRadius: 12,
            background: '#e5e7eb',
            animation: 'bpPulse 1.1s ease-in-out infinite',
          }}
        />

        {/* Credits */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...skLine(70, 14) }} /> {/* Sessions */}
          <div style={{ marginTop: 8, ...skLine(160, 14) }} /> {/* Used x/y */}
          <div style={{ marginTop: 10, ...skLine(220, 30) }} />{' '}
          {/* Remaining: */}
        </div>

        {/* Donut + right column */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Donut skeleton (ring + inner) */}
          <div style={skDonutWrap()}>
            <div style={skDonutRing()}>
              <div style={skDonutInner()}>
                <div style={{ ...skLine(70, 12) }} />
                <div style={{ marginTop: 8, ...skLine(40, 18) }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {/* Session active text placeholder */}
            <div style={{ ...skLine('100%', 14) }} />
            <div style={{ marginTop: 8, ...skLine(120, 26) }} /> {/* timer */}
            {/* Primary action button placeholder */}
            <div style={{ marginTop: 12, ...skBtn() }} />
            {/* Refresh button placeholder */}
            <div style={{ marginTop: 10, ...skBtn() }} />
          </div>
        </div>

        {/* History */}
        <div style={{ marginTop: 18 }}>
          <div style={{ ...skLine(70, 16) }} /> {/* History title */}
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div style={skHistoryCard()} />
            <div style={skHistoryCard()} />
          </div>
        </div>

        {/* Pulse animation */}
        <style jsx global>{`
          @keyframes bpPulse {
            0% {
              opacity: 0.55;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.55;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ===== Skeleton helpers ===== */

function skBase(): React.CSSProperties {
  return {
    background: '#e5e7eb',
    borderRadius: 10,
    animation: 'bpPulse 1.1s ease-in-out infinite',
  };
}

function skLine(width: number | string, height: number): React.CSSProperties {
  return {
    ...skBase(),
    width,
    height,
  };
}

function skBtn(): React.CSSProperties {
  return {
    ...skBase(),
    height: 44,
    borderRadius: 10,
  };
}

function skDonutWrap(): React.CSSProperties {
  return {
    width: 120,
    height: 120,
    borderRadius: 999,
    padding: 10,
  };
}

function skDonutRing(): React.CSSProperties {
  // Looks like a faint ring, similar to your conic-gradient donut
  return {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    background: `conic-gradient(
      #e5e7eb 0deg,
      #d1d5db 140deg,
      #e5e7eb 280deg,
      #d1d5db 360deg
    )`,
    animation: 'bpPulse 1.1s ease-in-out infinite',
    padding: 10,
    boxSizing: 'border-box',
  };
}

function skDonutInner(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    background: 'rgba(157, 155, 155, 0.25)',
    border: '1px solid rgba(154, 153, 153, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2,
    boxSizing: 'border-box',
    animation: 'bpPulse 1.1s ease-in-out infinite',
  };
}

function skHistoryCard(): React.CSSProperties {
  return {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    borderRadius: 12,
    padding: 12,
  };
}
/* styles */
function panel(): React.CSSProperties {
  return {
    position: 'relative',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderTop: '4px solid #e76565',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
    // outline: '2px solid red',
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#a0a1a3',
    color: '#000000',
    cursor: 'pointer',
    fontWeight: 800,
    width: '100%',
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#dd5f65',
    color: '#0b0b0f',
    fontWeight: 900,
    cursor: 'pointer',
    width: '100%',
  };
}

function btnDanger(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#ef4444',
    color: '#0b0b0f',
    fontWeight: 900,
    cursor: 'pointer',
    width: '100%',
    marginTop: 10,
  };
}

function card(): React.CSSProperties {
  return {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    borderRadius: 12,
    padding: 12,
  };
}

function donutWrap(): React.CSSProperties {
  return {
    width: 120,
    height: 120,
    borderRadius: 999,
    padding: 10,
  };
}

function donutInner(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    background: 'rgba(157, 155, 155, 0.55)',
    border: '1px solid rgba(154, 153, 153, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2,
  };
}
