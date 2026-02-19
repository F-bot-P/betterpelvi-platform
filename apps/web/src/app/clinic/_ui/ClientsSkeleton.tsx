// export default function ClientsSkeleton() {
//   return (
//     <div
//       style={{
//         minHeight: '100svh',
//         padding: 18,
//         background:
//           'radial-gradient(900px 400px at 50% 0%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
//       }}
//     >
//       <style>{`
//         @keyframes bp-shimmer {
//           0% { background-position: -600px 0; }
//           100% { background-position: 600px 0; }
//         }
//         .bp-skel {
//           background: linear-gradient(
//             90deg,
//             rgba(0,0,0,0.06) 0%,
//             rgba(0,0,0,0.10) 35%,
//             rgba(0,0,0,0.06) 70%
//           );
//           background-size: 600px 100%;
//           animation: bp-shimmer 1.1s linear infinite;
//           border-radius: 999px;
//         }
//       `}</style>

//       <div style={{ maxWidth: 980, margin: '0 auto' }}>
//         {/* Topbar */}
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             gap: 12,
//             flexWrap: 'wrap',
//             marginBottom: 16,
//           }}
//         >
//           <div style={{ fontWeight: 900, fontSize: 20, color: '#111827' }}>
//             Clinic Dashboard
//           </div>

//           <div style={{ display: 'flex', gap: 10 }}>
//             <div className="bp-skel" style={{ width: 120, height: 38 }} />
//             <div className="bp-skel" style={{ width: 110, height: 38 }} />
//           </div>
//         </div>

//         {/* Main Card */}
//         <div style={card()}>
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               gap: 10,
//               flexWrap: 'wrap',
//               marginBottom: 12,
//             }}
//           >
//             <div className="bp-skel" style={{ width: 160, height: 18 }} />
//             <div className="bp-skel" style={{ width: 140, height: 38 }} />
//           </div>

//           <div
//             className="bp-skel"
//             style={{ width: '100%', height: 46, marginBottom: 12 }}
//           />

//           {Array.from({ length: 7 }).map((_, i) => (
//             <div
//               key={i}
//               style={{
//                 padding: '14px 12px',
//                 borderTop: i === 0 ? '1px solid #e5e7eb' : '1px solid #eef2f7',
//               }}
//             >
//               <div
//                 className="bp-skel"
//                 style={{ width: i % 2 === 0 ? 180 : 140, height: 16 }}
//               />
//               <div style={{ height: 8 }} />
//               <div
//                 className="bp-skel"
//                 style={{ width: 120, height: 12, opacity: 0.85 }}
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function card(): React.CSSProperties {
//   return {
//     background: 'rgba(255,255,255,0.92)',
//     border: '1px solid rgba(0,0,0,0.10)',
//     borderRadius: 16,
//     boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
//     padding: 16,
//   };
// }
export default function ClientsSkeleton() {
  return (
    <div
      style={{
        minHeight: '100svh',
        padding: 18,
        background:
          'radial-gradient(900px 400px at 50% 0%, rgba(231,101,101,0.12), transparent 60%), #f8f8fa',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Topbar */}
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
          <div style={{ fontWeight: 900, fontSize: 20, color: '#111827' }}>
            Clinic Dashboard
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...skelBase(), width: 120, height: 38 }} />
            <div style={{ ...skelBase(), width: 110, height: 38 }} />
          </div>
        </div>

        {/* Main Card */}
        <div style={card()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <div style={{ ...skelBase(), width: 160, height: 18 }} />
            <div style={{ ...skelBase(), width: 140, height: 38 }} />
          </div>

          <div
            style={{
              ...skelBase(),
              width: '100%',
              height: 46,
              marginBottom: 12,
              borderRadius: 12,
            }}
          />

          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 12px',
                borderTop: i === 0 ? '1px solid #e5e7eb' : '1px solid #eef2f7',
              }}
            >
              <div
                style={{
                  ...skelBase(),
                  width: i % 2 === 0 ? 180 : 140,
                  height: 16,
                  borderRadius: 10,
                }}
              />
              <div style={{ height: 8 }} />
              <div
                style={{
                  ...skelBase(),
                  width: 120,
                  height: 12,
                  opacity: 0.85,
                  borderRadius: 10,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
    padding: 16,
  };
}

function skelBase(): React.CSSProperties {
  return {
    background:
      'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
    backgroundSize: '240% 100%',
    animation: 'bp-shimmer 1.2s ease-in-out infinite',
    borderRadius: 999,
  };
}
