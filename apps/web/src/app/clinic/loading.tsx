// export default function Loading() {
//   return (
//     <div
//       style={{
//         minHeight: '100svh',
//         display: 'grid',
//         placeItems: 'center',
//         background:
//           'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
//       }}
//     >
//       <div
//         style={{
//           padding: '10px 14px',
//           borderRadius: 999,
//           background: 'rgba(255,255,255,0.85)',
//           border: '1px solid rgba(0,0,0,0.08)',
//           boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
//           fontWeight: 800,
//         }}
//       >
//         Loading…
//       </div>
//     </div>
//   );
// }
export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100svh',
        padding:
          'max(12px, env(safe-area-inset-top)) 14px max(12px, env(safe-area-inset-bottom))',
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: 'min(520px, 92vw)',
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 16,
          padding: 18,
          boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            aria-label="Loading"
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              border: '3px solid rgba(0,0,0,0.15)',
              borderTopColor: '#f15b5b',
              animation: 'bp-spin 0.9s linear infinite',
            }}
          />
          <div style={{ fontWeight: 900, color: '#111827' }}>Loading…</div>
        </div>

        <style>{`
          @keyframes bp-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
