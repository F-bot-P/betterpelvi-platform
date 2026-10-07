'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Clinic = {
  id: string;
  name: string;
  created_at: string;
  chairCount: number;
  clientCount: number;
  activeSessionCount: number;
};

type Overview = {
  clinics: Clinic[];
  totals: {
    clinics: number;
    chairs: number;
    clients: number;
    activeSessions: number;
  };
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export default function PlatformDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const withAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace('/admin/login');
      throw new Error('Sign in is required.');
    }
    return token;
  }, [router]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await withAccessToken();
      const response = await fetch(`${apiBase}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'This account is not authorised for the platform dashboard.',
        );
      }
      setOverview(payload);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load platform data.');
    } finally {
      setLoading(false);
    }
  }, [withAccessToken]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? '');
      await loadOverview();
    })();
  }, [loadOverview]);

  async function createClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setError(null);
    setStatus(null);

    try {
      const token = await withAccessToken();
      const response = await fetch(`${apiBase}/admin/clinics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clinic_name: clinicName,
          email: adminEmail,
          password: temporaryPassword,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to create clinic.');
      }

      setStatus(`${payload.clinic.name} is ready. The clinic administrator can sign in now.`);
      setClinicName('');
      setAdminEmail('');
      setTemporaryPassword('');
      await loadOverview();
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'Unable to create clinic.');
    } finally {
      setCreating(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  const totals = overview?.totals;

  return (
    <main className="bp-admin-page">
      <header className="bp-admin-header">
        <Link href="/" className="bp-brand-link" aria-label="BetterPelvi home">
          <img src="/brand/logo-full-dashboard.png" alt="BetterPelvi" />
        </Link>
        <div className="bp-admin-header-actions">
          <span className="bp-signed-in">Signed in as {email || 'platform operator'}</span>
          <Link className="bp-button bp-button-secondary" href="/clinic/login">
            Clinic login
          </Link>
          <button className="bp-text-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="bp-admin-intro">
        <div>
          <p className="bp-eyebrow">BetterPelvi control room</p>
          <h1>One place for every clinic.</h1>
          <p>
            Create clinic access, see current activity, and keep the operational
            layer separate from chair control.
          </p>
        </div>
        <button className="bp-button bp-button-secondary" onClick={() => void loadOverview()}>
          Refresh data
        </button>
      </section>

      {error && <div className="bp-notice bp-notice-error">{error}</div>}
      {status && <div className="bp-notice bp-notice-success">{status}</div>}

      <section className="bp-stat-grid" aria-label="Platform overview">
        <article className="bp-stat-card"><span>Clinics</span><strong>{loading ? '-' : totals?.clinics ?? 0}</strong></article>
        <article className="bp-stat-card"><span>Chairs</span><strong>{loading ? '-' : totals?.chairs ?? 0}</strong></article>
        <article className="bp-stat-card"><span>Clients</span><strong>{loading ? '-' : totals?.clients ?? 0}</strong></article>
        <article className="bp-stat-card bp-stat-card-accent"><span>Live sessions</span><strong>{loading ? '-' : totals?.activeSessions ?? 0}</strong></article>
      </section>

      <section className="bp-admin-grid">
        <section className="bp-panel bp-provision-panel" aria-labelledby="create-clinic-title">
          <p className="bp-eyebrow">New account</p>
          <h2 id="create-clinic-title">Create a clinic</h2>
          <p className="bp-panel-copy">
            This creates the clinic, its first administrator, and a ready-to-pair Chair 1.
          </p>
          <form className="bp-form" onSubmit={createClinic}>
            <label>
              Clinic name
              <input value={clinicName} onChange={(event) => setClinicName(event.target.value)} required disabled={creating} />
            </label>
            <label>
              Clinic administrator email
              <input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required disabled={creating} />
            </label>
            <label>
              Temporary password
              <input type="password" minLength={8} value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} required disabled={creating} />
            </label>
            <button className="bp-button bp-button-primary" disabled={creating}>
              {creating ? 'Creating clinic...' : 'Create clinic access'}
            </button>
          </form>
        </section>

        <section className="bp-panel bp-clinic-list" aria-labelledby="clinic-list-title">
          <div className="bp-panel-heading">
            <div>
              <p className="bp-eyebrow">Network</p>
              <h2 id="clinic-list-title">Clinic overview</h2>
            </div>
            <span>{overview?.clinics.length ?? 0} total</span>
          </div>
          {loading ? (
            <p className="bp-empty-state">Loading clinics...</p>
          ) : overview?.clinics.length ? (
            <div className="bp-clinic-table-wrap">
              <table className="bp-clinic-table">
                <thead><tr><th>Clinic</th><th>Chairs</th><th>Clients</th><th>Active</th></tr></thead>
                <tbody>
                  {overview.clinics.map((clinic) => (
                    <tr key={clinic.id}>
                      <td><strong>{clinic.name}</strong><small>Joined {new Date(clinic.created_at).toLocaleDateString()}</small></td>
                      <td>{clinic.chairCount}</td><td>{clinic.clientCount}</td>
                      <td><span className={clinic.activeSessionCount ? 'bp-live-count' : ''}>{clinic.activeSessionCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="bp-empty-state">No clinics yet. Create the first one here.</p>
          )}
        </section>
      </section>
    </main>
  );
}
