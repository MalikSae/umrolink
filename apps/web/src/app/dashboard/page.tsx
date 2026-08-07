'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from './layout';
import { PageContainer } from './_components/PageContainer';

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [commissions, setCommissions] = useState<{ totalPending: number; totalPaid: number } | null>(null);

  useEffect(() => {
    if (user?.role === 'travel_admin') {
      router.replace('/dashboard/packages');
    } else if (user?.role === 'agent') {
      fetch('/api/agent/commissions')
        .then(res => res.json())
        .then(data => setCommissions(data))
        .catch(console.error);
    }
  }, [user, router]);

  if (!user) return null;

  if (user.role === 'travel_admin') {
    return <p className="text-[var(--color-text-muted)]">Mengarahkan ke halaman paket...</p>;
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Selamat datang, {user.name}</h1>
      
      {user.role === 'agent' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Total Komisi Pending</h3>
              <p className="text-3xl font-bold text-[var(--color-text)] mt-2">Rp {commissions?.totalPending.toLocaleString('id-ID') ?? '0'}</p>
            </div>
            <div className="p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Total Komisi Dibayar</h3>
              <p className="text-3xl font-bold text-[var(--color-text)] mt-2">Rp {commissions?.totalPaid.toLocaleString('id-ID') ?? '0'}</p>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/dashboard/commissions" className="text-primary hover:underline font-medium">
              Lihat Detail Komisi &rarr;
            </Link>
          </div>
        </>
      )}

      {user.role !== 'agent' && (
        <p className="text-[var(--color-text-muted)]">
          (Halaman dashboard utama untuk role {user.role} belum diimplementasikan)
        </p>
      )}
    </PageContainer>
  );
}
