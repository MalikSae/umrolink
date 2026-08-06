"use client";

import Link from 'next/link';

interface Package {
  id: string;
  slug: string;
  name: string;
  featuredImage: string | null;
  priceQuad: number | null;
  priceTriple: number | null;
  priceDouble: number | null;
}

interface FeaturedStripProps {
  packages: Package[];
}

export function FeaturedStrip({ packages }: FeaturedStripProps) {
  if (!packages || packages.length === 0) {
    return null;
  }

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStartingPrice = (pkg: Package) => {
    const prices = [pkg.priceQuad, pkg.priceTriple, pkg.priceDouble].filter((p): p is number => p !== null);
    if (prices.length === 0) return 0;
    return Math.min(...prices);
  };

  return (
    <div className="w-full pt-6 pb-2">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Pilihan Unggulan</h2>
      </div>
      
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-4 pb-4">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/paket/${pkg.slug}`}
            className="w-[280px] shrink-0 snap-center bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden block"
          >
            <div className="aspect-[4/3] w-full bg-neutral-200 relative">
              {pkg.featuredImage ? (
                <img src={pkg.featuredImage} alt={pkg.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-tenant-primary/10 flex items-center justify-center">
                  <i className="ti ti-photo text-4xl text-tenant-primary/30"></i>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <i className="ti ti-star-filled"></i> Unggulan
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-semibold text-base line-clamp-2 mb-2 min-h-[3rem]">{pkg.name}</h3>
              <div className="text-xs text-neutral-500 mb-1">Mulai dari</div>
              <div className="text-tenant-primary font-bold text-lg">
                {formatPrice(getStartingPrice(pkg))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
