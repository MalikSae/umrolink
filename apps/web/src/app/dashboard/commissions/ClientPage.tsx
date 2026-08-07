'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { PageContainer } from '../_components/PageContainer';

export default function ClientPage() {
  const user = useUser();
  const [commissions, setCommissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const endpoint = user.role === 'agent' ? '/api/agent/commissions' : '/api/commissions';
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setCommissions(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading) {
    return (
      <PageContainer>
        <p className="text-[var(--color-text-muted)]">Memuat data komisi...</p>
      </PageContainer>
    );
  }

  const markPayable = async (id: string) => {
    try {
      const res = await fetch(`/api/commissions/${id}/mark-payable`, { method: 'PATCH' });
      if (res.ok) {
        // Refresh data
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.message || 'Gagal menandai payable');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const markPaid = async (id: string) => {
    if (!confirm('Apakah Anda yakin komisi ini sudah dibayar?')) return;
    try {
      const res = await fetch(`/api/commissions/${id}/mark-paid`, { method: 'PATCH' });
      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.message || 'Gagal menandai dibayar');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const list = user.role === 'agent' ? commissions.commissions : commissions;

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {user.role === 'agent' ? 'Komisi Saya' : 'Manajemen Komisi'}
        </h1>
      </div>

      {user.role === 'agent' && commissions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Total Komisi Pending</h3>
            <p className="text-3xl font-bold text-[var(--color-text)] mt-2">Rp {commissions.totalPending?.toLocaleString('id-ID') ?? '0'}</p>
          </div>
          <div className="p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Total Komisi Dibayar</h3>
            <p className="text-3xl font-bold text-[var(--color-text)] mt-2">Rp {commissions.totalPaid?.toLocaleString('id-ID') ?? '0'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-text)]">
            <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Jamaah</th>
                {user.role !== 'agent' && <th className="px-6 py-4 font-medium">Agen</th>}
                <th className="px-6 py-4 font-medium">Nominal</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {user.role !== 'agent' && <th className="px-6 py-4 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {(!list || list.length === 0) && (
                <tr>
                  <td colSpan={user.role === 'agent' ? 4 : 6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                    Belum ada data komisi.
                  </td>
                </tr>
              )}
              {list?.map((item: any) => (
                <tr key={item.id} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 font-medium">{item.lead?.name}</td>
                  {user.role !== 'agent' && (
                    <td className="px-6 py-4">
                      {item.agent?.user?.name}
                      <span className="block text-xs text-[var(--color-text-muted)]">{item.agent?.agentCode}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 font-semibold">Rp {item.amount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'payable' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  {user.role !== 'agent' && (
                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => markPayable(item.id)}
                          className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors mr-2"
                        >
                          Tandai Payable
                        </button>
                      )}
                      {item.status === 'payable' && (
                        <button
                          onClick={() => markPaid(item.id)}
                          className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors mr-2"
                        >
                          Tandai Dibayar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
