'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Phone } from 'lucide-react';
import { Button, Input, Card, Alert, Combobox } from '@umrolink/ui';
import { kabupatenKota } from '@umrolink/types';

export default function RegisterAgentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/public/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, city }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Validation errors usually come as arrays in NextJS/NestJS
        if (data.message && Array.isArray(data.message)) {
          setError(data.message.join(', '));
        } else {
          setError(data.message || 'Terjadi kesalahan saat mendaftar');
        }
        setLoading(false);
        return;
      }
      
      router.push('/daftar-agen/sukses');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto bg-tenant-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-tenant-primary" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Daftar Menjadi Agen</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Isi formulir di bawah ini untuk bergabung menjadi agen travel kami.
          </p>
        </div>
        
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Misal: Budi Santoso"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="budi@example.com"
          />

          <Input
            id="phone"
            type="tel"
            label="Nomor WhatsApp/HP"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
            pattern="[0-9]*"
            placeholder="08123456789"
            leftIcon={<Phone className="h-4 w-4 text-neutral-400" />}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700">
              Kota/Kabupaten <span className="text-danger">*</span>
            </label>
            <Combobox
              options={kabupatenKota.map((c) => ({ value: c.name, label: c.name }))}
              value={city}
              onChange={setCity}
              placeholder="Pilih kota/kabupaten..."
            />
          </div>

          <Input
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Button type="submit" className="w-full mt-4" disabled={loading || !city}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>
          
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-500">
              Sudah punya akun?{' '}
              <a href="/login" className="text-tenant-primary hover:underline font-medium">
                Login di sini
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
