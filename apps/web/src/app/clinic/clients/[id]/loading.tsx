// export default function LoadingClientDetail() {
//   return (
//     <div
//       style={{
//         minHeight: '100svh',
//         padding: 18,
//         background:
//           'radial-gradient(900px 400px at 50% 0%, rgba(231, 101, 101, 0.18), transparent 60%), #f8f8fa',
//       }}
//     >
//       <div
//         style={{
//           maxWidth: 980,
//           margin: '0 auto',
//           display: 'grid',
//           gap: 16,
//         }}
//       >
//         <div
//           style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
//         >
//           <div style={{ fontWeight: 900, color: '#111827' }}>
//             Clinic Dashboard
//           </div>
//           <div style={{ display: 'flex', gap: 10 }}>
//             <div style={pill()}>Loading…</div>
//           </div>
//         </div>

//         {/* Skeleton panels */}
//         <div style={panel()}>
//           <div style={skeletonLine(180)} />
//           <div style={{ height: 12 }} />
//           <div style={skeletonLine(120)} />
//           <div style={{ height: 18 }} />
//           <div style={skeletonBlock()} />
//         </div>

//         <div style={panel()}>
//           <div style={skeletonLine(140)} />
//           <div style={{ height: 14 }} />
//           <div style={skeletonBlock()} />
//           <div style={{ height: 14 }} />
//           <div style={skeletonLine(220)} />
//         </div>
//       </div>
//     </div>
//   );
// }

// function panel(): React.CSSProperties {
//   return {
//     background: '#fff',
//     border: '1px solid rgba(0,0,0,0.10)',
//     borderRadius: 14,
//     padding: 16,
//     boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
//   };
// }

// function pill(): React.CSSProperties {
//   return {
//     padding: '6px 10px',
//     borderRadius: 999,
//     background: 'rgba(255,255,255,0.85)',
//     border: '1px solid rgba(0,0,0,0.10)',
//     fontWeight: 800,
//     fontSize: 12,
//   };
// }

// function skeletonLine(w: number): React.CSSProperties {
//   return {
//     width: w,
//     height: 14,
//     borderRadius: 10,
//     background: 'rgba(17,24,39,0.08)',
//   };
// }

// function skeletonBlock(): React.CSSProperties {
//   return {
//     width: '100%',
//     height: 180,
//     borderRadius: 12,
//     background: 'rgba(17,24,39,0.06)',
//   };
// }
import ClientDetailSkeleton from '../../_ui/ClientDetailSkeleton';

export default function Loading() {
  return <ClientDetailSkeleton />;
}
