'use client';

import { useState } from 'react';
import { Button } from '@umrolink/ui/src/Button';
import { confirmLead } from './actions';
import { CheckCircle2 } from 'lucide-react';

export default function ClientPage({ initialLeads, userRole }: { initialLeads: any[], userRole: string }) {
  const [leads, setLeads] = useState(initialLeads);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleConfirm(id: string) {
    if (!confirm('Apakah Anda yakin ingin mengonfirmasi booking ini?')) return;
    setLoadingId(id);
    setError('');
    
    const res = await confirmLead(id);
    if (res.success) {
      setLeads(leads.map(l => l.id === id ? { ...l, status: 'confirmed' } : l));
    } else {
      setError(res.error || 'Gagal mengonfirmasi');
    }
    setLoadingId(null);
  }

  const canConfirm = userRole === 'super_admin' || userRole === 'travel_admin';

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal & Paket</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keberangkatan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agen</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {canConfirm && (
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => {
                const dateStr = new Date(lead.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const depDateStr = lead.departure?.departureDate 
                  ? new Date(lead.departure.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                
                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{lead.package?.name}</p>
                      <p className="text-sm text-slate-500">{dateStr}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {depDateStr}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {lead.agent?.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                    </td>
                    {canConfirm && (
                      <td className="px-6 py-4 text-right">
                        {lead.status === 'pending' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleConfirm(lead.id)}
                            disabled={loadingId === lead.id}
                          >
                            {loadingId === lead.id ? 'Memproses...' : 'Konfirmasi'}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={canConfirm ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data booking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
