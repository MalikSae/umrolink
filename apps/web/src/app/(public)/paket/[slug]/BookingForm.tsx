'use client';

import { useState } from 'react';
import { Button } from '@umrolink/ui/src/Button';
import { Input } from '@umrolink/ui/src/Input';
import { submitLead } from './actions';
import { cn } from '@umrolink/ui/src/utils';

interface Departure {
  id: string;
  departureDate: string; // ISO string when passed from server
  quota: number;
  isSold: boolean;
  isPast: boolean;
}

export default function BookingForm({ departures }: { departures: Departure[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [departureId, setDepartureId] = useState('');

  // Filter out departures that are past
  const validDepartures = departures.filter(d => !d.isPast);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!departureId) {
      setError('Silakan pilih jadwal keberangkatan');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    
    try {
      const res = await submitLead({ departureId, name, phone });
      if (res.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        setDepartureId('');
      } else {
        setError(res.error || 'Terjadi kesalahan saat mengirim form');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl">
        <h4 className="font-bold text-lg mb-2">Booking Berhasil Dikirim!</h4>
        <p>Terima kasih. Tim kami akan segera menghubungi Anda melalui nomor telepon yang diberikan.</p>
        <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>Kirim Ulang</Button>
      </div>
    );
  }

  const allSold = validDepartures.length > 0 && validDepartures.every(d => d.isSold);
  if (validDepartures.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 text-slate-800 p-6 rounded-2xl text-center">
        <p>Mohon maaf, belum ada jadwal keberangkatan yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      
      {allSold && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold mb-4 text-center">
          Semua Jadwal Keberangkatan Penuh (SOLD OUT)
        </div>
      )}

      <div>
        <label htmlFor="departure" className="block text-sm font-medium text-slate-700 mb-1">Pilih Keberangkatan</label>
        <div className="space-y-2">
          {validDepartures.map(d => {
            const dateStr = new Date(d.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            return (
              <label 
                key={d.id} 
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                  departureId === d.id ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" : "border-slate-200 hover:border-slate-300",
                  d.isSold && "opacity-50 cursor-not-allowed bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="departure" 
                    value={d.id}
                    checked={departureId === d.id}
                    onChange={() => setDepartureId(d.id)}
                    disabled={d.isSold}
                    className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="font-medium text-slate-900">{dateStr}</span>
                </div>
                {d.isSold && <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded">SOLD OUT</span>}
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
        <Input 
          type="text" 
          id="name" 
          name="name" 
          required 
          disabled={allSold}
          placeholder="Cth: Budi Santoso"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
        <Input 
          type="tel" 
          id="phone" 
          name="phone" 
          required 
          disabled={allSold}
          placeholder="Cth: 081234567890"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading || allSold}>
        {loading ? 'Mengirim...' : (allSold ? 'Tidak Tersedia' : 'Booking Sekarang')}
      </Button>
    </form>
  );
}

