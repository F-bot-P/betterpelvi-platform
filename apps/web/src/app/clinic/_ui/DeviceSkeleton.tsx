export default function DeviceSkeleton() {
  return (
    <div
      style={{
        minHeight: '100svh',
        padding: 18,
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
        display: 'grid',
        placeItems: 'start center',
      }}
    >
      <div style={{ width: 'min(980px, 92vw)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <div className="bp-skel" style={{ width: 180, height: 22 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              className="bp-skel"
              style={{ width: 120, height: 38, borderRadius: 12 }}
            />
            <div
              className="bp-skel"
              style={{ width: 110, height: 38, borderRadius: 12 }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
            padding: 16,
          }}
        >
          <div
            className="bp-skel"
            style={{ width: 220, height: 16, marginBottom: 10 }}
          />
          <div
            className="bp-skel"
            style={{
              width: '100%',
              height: 44,
              marginBottom: 12,
              borderRadius: 12,
            }}
          />

          <div
            className="bp-skel"
            style={{ width: 180, height: 14, marginBottom: 10 }}
          />
          <div
            className="bp-skel"
            style={{ width: '100%', height: 180, borderRadius: 16 }}
          />

          <div style={{ height: 12 }} />
          <div
            className="bp-skel"
            style={{ width: 240, height: 12, opacity: 0.85 }}
          />
          <div style={{ height: 6 }} />
          <div
            className="bp-skel"
            style={{ width: 200, height: 12, opacity: 0.85 }}
          />

          <div style={{ height: 14 }} />
          <div
            className="bp-skel"
            style={{ width: '100%', height: 44, borderRadius: 12 }}
          />
        </div>
      </div>
    </div>
  );
}
