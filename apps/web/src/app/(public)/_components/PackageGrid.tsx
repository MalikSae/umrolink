import Link from 'next/link';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PackageGrid({ packages }: { packages: any[] }) {
  if (packages.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-lg">Belum ada paket umrah yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {packages.map((pkg: any) => (
        <Link key={pkg.id} href={`/paket/${pkg.slug}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="aspect-square bg-slate-100 overflow-hidden relative">
            {pkg.featuredImage ? (
              <img src={pkg.featuredImage} alt={pkg.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Tidak ada gambar
              </div>
            )}
            {pkg.priceQuad && (
              <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                <p className="text-[10px] font-medium text-slate-500">Mulai dari</p>
                <p className="text-sm font-bold text-tenant-primary truncate">
                  {formatCurrency(pkg.priceQuad)}
                </p>
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-tenant-primary transition-colors min-h-[2.5rem]">
              {pkg.name}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
