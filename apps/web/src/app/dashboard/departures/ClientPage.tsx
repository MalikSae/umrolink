'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '../_components/PageContainer';
import { Button, Modal, Input, Badge } from '@umrolink/ui';
import Link from 'next/link';

export default function DeparturesClientPage() {
  const [departures, setDepartures] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ packageId: '', departureDate: '', quota: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartures = async () => {
    try {
      const res = await fetch('/api/departures');
      const data = await res.json();
      setDepartures(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages?limit=100'); // Assuming we want all active packages
      const json = await res.json();
      setPackages(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchDepartures(), fetchPackages()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.packageId || !formData.departureDate || !formData.quota) {
      alert('Semua field wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/departures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: formData.packageId,
          departureDate: new Date(formData.departureDate).toISOString(),
          quota: parseInt(formData.quota, 10),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ packageId: '', departureDate: '', quota: '' });
        fetchDepartures();
      } else {
        const error = await res.json();
        alert(error.message || 'Gagal menambahkan keberangkatan');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="text-[var(--color-text-muted)]">Memuat data keberangkatan...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Keberangkatan
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          + Tambah Keberangkatan
        </Button>
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left text-sm text-[var(--color-text)]">
          <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Tgl Keberangkatan</th>
              <th className="px-6 py-4 font-medium">Paket Terkait</th>
              <th className="px-6 py-4 font-medium">Total Seat</th>
              <th className="px-6 py-4 font-medium">Booked</th>
              <th className="px-6 py-4 font-medium">Seat Tersisa</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {departures.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                  Belum ada data keberangkatan.
                </td>
              </tr>
            )}
            {departures.map((dep) => (
              <tr key={dep.id} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {formatDate(dep.departureDate)}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline">
                    {dep.package?.name || 'Paket tidak ditemukan'}
                  </Link>
                </td>
                <td className="px-6 py-4">{dep.quota}</td>
                <td className="px-6 py-4">{dep.confirmedCount}</td>
                <td className="px-6 py-4 font-semibold">{dep.remaining}</td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={dep.status === 'available' ? 'success' : dep.status === 'sold' ? 'error' : 'secondary'}
                  >
                    {dep.status === 'available' ? 'Tersedia' : dep.status === 'sold' ? 'Penuh' : 'Sudah Lewat'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden space-y-4">
        {departures.length === 0 && (
          <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center text-[var(--color-text-muted)] text-sm">
            Belum ada data keberangkatan.
          </div>
        )}
        {departures.map((dep) => (
          <div key={dep.id} className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Tgl Keberangkatan</p>
                <p className="font-bold text-[var(--color-text)]">{formatDate(dep.departureDate)}</p>
              </div>
              <Badge 
                variant={dep.status === 'available' ? 'success' : dep.status === 'sold' ? 'error' : 'secondary'}
              >
                {dep.status === 'available' ? 'Tersedia' : dep.status === 'sold' ? 'Penuh' : 'Sudah Lewat'}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Paket Terkait</p>
              <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline font-medium text-sm">
                {dep.package?.name || 'Paket tidak ditemukan'}
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--color-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Total Seat</p>
                <p className="font-medium text-sm">{dep.quota}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Booked</p>
                <p className="font-medium text-sm">{dep.confirmedCount}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Tersisa</p>
                <p className="font-bold text-sm">{dep.remaining}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Tambah Keberangkatan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Pilih Paket Umroh
            </label>
            <select
              required
              value={formData.packageId}
              onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-tenant-primary/20 focus:border-tenant-primary bg-white text-sm"
              disabled={submitting}
            >
              <option value="">-- Pilih Paket --</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Pilih Tgl Berangkat
            </label>
            <Input
              type="date"
              required
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Total Seat
            </label>
            <Input
              type="number"
              min="1"
              required
              value={formData.quota}
              onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
              placeholder="Contoh: 45"
              disabled={submitting}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
