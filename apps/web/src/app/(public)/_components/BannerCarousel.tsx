"use client";

import { useState, UIEvent } from 'react';

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
  const [activeIndex, setActiveIndex] = useState(0);

  if (!banners || banners.length === 0) {
    return null;
  }

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    // Determine which banner is most visible
    const scrollLeft = e.currentTarget.scrollLeft;
    // We add gap width to clientWidth if we had a gap, but wait...
    // The items are w-full and the container has padding.
    // Let's use simple rounding based on a single item's approximate width.
    // Actually, clientWidth includes padding. The item width is clientWidth - padding.
    const containerWidth = e.currentTarget.clientWidth;
    const index = Math.round(scrollLeft / containerWidth);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full relative flex flex-col">
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 gap-4 scroll-pl-4"
        onScroll={handleScroll}
      >
        {banners.map((banner, index) => (
          <div key={banner.id} className="w-[calc(100%-2rem)] shrink-0 snap-center relative">
            <div className="aspect-video w-full bg-neutral-200 relative overflow-hidden rounded-2xl shadow-sm">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-tenant-primary/20 flex items-center justify-center">
                  <span className="text-tenant-primary text-2xl font-bold">{banner.title}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination dots */}
      <div className="flex justify-center mt-4 gap-1.5">
        {banners.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-4 bg-tenant-primary' : 'w-1.5 bg-slate-200'}`}
          />
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
