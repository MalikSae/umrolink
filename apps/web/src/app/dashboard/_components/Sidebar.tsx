'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, X, Users, Settings } from 'lucide-react';
import { useUser } from '../layout';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
}

function SidebarContent({ onClose, collapsed }: { onClose?: () => void; collapsed: boolean }) {
  const pathname = usePathname();
  const user = useUser();

  const getMenuItems = () => {
    const role = user?.role;
    
    // Default item for everyone
    const items = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (role === 'travel_admin') {
      items.push(
        { href: '/dashboard/packages', label: 'Manajemen Paket', icon: Package },
        { href: '/dashboard/agen', label: 'Manajemen Agen', icon: Users },
      );
    }
    
    return items;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Logo area */}
      <div className={`flex items-center h-16 border-b border-white/10 shrink-0 ${collapsed ? 'justify-center px-4' : 'justify-between px-6'}`}>
        {!collapsed && <h2 className="text-xl font-bold text-white">Umrolink</h2>}
        {collapsed && <span className="text-xl font-bold text-white">U</span>}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden text-white/70 hover:text-white transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="block" onClick={onClose}>
              <div
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-md text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center w-full p-2.5' : 'w-full px-4 py-2'
                } ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${collapsed ? '' : 'mr-2'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ open, onClose, collapsed }: SidebarProps) {
  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-primary text-white flex flex-col
          transform transition-all duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-auto md:shrink-0
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <SidebarContent onClose={onClose} collapsed={collapsed} />
      </aside>
    </>
  );
}
