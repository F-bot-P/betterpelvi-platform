export default function ClientDetailSkeleton() {
  return (
    <div
      className="bp-client-skel-page"
      style={{
        minHeight: '100svh',
        padding:
          'max(12px, env(safe-area-inset-top)) 14px max(12px, env(safe-area-inset-bottom))',
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.14), transparent 60%), #f8f8fa',
      }}
    >
      <div
        style={{ maxWidth: 980, margin: '0 auto', textAlign: 'left' as const }}
      >
        {/* Header */}
        <div
          className="bp-client-skel-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 18,
            width: '100%',
            textAlign: 'left',
            alignSelf: 'stretch',
          }}
        >
          {
            /* <div
            style={{
              fontWeight: 900,
              fontSize: 26,
              color: '#111827',
              lineHeight: 1,
            }}
          >
            Clinic Dashboard
          </div> */
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-block', // prevents any inherited centering tricks
                  textAlign: 'left',
                  fontWeight: 900,
                  fontSize: 20,
                  color: '#111827',
                }}
              >
                Clinic Dashboard
              </div>
            </div>
          }
          <div
            className="bp-client-skel-actions"
            style={{ display: 'flex', gap: 10 }}
          >
            <div
              style={{ height: 36, width: 120, borderRadius: 12, ...shimmer() }}
            />
            <div
              style={{ height: 36, width: 90, borderRadius: 12, ...shimmer() }}
            />
          </div>
        </div>

        {/* Grid */}
        <div
          className="bp-client-skel-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: 16,
          }}
        >
          {/* Left card */}
          <div style={card()}>
            <div
              style={{ height: 26, width: 220, borderRadius: 12, ...shimmer() }}
            />
            <div
              style={{
                height: 42,
                marginTop: 14,
                borderRadius: 12,
                ...shimmer(),
              }}
            />

            <div
              className="bp-client-skel-formgrid"
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div
                    style={{
                      height: 12,
                      width: 90,
                      borderRadius: 8,
                      ...shimmer(),
                    }}
                  />
                  <div
                    style={{
                      height: 38,
                      marginTop: 6,
                      borderRadius: 12,
                      ...shimmer(),
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <div
                style={{ height: 12, width: 70, borderRadius: 8, ...shimmer() }}
              />
              <div
                style={{
                  height: 90,
                  marginTop: 6,
                  borderRadius: 12,
                  ...shimmer(),
                }}
              />
            </div>

            <div
              style={{
                marginTop: 18,
                height: 14,
                width: 120,
                borderRadius: 10,
                ...shimmer(),
              }}
            />

            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: 64, borderRadius: 12, ...shimmer() }}
                />
              ))}
            </div>
          </div>

          {/* Right card */}
          <div style={card()}>
            <div
              style={{ height: 16, width: 120, borderRadius: 10, ...shimmer() }}
            />
            <div
              style={{
                height: 14,
                width: 160,
                marginTop: 10,
                borderRadius: 10,
                ...shimmer(),
              }}
            />

            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                marginTop: 14,
                ...shimmer(),
              }}
            />

            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              <div style={{ height: 36, borderRadius: 12, ...shimmer() }} />
              <div style={{ height: 36, borderRadius: 12, ...shimmer() }} />
              <div style={{ height: 36, borderRadius: 12, ...shimmer() }} />
              <div style={{ height: 36, borderRadius: 12, ...shimmer() }} />
            </div>

            <div
              style={{
                height: 220,
                borderRadius: 14,
                marginTop: 18,
                ...shimmer(),
              }}
            />
            <div
              style={{
                height: 42,
                borderRadius: 12,
                marginTop: 16,
                ...shimmer(),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };
}

function shimmer(): React.CSSProperties {
  return {
    background:
      'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
    backgroundSize: '240% 100%',
    animation: 'bp-shimmer 1.2s ease-in-out infinite',
  };
}
