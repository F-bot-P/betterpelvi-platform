export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
          fontWeight: 800,
        }}
      >
        Loading…
      </div>
    </div>
  );
}
