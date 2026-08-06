'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ClipboardCheck, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Paket', href: '/paket', icon: Package },
    { name: 'Cek Booking', href: '/cek-booking', icon: ClipboardCheck },
    { name: 'Akun', href: '/login', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe mx-auto max-w-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex h-16 justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-tenant-primary' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
