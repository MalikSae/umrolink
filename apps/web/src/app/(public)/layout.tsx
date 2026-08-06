import { headers } from 'next/headers';
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Metadata, Viewport } from 'next';
import { BottomNav } from './_components/BottomNav';
import { PublicShell } from './_components/PublicShell';

async function getTenantData() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  
  // We use internal absolute URL to bypass CDN/DNS in local/docker dev
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/public/tenant`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch tenant: ${res.statusText}`);
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching tenant:', err);
    return null;
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await getTenantData();
  const primary = tenant?.brandPrimaryColor || '#0d9488';
  return {
    themeColor: primary,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantData();
  if (!tenant) return {};
  return {
    appleWebApp: {
      capable: true,
      title: tenant.name,
      statusBarStyle: 'default',
    },
  };
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenantData();

  if (!tenant) {
    notFound();
  }

  // Define brand colors
  // Fallbacks are handled if they are null in DB
  const primary = tenant.brandPrimaryColor || '#0d9488'; // teal-600
  const secondary = tenant.brandSecondaryColor || '#14b8a6'; // teal-500
  const accent = tenant.brandAccentColor || '#0f766e'; // teal-700

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        :root {
          --tenant-primary: ${primary};
          --tenant-secondary: ${secondary};
          --tenant-accent: ${accent};
        }
      `}} />
      <PublicShell>
        <div className="flex-grow flex flex-col pb-20">
          <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-tenant-primary truncate">
                {tenant.name}
              </h1>
            </div>
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
          <footer className="bg-slate-900 text-white py-12 mt-auto">
            <div className="px-4 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
            </div>
          </footer>

          <BottomNav />
        </div>
      </PublicShell>
    </>
  );
}
