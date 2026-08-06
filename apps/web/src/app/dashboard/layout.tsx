'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
}

const UserContext = createContext<User | null>(null);

export function useUser() {
  return useContext(UserContext);
}

import { Sidebar } from './_components/Sidebar';
import { Topbar } from './_components/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <div className="flex h-screen bg-neutral-50 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
          <Topbar 
            onMenuToggle={() => setSidebarOpen(prev => !prev)} 
            collapsed={sidebarCollapsed}
            onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
