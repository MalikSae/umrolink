'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '../_components/PageContainer';
import { Button, Modal, ModalContent, ModalHeader, ModalTitle, Input, Badge, Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@umrolink/ui';
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
        <h1 className="text-2xl md:text-4xl font-bold leading-tight text-neutral-900">
          Keberangkatan
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          + Tambah Keberangkatan
        </Button>
      </div>

      <Card className={`overflow-hidden p-0 hidden md:block transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tgl Keberangkatan</TableHead>
              <TableHead>Paket Terkait</TableHead>
              <TableHead>Total Seat</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Seat Tersisa</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && departures.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-500 py-10">
                  Belum ada data keberangkatan.
                </TableCell>
              </TableRow>
            )}
            {departures.map((dep) => (
              <TableRow key={dep.id}>
                <TableCell className="font-medium">
                  {formatDate(dep.departureDate)}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline">
                    {dep.package?.name || 'Paket tidak ditemukan'}
                  </Link>
                </TableCell>
                <TableCell>{dep.quota}</TableCell>
                <TableCell>{dep.confirmedCount}</TableCell>
                <TableCell className="font-semibold">{dep.remaining}</TableCell>
                <TableCell>
                  <Badge 
                    variant={dep.status === 'available' ? 'success' : dep.status === 'sold' ? 'error' : 'secondary'}
                  >
                    {dep.status === 'available' ? 'Tersedia' : dep.status === 'sold' ? 'Penuh' : 'Sudah Lewat'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card Stack */}
      <div className={`space-y-3 md:hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {!loading && departures.length === 0 && (
          <Card className="p-6 text-center text-neutral-500">
            Belum ada data keberangkatan.
          </Card>
        )}
        {departures.map((dep) => (
          <Card key={dep.id} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Tgl Keberangkatan</p>
                <p className="font-semibold text-neutral-900">{formatDate(dep.departureDate)}</p>
              </div>
              <Badge 
                variant={dep.status === 'available' ? 'success' : dep.status === 'sold' ? 'error' : 'secondary'}
              >
                {dep.status === 'available' ? 'Tersedia' : dep.status === 'sold' ? 'Penuh' : 'Sudah Lewat'}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Paket Terkait</p>
              <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline font-medium text-sm">
                {dep.package?.name || 'Paket tidak ditemukan'}
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-0.5">Total Seat</p>
                <p className="font-medium text-sm">{dep.quota}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-0.5">Booked</p>
                <p className="font-medium text-sm">{dep.confirmedCount}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-neutral-400 mb-0.5">Tersisa</p>
                <p className="font-bold text-sm text-neutral-900">{dep.remaining}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!submitting) setIsModalOpen(open);
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Tambah Keberangkatan</ModalTitle>
          </ModalHeader>
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
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}
