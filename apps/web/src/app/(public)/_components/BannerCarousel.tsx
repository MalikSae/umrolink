"use client";

import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  packageId: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative group">
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {banners.map((banner, index) => (
          <div key={banner.id} className="w-full shrink-0 snap-center relative">
            <div className="aspect-video w-full bg-neutral-200 relative overflow-hidden">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-tenant-primary/20 flex items-center justify-center">
                  <span className="text-tenant-primary text-2xl font-bold">{banner.title}</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 text-white">
                <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                {banner.subtitle && <p className="text-sm text-neutral-200 mb-3">{banner.subtitle}</p>}
                <Link
                  href={banner.packageId ? `/paket/${banner.packageId}` : '/paket'}
                  className="bg-tenant-primary text-white text-sm font-semibold py-2 px-4 rounded-md self-start inline-block"
                >
                  {banner.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
