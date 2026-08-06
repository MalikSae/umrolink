'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Card,
  Input,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@umrolink/ui';
import Link from 'next/link';
import { useUser } from '../layout';
import { CalendarDays, Search, X, Pencil, Trash2, Star } from 'lucide-react';
import { PageContainer } from '../_components/PageContainer';

interface Package {
  id: string;
  name: string;
  status: string;
  priceQuad: number | null;
  featuredImage: string | null;
  featured: boolean;
  _count?: { departures: number };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const user = useUser();
  const router = useRouter();

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status !== 'all') params.set('status', status);

    const res = await fetch(`/api/packages?${params.toString()}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setPackages(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
    }
    setLoading(false);
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    if (user && user.role !== 'travel_admin') {
      router.push('/dashboard');
      return;
    }
    fetchPackages();
  }, [user, router, fetchPackages]);

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const handleDelete = async (id: string) => {

    await fetch(`/api/packages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    fetchPackages();
    setConfirmDeleteId(null);
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setPackages(packages.map(p => p.id === id ? { ...p, featured: !currentStatus } : p));
    
    const res = await fetch(`/api/packages/${id}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !currentStatus }),
      credentials: 'include',
    });
    
    if (!res.ok) {
      // Revert if failed
      setPackages(packages.map(p => p.id === id ? { ...p, featured: currentStatus } : p));
    }
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold leading-tight text-neutral-900">
          Manajemen Paket
        </h1>
        <Link href="/dashboard/packages/new" className="shrink-0">
          <Button>Tambah Paket</Button>
        </Link>
      </div>

      <Modal open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Konfirmasi Hapus</ModalTitle>
            <ModalDescription>
              Yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
              }}
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search — pakai leftIcon + rightIcon dari komponen Input */}
        <div className="flex-1">
          <Input
            id="packages-search"
            placeholder="Cari nama paket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              search ? (
                <button
                  onClick={clearSearch}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Status filter — native select */}
        <select
          id="packages-status-filter"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 transition-[border-color,box-shadow]"
        >
          <option value="all">Semua Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Total info */}
      {!loading && (
        <p className="text-sm text-neutral-500 mb-3">
          {meta.total} paket ditemukan
          {debouncedSearch && (
            <span> untuk &ldquo;<span className="font-medium text-neutral-700">{debouncedSearch}</span>&rdquo;</span>
          )}
        </p>
      )}

      {/* Desktop: tabel */}
      <Card className={`overflow-hidden p-0 hidden md:block transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nama Paket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Unggulan</TableHead>
              <TableHead>Harga Quad</TableHead>
              <TableHead>Keberangkatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    {pkg.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pkg.featuredImage} alt={pkg.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>
                  <Badge variant={pkg.status === 'published' ? 'success' : 'default'}>
                    {pkg.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip content={pkg.featured ? "Hapus dari Unggulan" : "Jadikan Unggulan"}>
                    <button
                      onClick={() => handleToggleFeatured(pkg.id, pkg.featured)}
                      className={`p-1.5 rounded-full transition-colors ${pkg.featured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-neutral-400 hover:text-yellow-500 hover:bg-neutral-50'}`}
                      aria-label="Toggle Unggulan"
                    >
                      <Star className={`h-5 w-5 ${pkg.featured ? 'fill-current' : ''}`} />
                    </button>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {pkg.priceQuad ? `Rp ${pkg.priceQuad.toLocaleString('id-ID')}` : '-'}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <CalendarDays className="h-4 w-4 text-neutral-400" />
                    {pkg._count?.departures ?? 0} tanggal
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip content="Edit paket">
                      <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                        <Button variant="outline" size="icon-sm" aria-label="Edit paket">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </Tooltip>
                    <Tooltip content="Hapus paket">
                      <Button variant="destructive" size="icon-sm" aria-label="Hapus paket" onClick={() => setConfirmDeleteId(pkg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && packages.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-neutral-500 py-10">
                  {debouncedSearch || status !== 'all'
                    ? 'Tidak ada paket yang cocok dengan filter.'
                    : 'Belum ada paket. Klik "Tambah Paket" untuk mulai.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: card/stacked layout */}
      <div className={`space-y-3 md:hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {!loading && packages.length === 0 && (
          <Card className="p-6 text-center text-neutral-500">
            {debouncedSearch || status !== 'all'
              ? 'Tidak ada paket yang cocok dengan filter.'
              : 'Belum ada paket.'}
          </Card>
        )}
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-4">
            {/* Row atas: gambar + nama + badge */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center">
                {pkg.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkg.featuredImage} alt={pkg.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-300 text-xs">—</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 leading-snug line-clamp-2 text-sm">{pkg.name}</p>
                <div className="mt-1">
                  <Badge variant={pkg.status === 'published' ? 'success' : 'default'}>
                    {pkg.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Row tengah: harga + keberangkatan */}
            <div className="flex items-center gap-3 mb-3 pt-3 border-t border-neutral-100">
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-0.5">Harga Quad</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {pkg.priceQuad ? `Rp ${pkg.priceQuad.toLocaleString('id-ID')}` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 mb-0.5">Keberangkatan</p>
                <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1 justify-end">
                  <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                  {pkg._count?.departures ?? 0} tanggal
                </p>
              </div>
            </div>

            {/* Row bawah: tombol aksi di kanan */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => handleToggleFeatured(pkg.id, pkg.featured)}
                className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${pkg.featured ? 'text-yellow-600 bg-yellow-50' : 'text-neutral-500 hover:bg-neutral-50'}`}
              >
                <Star className={`h-4 w-4 ${pkg.featured ? 'fill-current' : ''}`} />
                {pkg.featured ? 'Unggulan' : 'Jadikan Unggulan'}
              </button>
              
              <div className="flex justify-end gap-1.5">
                <Tooltip content="Edit paket">
                  <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                    <Button variant="outline" size="icon-sm" aria-label="Edit paket">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </Tooltip>
              <Tooltip content="Hapus paket">
                <Button variant="destructive" size="icon-sm" aria-label="Hapus paket" onClick={() => setConfirmDeleteId(pkg.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Tooltip>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </PageContainer>
  );
}
