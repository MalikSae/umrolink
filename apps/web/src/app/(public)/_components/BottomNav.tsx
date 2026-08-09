'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, TicketsPlane, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Paket', href: '/paket', icon: CalendarDays },
    { name: 'WhatsApp', href: '#', isImage: true, imageSrc: '/whatsapp.png' },
    { name: 'Cek Booking', href: '/cek-booking', icon: TicketsPlane },
    { name: 'Akun', href: '/login', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white pb-safe mx-auto max-w-md shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.2)]">
      <div className="flex h-16 justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.isImage);
          
          if (item.isImage) {
            return (
              <a 
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center w-full h-full transition-transform hover:scale-105 z-10 relative"
              >
                <img src={item.imageSrc} alt={item.name} className="h-14 w-14 object-contain absolute -top-5 drop-shadow-md" />
              </a>
            );
          }

          const Icon = item.icon!;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-tenant-primary' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 rounded-b-full bg-tenant-primary" />
              )}
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
