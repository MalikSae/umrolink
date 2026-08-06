import { CheckCircle2 } from 'lucide-react';
import { Card, Button } from '@umrolink/ui';
import Link from 'next/link';

export default function RegisterAgentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <Card className="w-full max-w-md p-8 text-center bg-surface shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-success/10 rounded-full">
            <CheckCircle2 className="h-16 w-16 text-success" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-[var(--color-foreground)]">Pendaftaran Berhasil</h1>
        <p className="text-neutral-600 mb-8">
          Terima kasih sudah mendaftar. Tim kami akan meninjau pendaftaran Anda dan menghubungi lewat WhatsApp begitu disetujui.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </Card>
    </div>
  );
}
