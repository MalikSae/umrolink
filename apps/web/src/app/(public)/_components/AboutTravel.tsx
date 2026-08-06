"use client";

interface AboutTravelProps {
  tenant: {
    name: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
  };
}

export function AboutTravel({ tenant }: AboutTravelProps) {
  if (!tenant.description) {
    return null;
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-tenant-primary/10 rounded-full flex items-center justify-center shrink-0">
            <i className="ti ti-building-store text-2xl text-tenant-primary"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">{tenant.name}</h2>
            <div className="text-sm text-neutral-500">Tentang Kami</div>
          </div>
        </div>
        
        <div className="text-neutral-600 text-sm leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: tenant.description }} />
        
        <div className="space-y-3">
          {tenant.address && (
            <div className="flex items-start gap-3 text-sm text-neutral-600">
              <i className="ti ti-map-pin text-tenant-primary mt-0.5 shrink-0"></i>
              <span>{tenant.address}</span>
            </div>
          )}
          {tenant.phoneNumber && (
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <i className="ti ti-phone text-tenant-primary shrink-0"></i>
              <a href={`tel:${tenant.phoneNumber.replace(/[^0-9+]/g, '')}`} className="hover:text-tenant-primary transition-colors">
                {tenant.phoneNumber}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
