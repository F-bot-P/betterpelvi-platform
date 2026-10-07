import Link from 'next/link';

export default function ClinicAccessPage() {
  return (
    <main className="bp-auth-layout">
      <div className="bp-auth-orbit bp-auth-orbit-one" />
      <div className="bp-auth-orbit bp-auth-orbit-two" />
      <section className="bp-auth-card" aria-labelledby="clinic-access-title">
        <Link href="/" className="bp-brand-link" aria-label="BetterPelvi home">
          <img src="/brand/logo-full-dashboard.png" alt="BetterPelvi" />
        </Link>
        <p className="bp-eyebrow">Clinic onboarding</p>
        <h1 id="clinic-access-title">Access is set up for you.</h1>
        <p className="bp-auth-copy">
          BetterPelvi creates each clinic account together with its first administrator and chair setup. This keeps clinic access controlled from day one.
        </p>
        <div className="bp-access-steps">
          <div><span>1</span><p>Your BetterPelvi contact creates the clinic account.</p></div>
          <div><span>2</span><p>The clinic administrator receives their login credentials.</p></div>
          <div><span>3</span><p>Sign in, add clients, and pair the chair when ready.</p></div>
        </div>
        <Link className="bp-button bp-button-primary" href="/clinic/login">Go to clinic login</Link>
      </section>
    </main>
  );
}