'use server';

import { cookies, headers } from 'next/headers';

export async function submitLead(data: { packageId: string; name: string; phone: string }) {
  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const cookieStore = await cookies();
    const refCookie = cookieStore.get('umrolink_ref');
    const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-forwarded-host': host,
    };

    if (refCookie) {
      reqHeaders['Cookie'] = `umrolink_ref=${refCookie.value}`;
    }

    const res = await fetch(`${apiUrl}/api/public/leads`, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error submitting lead:', err);
    return { success: false, error: err.message };
  }
}
