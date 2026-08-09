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
    <div className="w-full pt-4">
      <div className="px-4 mb-6">
        <div className="w-full bg-slate-50 rounded-2xl flex items-center px-4 py-3 text-slate-400 border border-slate-100 shadow-sm">
          <i className="ti ti-search text-xl mr-3 text-slate-500"></i>
          <span className="text-sm flex-grow text-slate-500 font-medium">Cari paket umrah...</span>
          <i className="ti ti-adjustments-horizontal text-xl text-slate-600"></i>
        </div>
      </div>

      <BannerCarousel banners={banners || []} />

      <FeaturedStrip packages={featuredPackages || []} />

      <FilteredPackages initialPackages={allPackages || []} months={departureMonths || []} />

      {tenant && <AboutTravel tenant={tenant} />}
    </div>
  );
}
