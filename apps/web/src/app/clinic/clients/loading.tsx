export default function LoadingClients() {
  return (
    <div
      style={{
        minHeight: '100svh',
        padding: 18,
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ fontWeight: 900, color: '#111827', marginBottom: 12 }}>
          Clients
        </div>
        <div style={panel()}>
          <div style={line(260)} />
          <div style={{ height: 12 }} />
          <div style={line(200)} />
          <div style={{ height: 16 }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '12px 0',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={line(160)} />
              <div style={{ height: 8 }} />
              <div style={line(90)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function panel(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  };
}

function line(w: number): React.CSSProperties {
  return {
    width: w,
    height: 14,
    borderRadius: 10,
    background: 'rgba(17,24,39,0.08)',
  };
}
