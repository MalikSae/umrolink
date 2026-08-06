'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '../layout';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@umrolink/ui';
import { LogOut, ChevronDown, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

export function Topbar({ onMenuToggle, collapsed, onCollapseToggle }: TopbarProps) {
  const user = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-16 bg-surface border-b border-neutral-200 flex items-center px-4 md:px-4 sticky top-0 z-10">
      {/* Mobile: hamburger */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop: collapse/expand toggle */}
      <button
        onClick={onCollapseToggle}
        className="hidden md:flex p-2 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        aria-label={collapsed ? 'Perluas sidebar' : 'Sembunyikan sidebar'}
        title={collapsed ? 'Perluas sidebar' : 'Sembunyikan sidebar'}
      >
        {collapsed
          ? <PanelLeftOpen className="h-5 w-5" />
          : <PanelLeftClose className="h-5 w-5" />
        }
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 focus:outline-none hover:bg-neutral-50 p-2 rounded-md transition-colors">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 text-sm">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-neutral-900 leading-none">{user?.name}</span>
            <span className="text-xs text-neutral-500 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-1">
          <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
