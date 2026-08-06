import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Plane, Building } from 'lucide-react';
import BookingForm from './BookingForm';

async function getPackageBySlug(slug: string) {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/public/packages/${slug}`, {
      headers: { 
        'x-forwarded-host': host,
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch package: ${res.statusText}`);
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching package details:', err);
    return null;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
}

// Ensure type works properly in Next.js 15
export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-tenant-primary hover:underline flex items-center gap-2">
          &larr; Kembali ke Beranda
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header / Featured Image */}
        {pkg.featuredImage ? (
          <div className="w-full h-64 relative bg-slate-100">
            <img src={pkg.featuredImage} alt={pkg.name} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                {pkg.name}
              </h1>
              
              {pkg.description && (
                <div 
                  className="prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 [&_li_p]:my-0 prose-p:leading-relaxed prose-a:text-tenant-primary"
                  dangerouslySetInnerHTML={{ __html: pkg.description }} 
                />
              )}
            </div>

            <div className="w-full shrink-0 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Harga Paket</h3>
              <div className="space-y-4">
                {pkg.priceQuad && (
                  <div>
                    <p className="text-sm text-slate-500">Quad (Sekamar berempat)</p>
                    <p className="text-xl font-bold text-tenant-primary">{formatCurrency(pkg.priceQuad)}</p>
                  </div>
                )}
                {pkg.priceTriple && (
                  <div>
                    <p className="text-sm text-slate-500">Triple (Sekamar bertiga)</p>
                    <p className="text-xl font-bold text-tenant-primary">{formatCurrency(pkg.priceTriple)}</p>
                  </div>
                )}
                {pkg.priceDouble && (
                  <div>
                    <p className="text-sm text-slate-500">Double (Sekamar berdua)</p>
                    <p className="text-xl font-bold text-tenant-primary">{formatCurrency(pkg.priceDouble)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fasilitas & Jadwal */}
          <div className="mt-12 grid grid-cols-1 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Informasi Akomodasi</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><Plane className="w-3.5 h-3.5 text-slate-600" /></div>
                  <div>
                    <p className="font-medium text-slate-900">Maskapai</p>
                    <p className="text-slate-600">{pkg.airline || 'Belum ditentukan'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><Building className="w-3.5 h-3.5 text-slate-600" /></div>
                  <div>
                    <p className="font-medium text-slate-900">Hotel Makkah</p>
                    <p className="text-slate-600">{pkg.hotelMakkah || 'Belum ditentukan'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><Building className="w-3.5 h-3.5 text-slate-600" /></div>
                  <div>
                    <p className="font-medium text-slate-900">Hotel Madinah</p>
                    <p className="text-slate-600">{pkg.hotelMadinah || 'Belum ditentukan'}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Jadwal Keberangkatan</h3>
              {pkg.departures && pkg.departures.length > 0 ? (
                <div className="space-y-3">
                  {pkg.departures.map((dep: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-900">{formatDate(dep.departureDate)}</span>
                      <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">Sisa kuota: {dep.quota}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">Belum ada jadwal keberangkatan.</p>
              )}
            </div>
          </div>
          
          <div className="mt-12 flex flex-col gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Fasilitas Termasuk</h3>
              {pkg.include ? (
                <div 
                  className="prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 [&_li_p]:my-0 text-slate-600"
                  dangerouslySetInnerHTML={{ __html: pkg.include }} 
                />
              ) : (
                <p className="text-slate-500">Tidak ada informasi</p>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Fasilitas Tidak Termasuk</h3>
              {pkg.exclude ? (
                <div 
                  className="prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 [&_li_p]:my-0 text-slate-600"
                  dangerouslySetInnerHTML={{ __html: pkg.exclude }} 
                />
              ) : (
                <p className="text-slate-500">Tidak ada informasi</p>
              )}
            </div>
          </div>

          <div className="mt-16 bg-slate-50 p-6 rounded-3xl border border-slate-100 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Tertarik dengan Paket Ini?</h2>
              <p className="text-slate-600 mt-2">Isi form di bawah ini dan tim kami akan segera menghubungi Anda.</p>
            </div>
            <BookingForm packageId={pkg.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
