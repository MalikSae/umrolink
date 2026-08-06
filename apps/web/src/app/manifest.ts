import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

async function getTenantData() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${apiUrl}/api/public/tenant`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      return res.json();
    }
  } catch (err) {}
  
  return null;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await getTenantData();
  
  const name = tenant?.name || 'Umrolink';
  const themeColor = tenant?.brandPrimaryColor || '#0d9488';
  
  return {
    name: name,
    short_name: name,
    description: `Aplikasi ${name}`,
    start_url: '/',
    display: 'standalone',
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
