import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@umrolink/ui';
import Link from 'next/link';

export default function CekBookingPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 pt-20">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Cek Booking</CardTitle>
          <CardDescription>Segera Hadir</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <i className="ti ti-clipboard-check text-2xl text-neutral-400"></i>
          </div>
          <p className="text-neutral-600 mb-6 text-sm">
            Fitur ini akan segera hadir — Anda akan bisa cek status pendaftaran langsung di sini.
          </p>
          <Link
            href="/"
            className="w-full bg-tenant-primary text-white font-semibold py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-tenant-primary/90 transition-colors"
          >
            <i className="ti ti-arrow-left"></i> Kembali ke Beranda
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
