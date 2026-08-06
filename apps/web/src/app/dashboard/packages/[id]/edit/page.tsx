'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card, Alert, RichTextEditor } from '@umrolink/ui';
import Link from 'next/link';
import { Plus, Trash2, Upload, ImageIcon, ArrowLeft, Plane, Building2, ListChecks, DollarSign, CalendarDays, ExternalLink, Wallet } from 'lucide-react';
import { PageContainer } from '../../../_components/PageContainer';

interface DepartureRow {
  id?: string;
  departureDate: string;
  quota: number;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  airline: string | null;
  hotelMakkah: string | null;
  hotelMadinah: string | null;
  include: string | null;
  exclude: string | null;
  priceQuad: number | null;
  priceTriple: number | null;
  priceDouble: number | null;
  agentCommission: number | null;
  featuredImage: string | null;
  slug: string;
  status: 'draft' | 'published';
  departures: { id: string; departureDate: string; quota: number }[];
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export default function EditPackagePage() {
  const [pkg, setPkg] = useState<Package | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const params = useParams();
  const id = params?.id as string;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [airline, setAirline] = useState('');
  const [hotelMakkah, setHotelMakkah] = useState('');
  const [hotelMadinah, setHotelMadinah] = useState('');
  const [include, setInclude] = useState('');
  const [exclude, setExclude] = useState('');
  const [priceQuad, setPriceQuad] = useState('');
  const [priceTriple, setPriceTriple] = useState('');
  const [priceDouble, setPriceDouble] = useState('');
  const [agentCommission, setAgentCommission] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/packages/${id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Paket tidak ditemukan');
        return res.json();
      })
      .then((data: Package) => {
        setPkg(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setAirline(data.airline || '');
        setHotelMakkah(data.hotelMakkah || '');
        setHotelMadinah(data.hotelMadinah || '');
        setInclude(data.include || '');
        setExclude(data.exclude || '');
        setPriceQuad(data.priceQuad ? String(data.priceQuad) : '');
        setPriceTriple(data.priceTriple ? String(data.priceTriple) : '');
        setPriceDouble(data.priceDouble ? String(data.priceDouble) : '');
        setAgentCommission(data.agentCommission ? String(data.agentCommission) : '');
        setStatus(data.status || 'draft');
        setDepartures(
          (data.departures || []).map((d) => ({
            id: d.id,
            departureDate: d.departureDate.split('T')[0],
            quota: d.quota,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addDeparture = () => setDepartures(prev => [...prev, { departureDate: '', quota: 0 }]);
  const removeDeparture = (index: number) => setDepartures(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  const updateDeparture = (index: number, field: keyof DepartureRow, value: string | number) =>
    setDepartures(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));

  const formatNumber = (val: string | number) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };
  const parseNumber = (val: string) => val.replace(/\D/g, '');

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      name,
      description,
      status, // Mengirim status secara eksplisit
      airline: airline || null,
      hotelMakkah: hotelMakkah || null,
      hotelMadinah: hotelMadinah || null,
      include: include || null,
      exclude: exclude || null,
      priceQuad: priceQuad ? parseInt(priceQuad) : null,
      priceTriple: priceTriple ? parseInt(priceTriple) : null,
      priceDouble: priceDouble ? parseInt(priceDouble) : null,
      agentCommission: agentCommission ? parseInt(agentCommission) : null,
      departures: departures.map((d) => ({
        id: d.id,
        departureDate: d.departureDate,
        quota: d.quota,
      })),
    };
    return payload;
  };

  const translateError = (msg: string) => {
    if (msg.includes('must be a valid ISO 8601 date string')) return 'Pilih tanggal yang valid';
    if (msg.includes('should not be empty')) return 'Bagian ini wajib diisi';
    if (msg.includes('must be an integer number')) return 'Harus berupa angka bulat';
    if (msg.includes('must not be less than 1')) return 'Minimal harus 1';
    if (msg.includes('must not be less than 0')) return 'Tidak boleh negatif';
    if (msg.includes('must be longer than or equal to')) return 'Teks terlalu pendek';
    if (msg.includes('minimal harus ada 1')) return 'Wajib ada minimal 1 jadwal keberangkatan';
    if (msg.includes('published but requires')) return msg;
    return 'Isian ini tidak valid';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        if (Array.isArray(data.message)) {
          const errors: Record<string, string> = {};
          data.message.forEach((msg: string) => {
            const field = msg.split(' ')[0];
            errors[field] = translateError(msg);
          });
          setFieldErrors(errors);
          throw new Error('Terdapat isian yang tidak valid!');
        }
        throw new Error(data.message || 'Gagal menyimpan perubahan');
      }

      const updated = await res.json();
      setPkg(updated);
      setStatus(updated.status); // sinkronkan jika ada validasi backend yang mereset status
      setSuccess('Perubahan berhasil disimpan');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setTimeout(() => {
        const firstError = document.querySelector('.border-danger, .text-danger');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setImageError('Ukuran file maksimal 20MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Format harus JPG, PNG, atau WebP');
      return;
    }

    setImageError('');
    setUploadingImage(true);
    setSuccess('');

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/packages/${id}/featured-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal upload foto');
      }

      const updated = await res.json();
      setPkg(updated);
      setImagePreview(null);
      setSuccess('Foto utama berhasil diupload');
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Gagal upload');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) return <p className="text-neutral-500">Loading...</p>;
  if (!pkg && error) return <Alert variant="danger">{error}</Alert>;

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/packages">
          <Button variant="outline" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight text-neutral-900">Edit Paket</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Edit informasi, harga, dan publikasi paket.</p>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-5">{error}</Alert>}
      {success && <Alert variant="success" className="mb-5">{success}</Alert>}
      {imageError && <Alert variant="danger" className="mb-5">{imageError}</Alert>}

      <form onSubmit={handleUpdate}>
        {/* WordPress-style 2-column layout konsisten dengan form Tambah Baru */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── Kolom kiri: konten utama ── */}
          <div className="flex-1 min-w-0 space-y-5">
            <Card className="p-5">
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                Nama Paket <span className="text-danger">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                placeholder="Contoh: Paket Umrah Reguler 9 Hari"
                error={fieldErrors['name']}
              />
              {pkg?.slug && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                  <span>Permalink:</span>
                  <Link 
                    href={`/paket/${pkg.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    /paket/{pkg.slug}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Deskripsi</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Tulis deskripsi paket..."
              />
            </Card>

            <SectionCard icon={Plane} title="Akomodasi" description="Maskapai dan informasi hotel">
              <FieldRow>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Maskapai</label>
                  <Input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Contoh: Garuda Indonesia" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      <Building2 className="h-3.5 w-3.5 inline mr-1 text-neutral-400" />
                      Hotel Makkah
                    </label>
                    <Input value={hotelMakkah} onChange={(e) => setHotelMakkah(e.target.value)} placeholder="Nama hotel di Makkah" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      <Building2 className="h-3.5 w-3.5 inline mr-1 text-neutral-400" />
                      Hotel Madinah
                    </label>
                    <Input value={hotelMadinah} onChange={(e) => setHotelMadinah(e.target.value)} placeholder="Nama hotel di Madinah" />
                  </div>
                </div>
              </FieldRow>
            </SectionCard>

            <SectionCard icon={ListChecks} title="Fasilitas" description="Item yang sudah termasuk dan tidak termasuk dalam paket">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="include" className="block text-sm font-medium text-neutral-700 mb-1">Sudah Termasuk</label>
                  <textarea
                    id="include"
                    value={include}
                    onChange={(e) => setInclude(e.target.value)}
                    rows={6}
                    placeholder={"Satu item per baris\nContoh:\nTiket pesawat PP\nVisa Umrah\nHotel bintang 5"}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-surface placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-[border-color,box-shadow] resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="exclude" className="block text-sm font-medium text-neutral-700 mb-1">Tidak Termasuk</label>
                  <textarea
                    id="exclude"
                    value={exclude}
                    onChange={(e) => setExclude(e.target.value)}
                    rows={6}
                    placeholder={"Satu item per baris\nContoh:\nBiaya handling koper\nPengeluaran pribadi"}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-surface placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-[border-color,box-shadow] resize-none"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Kolom kanan: sidebar sticky ── */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-6 pb-6">

            {/* Simpan & Status */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Publikasi</h3>
              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Status Paket</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 transition-[border-color,box-shadow]"
                >
                  <option value="draft">Draft (Sembunyikan dari Publik)</option>
                  <option value="published">Published (Tampilkan ke Publik)</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </Card>

            {/* Foto utama */}
            <SectionCard icon={ImageIcon} title="Foto Utama">
              <div className="space-y-4">
                {(imagePreview || pkg?.featuredImage) ? (
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview || pkg?.featuredImage || ''}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-neutral-300 rounded-lg bg-neutral-50">
                    <ImageIcon className="h-8 w-8 text-neutral-300 mb-2" />
                    <p className="text-xs text-neutral-500">Belum ada foto utama.</p>
                  </div>
                )}
                
                <div>
                  <input
                    type="file"
                    id="featured-image"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                  <label htmlFor="featured-image" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? 'Mengupload...' : 'Ganti Foto'}
                    </Button>
                  </label>
                  <p className="text-[10px] text-neutral-400 text-center mt-2">Format: JPG, PNG, WebP (Max 20MB)</p>
                </div>
              </div>
            </SectionCard>

            {/* Harga */}
            <SectionCard icon={DollarSign} title="Harga" description="Isi minimal satu harga untuk publish">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Quad (4 org/kamar)</label>
                  <Input type="text" value={formatNumber(priceQuad)} onChange={(e) => setPriceQuad(parseNumber(e.target.value))} placeholder="Rp" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Triple (3 org/kamar)</label>
                  <Input type="text" value={formatNumber(priceTriple)} onChange={(e) => setPriceTriple(parseNumber(e.target.value))} placeholder="Rp" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Double (2 org/kamar)</label>
                  <Input type="text" value={formatNumber(priceDouble)} onChange={(e) => setPriceDouble(parseNumber(e.target.value))} placeholder="Rp" />
                </div>
              </div>
            </SectionCard>

            {/* Komisi */}
            <SectionCard icon={Wallet} title="Komisi" description="Komisi untuk agen/jamaah">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Nominal Komisi</label>
                  <Input type="text" value={formatNumber(agentCommission)} onChange={(e) => setAgentCommission(parseNumber(e.target.value))} placeholder="Rp (opsional)" />
                </div>
              </div>
            </SectionCard>

            {/* Keberangkatan */}
            <SectionCard icon={CalendarDays} title="Keberangkatan" description="Wajib minimal 1 jadwal">
              <div className="space-y-2">
                {fieldErrors['departures'] && (
                  <p className="text-xs text-danger">{fieldErrors['departures']}</p>
                )}
                {departures.map((dep, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-neutral-500 mb-1">Tanggal</label>
                      <Input
                        type="date"
                        value={dep.departureDate}
                        onChange={(e) => updateDeparture(index, 'departureDate', e.target.value)}
                        required
                        error={fieldErrors[`departures.${index}.departureDate`]}
                      />
                    </div>
                    <div className="w-16 shrink-0">
                      <label className="block text-xs text-neutral-500 mb-1">Kuota</label>
                      <Input
                        type="number"
                        value={dep.quota === 0 ? '' : dep.quota}
                        onChange={(e) => updateDeparture(index, 'quota', parseInt(e.target.value) || 0)}
                        min={1}
                        required
                        error={fieldErrors[`departures.${index}.quota`]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDeparture(index)}
                      className="h-10 w-8 flex items-center justify-center text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addDeparture} className="w-full mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Tanggal
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
