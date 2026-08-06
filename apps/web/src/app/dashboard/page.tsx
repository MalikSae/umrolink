'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './layout';
import { PageContainer } from './_components/PageContainer';

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'travel_admin') {
      router.replace('/dashboard/packages');
    }
  }, [user, router]);

  if (!user) return null;

  if (user.role === 'travel_admin') {
    return <p className="text-[var(--color-text-muted)]">Mengarahkan ke halaman paket...</p>;
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Selamat datang, {user.name}</h1>
      <p className="text-[var(--color-text-muted)]">
        (Halaman dashboard utama untuk role {user.role} belum diimplementasikan)
      </p>
    </PageContainer>
  );
}
