import { getLeads } from './actions';
import ClientPage from './ClientPage';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

export const metadata = {
  title: 'Manajemen Booking - Umrolink',
};

export default async function BookingsPage() {
  const leads = await getLeads();

  const cookieStore = await cookies();
  const token = cookieStore.get('umrolink_token')?.value;
  let userRole = '';
  
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userRole = decoded.role;
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Booking</h1>
        <p className="text-slate-600 mt-1">
          {userRole === 'agent' 
            ? 'Kelola data booking dari jamaah referal Anda.' 
            : 'Kelola data booking jamaah yang masuk, konfirmasi pembayaran dan status.'}
        </p>
      </div>
      
      <ClientPage initialLeads={leads} userRole={userRole} />
    </div>
  );
}
