"use client";

import { MapPin, Phone } from 'lucide-react';

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
    <div className="w-full px-4 py-8 border-t border-neutral-200 bg-white mt-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{tenant.name}</h2>
        <div className="text-sm text-neutral-500">Tentang Kami</div>
      </div>
        <div className="text-neutral-600 text-sm leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: tenant.description }} />
        
        <div className="space-y-4">
          {tenant.address && (
            <div className="flex items-start gap-3 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>{tenant.address}</span>
            </div>
          )}
          {tenant.phoneNumber && (
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`tel:${tenant.phoneNumber.replace(/[^0-9+]/g, '')}`} className="hover:text-tenant-primary transition-colors">
                {tenant.phoneNumber}
              </a>
            </div>
          )}
        </div>
    </div>
  );
}
