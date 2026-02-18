// export default function ClinicLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div
//       style={{
//         minHeight: '100vh',
//         background: `
//           radial-gradient(
//             1200px 600px at 90% 10%,
//             rgba(231, 101, 101, 0.12),
//             transparent 60%
//           ),
//           #f8f8fa
//         `,
//       }}
//     >
//       <div
//         style={{
//           maxWidth: 1100,
//           margin: '0 auto',
//           padding: 16,
//         }}
//       >
//         {children}
//       </div>
//     </div>
//   );
// }
'use client';

import { usePathname } from 'next/navigation';

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Auth pages should be full-bleed (no maxWidth box)
  const isAuth =
    pathname?.startsWith('/clinic/login') ||
    pathname?.startsWith('/clinic/signup') ||
    pathname?.startsWith('/clinic/forgot-password') ||
    pathname?.startsWith('/clinic/reset-password');

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(1200px 600px at 90% 10%, rgba(231, 101, 101, 0.12), transparent 60%), #f8f8fa` }}>
      <style jsx global>{`
        /* Prevent iOS "black" background when keyboard opens/closes */
        html,
        body {
          margin: 0;
          padding: 0;
          background: #f8f8fa;
          min-height: 100%;
        }

        /* Avoid iOS rubber-band showing black */
        body {
          overscroll-behavior-y: none;
        }

        /* Spinner animation used by auth pages */
        @keyframes bp-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* iOS typing lag: blur/backdrop-filter can cause jank */
        @media (max-width: 640px) {
          .bp-card {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
        }
      `}</style>

      {isAuth ? (
        // full width for auth screens (prevents the "boxed" look)
        <div style={{ minHeight: '100vh' }}>{children}</div>
      ) : (
        // keep existing dashboard container
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 16,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
