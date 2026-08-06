import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'edge';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

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

export default async function Icon() {
  const tenant = await getTenantData();
  const name = tenant?.name || 'U';
  const firstLetter = name.charAt(0).toUpperCase();
  const bgColor = tenant?.brandPrimaryColor || '#0d9488';

  return new ImageResponse(
    (
      <div
        style={{
          background: bgColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 256,
          fontWeight: 'bold',
          borderRadius: 100, // Make it a circle inside the square or just a rounded square
        }}
      >
        {firstLetter}
      </div>
    ),
    {
      ...size,
    }
  );
}
