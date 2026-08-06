'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getApiUrl() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  return { apiUrl, host };
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { apiUrl, host } = await getApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get('umrolink_token')?.value;

  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${apiUrl}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'x-forwarded-host': host,
      'Content-Type': 'application/json',
    },
  });

  return res;
}

export async function getLeads() {
  try {
    const res = await fetchWithAuth('/api/leads');
    if (!res.ok) throw new Error('Failed to fetch leads');
    return await res.json();
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function confirmLead(id: string) {
  try {
    const res = await fetchWithAuth(`/api/leads/${id}/confirm`, {
      method: 'PATCH',
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Gagal mengonfirmasi booking' };
    }
    
    revalidatePath('/dashboard/bookings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
