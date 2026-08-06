'use client';

import { useState } from 'react';
import { Button } from '@umrolink/ui/src/Button';
import { Input } from '@umrolink/ui/src/Input';
import { submitLead } from './actions';

export default function BookingForm({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    
    try {
      const res = await submitLead({ packageId, name, phone });
      if (res.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
        <Input 
          type="text" 
          id="name" 
          name="name" 
          required 
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
          placeholder="Cth: 081234567890"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Booking Sekarang'}
      </Button>
    </form>
  );
}

