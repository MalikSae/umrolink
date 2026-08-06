import { headers } from 'next/headers';
import { PackageGrid } from '../_components/PackageGrid';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  let tenantName = 'Umrolink';

  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  try {
    const res = await fetch(`${apiUrl}/api/public/tenant`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const tenant = await res.json();
      if (tenant && tenant.name) {
        tenantName = tenant.name;
      }
    }
  } catch (err) {}

  return {
    title: `Paket Umrah — ${tenantName}`,
    description: `Daftar lengkap paket umrah yang tersedia dari ${tenantName}.`,
  };
}

async function getPackages() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/public/packages`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching packages:', err);
    return [];
  }
}

export default async function PaketPage() {
  const packages = await getPackages();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Semua Paket Umrah
        </h1>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Pilih paket umrah yang sesuai dengan kebutuhan ibadah Anda.
        </p>
      </div>

      <PackageGrid packages={packages} />
    </div>
  );
}
