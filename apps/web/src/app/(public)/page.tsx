import { headers } from 'next/headers';
import { BannerCarousel } from './_components/BannerCarousel';
import { MonthFilter } from './_components/MonthFilter';
import { FeaturedStrip } from './_components/FeaturedStrip';
import { FilteredPackages } from './_components/FilteredPackages';
import { AboutTravel } from './_components/AboutTravel';
import { Card } from '@umrolink/ui';

async function fetchData(endpoint: string) {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/public/${endpoint}`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return null;
  }
}

export default async function PublicHomePage() {
  const [tenant, banners, departureMonths, featuredPackages, allPackages] = await Promise.all([
    fetchData('tenant'),
    fetchData('banners'),
    fetchData('departure-months'),
    fetchData('packages?featured=true'),
    fetchData('packages'),
  ]);

  return (
    <div className="w-full pb-20">
      <BannerCarousel banners={banners || []} />
      
      <div className="px-4 py-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Temukan Paket Umrah Terbaik
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Perjalanan ibadah Anda yang nyaman dan berkesan dimulai dari sini.
        </p>
      </div>

      <div className="px-4 mb-8">
        <div className="w-full bg-neutral-100 rounded-full flex items-center px-4 py-3 text-neutral-400">
          <i className="ti ti-search text-xl mr-2"></i>
          <span className="text-sm">Cari paket umrah... (Segera Hadir)</span>
        </div>
      </div>

      <FeaturedStrip packages={featuredPackages || []} />

      <FilteredPackages initialPackages={allPackages || []} months={departureMonths || []} />

      {tenant && <AboutTravel tenant={tenant} />}
    </div>
  );
}
