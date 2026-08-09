"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PackageGrid({ packages, onLoadMore, hasMore }: { packages: any[], onLoadMore?: () => void, hasMore?: boolean }) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onLoadMore, hasMore]);

  return (
    <div className="flex flex-col gap-4">
      {packages.map((pkg: any) => (
        <Link key={pkg.id} href={`/paket/${pkg.slug}`} className="group flex bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          {/* Image Left */}
          <div className="w-[120px] shrink-0 aspect-square bg-slate-100 relative">
            {pkg.featuredImage ? (
              <img src={pkg.featuredImage} alt={pkg.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                <i className="ti ti-kaaba text-4xl opacity-50"></i>
              </div>
            )}
          </div>
          
          {/* Content Right */}
          <div className="p-3 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2 leading-snug group-hover:text-tenant-primary transition-colors">
              {pkg.name}
            </h3>
            
            {pkg.priceQuad && (
              <div className="mt-2">
                <p className="text-[10px] text-slate-500 mb-0.5">Mulai dari</p>
                <p className="text-sm font-bold text-tenant-primary">
                  {formatCurrency(pkg.priceQuad)}
                </p>
              </div>
            )}
          </div>
        </Link>
      ))}
      
      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4 w-full" />
    </div>
  );
}
