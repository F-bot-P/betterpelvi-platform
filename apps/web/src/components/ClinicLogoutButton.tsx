'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function ClinicLogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();

    // IMPORTANT: replace, not push
    router.replace('/clinic/login');
  }

  return (
    <button
      onClick={logout}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'white',
        cursor: 'pointer',
      }}
    >
      Log out
    </button>
  );
}
