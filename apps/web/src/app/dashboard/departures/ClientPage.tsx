'use client';

import { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '../_components/PageContainer';
import { Button, Modal, ModalContent, ModalHeader, ModalTitle, Input, Badge, Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@umrolink/ui';
import Link from 'next/link';

export default function DeparturesClientPage() {
  const [allDepartures, setAllDepartures] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPackage, setFilterPackage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Highlight new row
  const [newRowId, setNewRowId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ packageId: '', departureDate: '', quota: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departures?limit=10000');
      const json = await res.json();
      if (res.ok) {
        setAllDepartures(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages?limit=10000');
      const json = await res.json();
      if (res.ok) {
        setPackages(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchDepartures(), fetchPackages()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Compute 4-level status for a departure
  const getDepartureStatus4 = (dep: any) => {
    const isPast = new Date(dep.departureDate) < new Date();
    if (isPast) return 'past';
    const remaining = dep.quota - dep.confirmedCount;
    if (remaining <= 0) return 'sold';
    if (remaining <= 3 || remaining <= dep.quota * 0.1) return 'near-full';
    return 'available';
  };

  // Enhance all departures with computed properties
  const enrichedDepartures = useMemo(() => {
    return allDepartures.map(dep => ({
      ...dep,
      status4: getDepartureStatus4(dep)
    }));
  }, [allDepartures]);

  // Derived filter options
  const monthOptions = useMemo(() => {
    const months = new Map();
    enrichedDepartures.forEach(dep => {
      const d = new Date(dep.departureDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!months.has(key)) {
        months.set(key, { key, label, timestamp: d.getTime() });
      }
    });
    return Array.from(months.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [enrichedDepartures]);

  const packageOptions = useMemo(() => {
    const pkgs = new Set();
    enrichedDepartures.forEach(dep => {
      if (dep.package?.name) {
        pkgs.add(dep.package.name);
      }
    });
    return Array.from(pkgs).sort() as string[];
  }, [enrichedDepartures]);

  // Filtered array
  const filteredDepartures = useMemo(() => {
    return enrichedDepartures.filter(dep => {
      const d = new Date(dep.departureDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (filterMonth !== 'all' && monthKey !== filterMonth) return false;
      if (filterPackage !== 'all' && dep.package?.name !== filterPackage) return false;
      if (filterStatus !== 'all' && dep.status4 !== filterStatus) return false;
      
      return true;
    });
  }, [enrichedDepartures, filterMonth, filterPackage, filterStatus]);

  // Auto-fill quota when packageId changes
  useEffect(() => {
    if (formData.packageId) {
      const existing = allDepartures
        .filter(d => d.packageId === formData.packageId)
        .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime());
      
      if (existing.length > 0) {
        setFormData(prev => ({ ...prev, quota: String(existing[0].quota) }));
      }
    }
  }, [formData.packageId, allDepartures]);

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
        const newData = await res.json();
        setIsModalOpen(false);
        setFormData({ packageId: '', departureDate: '', quota: '' });
        await fetchDepartures();
        setNewRowId(newData.id);
        setTimeout(() => setNewRowId(null), 2500); // clear highlight after 2.5s
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

  const getStatusBadge = (status4: string) => {
    switch (status4) {
      case 'past': return <Badge variant="secondary">Sudah Lewat</Badge>;
      case 'sold': return <Badge variant="error">Penuh</Badge>;
      case 'near-full': return <Badge variant="warning">Hampir Penuh</Badge>;
      case 'available': return <Badge variant="success">Tersedia</Badge>;
      default: return null;
    }
  };

  const getStatusColorClass = (status4: string) => {
    switch (status4) {
      case 'past': return 'bg-neutral-400';
      case 'sold': return 'bg-tenant-error';
      case 'near-full': return 'bg-tenant-warning';
      case 'available': return 'bg-tenant-success';
      default: return 'bg-tenant-primary';
    }
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Semua Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {monthOptions.map(m => (
              <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPackage} onValueChange={setFilterPackage}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Semua Paket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Paket</SelectItem>
            {packageOptions.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="near-full">Hampir Penuh</SelectItem>
            <SelectItem value="sold">Penuh</SelectItem>
            <SelectItem value="past">Sudah Lewat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className={`overflow-hidden p-0 hidden md:block transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tgl Keberangkatan</TableHead>
              <TableHead>Paket Terkait</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartures.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-neutral-500 py-10">
                  Belum ada data keberangkatan yang sesuai.
                </TableCell>
              </TableRow>
            )}
            {filteredDepartures.map((dep) => {
              const isNew = dep.id === newRowId;
              const isPast = dep.status4 === 'past';
              const rowClass = `
                ${isNew ? 'bg-tenant-success/10 transition-colors duration-1000' : 'transition-colors duration-1000'}
                ${isPast ? 'opacity-60' : ''}
              `.trim();
              
              return (
                <TableRow key={dep.id} className={rowClass}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatDate(dep.departureDate)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline">
                      {dep.package?.name || 'Paket tidak ditemukan'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
                      <span className="text-xs text-neutral-600 font-medium">
                        {dep.confirmedCount} / {dep.quota} terisi
                      </span>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStatusColorClass(dep.status4)} transition-all duration-500`} 
                          style={{ width: `${Math.min(100, (dep.confirmedCount / dep.quota) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dep.status4)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card Stack */}
      <div className={`space-y-3 md:hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {filteredDepartures.length === 0 && (
          <Card className="p-6 text-center text-neutral-500">
            Belum ada data keberangkatan yang sesuai.
          </Card>
        )}
        {filteredDepartures.map((dep) => {
          const isNew = dep.id === newRowId;
          const isPast = dep.status4 === 'past';
          const cardClass = `p-4 flex flex-col gap-3 ${isNew ? 'bg-tenant-success/10' : ''} ${isPast ? 'opacity-60' : ''}`;

          return (
            <Card key={dep.id} className={cardClass}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Tgl Keberangkatan</p>
                  <p className="font-semibold text-neutral-900">{formatDate(dep.departureDate)}</p>
                </div>
                {getStatusBadge(dep.status4)}
              </div>
              
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Paket Terkait</p>
                <Link href={`/dashboard/packages/${dep.packageId}/edit`} className="text-tenant-primary hover:underline font-medium text-sm">
                  {dep.package?.name || 'Paket tidak ditemukan'}
                </Link>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-end mb-1.5">
                  <p className="text-xs text-neutral-400">Kapasitas</p>
                  <span className="text-xs text-neutral-600 font-medium">
                    {dep.confirmedCount} / {dep.quota} terisi
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStatusColorClass(dep.status4)} transition-all duration-500`} 
                    style={{ width: `${Math.min(100, (dep.confirmedCount / dep.quota) * 100)}%` }} 
                  />
                </div>
              </div>
            </Card>
          );
        })}
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
            <Select
              required
              value={formData.packageId}
              onValueChange={(value) => setFormData({ ...formData, packageId: value })}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Paket --" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
