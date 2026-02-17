'use client';

import { useEffect, useState } from 'react';
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

  if (loading) return <p>Loading clients…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (clients.length === 0) return <p>No clients found</p>;

  return (
    <div>
      <h1>Clients</h1>

      <ul>
        {clients.map((c) => (
          <li key={c.id} style={{ marginBottom: 12 }}>
            <strong>{c.full_name}</strong>
            <br />
            Email: {c.email}
            <br />
            Phone: {c.phone}
            <br />
            Remaining sessions: {c.client_credits?.[0]?.remaining_sessions ?? 0}
            <br />
            QR: {c.qr_token}
          </li>
        ))}
      </ul>
    </div>
  );
}
