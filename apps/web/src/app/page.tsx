// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bp-home">
      <div className="bp-home-halo bp-home-halo-one" />
      <div className="bp-home-halo bp-home-halo-two" />
      <header className="bp-home-header">
        <img src="/brand/logo-full-dashboard.png" alt="BetterPelvi" />
        <nav aria-label="Primary navigation">
          <a href="https://www.onit.al" target="_blank" rel="noreferrer">Website</a>
          <Link href="/clinic/login">Clinic login</Link>
          <Link className="bp-button bp-button-primary bp-home-admin-link" href="/admin/login">Platform login</Link>
        </nav>
      </header>

      <section className="bp-home-hero">
        <div className="bp-home-copy">
          <p className="bp-eyebrow">BetterPelvi operations</p>
          <h1>Care delivery, kept in motion.</h1>
          <p>
            A focused operations layer for clinic teams, chair sessions, and a growing BetterPelvi network.
          </p>
          <div className="bp-home-actions">
            <Link className="bp-button bp-button-primary" href="/clinic/login">Enter clinic portal</Link>
            <Link className="bp-button bp-button-secondary" href="/admin/login">Manage clinics</Link>
          </div>
        </div>
        <div className="bp-home-signal" aria-label="Operational status illustration">
          <span className="bp-signal-orbit bp-signal-orbit-one" />
          <span className="bp-signal-orbit bp-signal-orbit-two" />
          <div className="bp-signal-core"><span>BP</span><small>CONNECTED CARE</small></div>
          <div className="bp-signal-tag bp-signal-tag-one">CLINIC READY</div>
          <div className="bp-signal-tag bp-signal-tag-two">SESSION SAFE</div>
        </div>
      </section>

      <section className="bp-home-principles" aria-label="BetterPelvi portal features">
        <article><span>01</span><h2>Clinic teams</h2><p>Secure access for clinic administrators and staff.</p></article>
        <article><span>02</span><h2>Controlled onboarding</h2><p>Platform operators create each clinic account with the right starting setup.</p></article>
        <article><span>03</span><h2>Session safety</h2><p>Chair-session and QR workflows remain separated from platform administration.</p></article>
      </section>
    </main>
  );
}

