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
      
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-4 pb-4 scroll-pl-4">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/paket/${pkg.slug}`}
            className="w-[calc(45%-0.5rem)] shrink-0 snap-start bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden block"
          >
            <div className="aspect-square w-full bg-slate-100 relative">
              {pkg.featuredImage ? (
                <img
                  src={pkg.featuredImage}
                  alt={pkg.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                  <i className="ti ti-kaaba text-4xl opacity-50"></i>
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
