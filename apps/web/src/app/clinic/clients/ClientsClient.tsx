'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Client = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  qr_token: string;
  client_credits?: { remaining_sessions: number }[];
};

export default function ClientsClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients() {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const data = await res.json();
        setClients(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  if (loading || error || clients.length === 0) {
    return (
      <div className="bp-clients-page" style={page()}>
        <style jsx global>
          {globalCss()}
        </style>

        <div style={card()}>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
            Clients
          </div>

          {loading && <div style={muted()}>Loading clients…</div>}

          {!loading && error && (
            <div style={{ ...muted(), color: '#ef4444', fontWeight: 700 }}>
              {error}
            </div>
          )}

          {!loading && !error && clients.length === 0 && (
            <div style={muted()}>No clients found</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bp-clients-page" style={page()}>
      <style jsx global>
        {globalCss()}
      </style>

      <div style={container()}>
        <div className="bp-clients-header" style={header()}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Clients</h1>
          <div style={pill()}>{clients.length} total</div>
        </div>

        <div className="bp-clients-list" style={list()}>
          {clients.map((c) => (
            <div key={c.id} className="bp-clients-item" style={item()}>
              <div style={row()}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {/* ✅ FIX: make name tappable */}
                  <Link
                    href={`/clinic/clients/${c.id}`}
                    className="bp-client-name-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'inline-block',
                      padding: '2px 0',
                    }}
                  >
                    {c.full_name}
                  </Link>
                </div>

                <div style={badge()}>
                  {c.client_credits?.[0]?.remaining_sessions ?? 0} left
                </div>
              </div>

              <div style={meta()}>
                <div style={metaRow()}>
                  <span style={label()}>Email</span>
                  <span style={value()}>{c.email || '—'}</span>
                </div>

                <div style={metaRow()}>
                  <span style={label()}>Phone</span>
                  <span style={value()}>{c.phone || '—'}</span>
                </div>

                <div style={metaRow()}>
                  <span style={label()}>Location</span>
                  <span style={value()}>{c.location || '—'}</span>
                </div>

                <div style={metaRow()}>
                  <span style={label()}>QR</span>
                  <span style={{ ...value(), wordBreak: 'break-all' }}>
                    {c.qr_token || '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function globalCss() {
  return `
    html, body {
      margin: 0;
      padding: 0;
      background: #f8f8fa;
      min-height: 100%;
    }

    /* Prevent iOS rubber-band black */
    body { overscroll-behavior-y: none; }

    /* ✅ Make the name LOOK tappable on mobile */
    .bp-client-name-link {
      cursor: pointer;
    }
    .bp-client-name-link:active {
      opacity: 0.7;
    }
    .bp-client-name-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .bp-clients-header {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
      }
    }
  `;
}

function page(): React.CSSProperties {
  return {
    minHeight: '100svh',
    background:
      'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
    padding:
      'max(12px, env(safe-area-inset-top)) 14px max(12px, env(safe-area-inset-bottom))',
  };
}

function container(): React.CSSProperties {
  return {
    maxWidth: 980,
    margin: '0 auto',
  };
}

function header(): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  };
}

function pill(): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(0,0,0,0.10)',
    fontWeight: 800,
    fontSize: 12,
  };
}

function list(): React.CSSProperties {
  return {
    display: 'grid',
    gap: 12,
  };
}

function item(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  };
}

function row(): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  };
}

function badge(): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1.5px solid #f15b5b',
    background: 'rgba(241, 91, 91, 0.10)',
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: 'nowrap',
  };
}

function meta(): React.CSSProperties {
  return {
    display: 'grid',
    gap: 6,
    fontSize: 13,
  };
}

function metaRow(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '92px 1fr',
    gap: 10,
    alignItems: 'start',
  };
}

function label(): React.CSSProperties {
  return {
    color: '#6b7280',
    fontWeight: 800,
  };
}

function value(): React.CSSProperties {
  return {
    color: '#111827',
    fontWeight: 600,
  };
}

function card(): React.CSSProperties {
  return {
    maxWidth: 520,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
  };
}

function muted(): React.CSSProperties {
  return { color: '#374151', fontWeight: 700, fontSize: 14 };
}
