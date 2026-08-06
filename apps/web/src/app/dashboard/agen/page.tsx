'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Card,
  Tooltip,
  Alert,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@umrolink/ui';
import { useUser } from '../layout';
import { PageContainer } from '../_components/PageContainer';
import { Check, X } from 'lucide-react';

interface AgentProfile {
  id: string;
  phone: string;
  city: string;
  status: string;
  agentCode: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AgenPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    id: string;
    isPending?: boolean;
  } | null>(null);

  const user = useUser();
  const router = useRouter();

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    let url = '/api/agents';
    if (statusFilter !== 'all') {
      url += `?status=${statusFilter}`;
    }

    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (user && user.role !== 'travel_admin') {
      router.push('/dashboard');
      return;
    }
    fetchAgents();
  }, [user, router, fetchAgents]);

  const handleApprove = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/agents/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setSuccess('Agen berhasil disetujui');
        fetchAgents();
      } else {
        setError('Gagal menyetujui agen');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server');
    }
  };

  const handleReject = async (id: string, isPending: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/agents/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setSuccess('Pendaftaran agen berhasil ditolak');
        fetchAgents();
      } else {
        setError('Gagal menolak agen');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold leading-tight text-neutral-900">
          Approval & Registrasi Agen
        </h1>
      </div>

      {error && <Alert variant="danger" className="mb-6">{error}</Alert>}
      {success && <Alert variant="success" className="mb-6">{success}</Alert>}

      <Modal open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Konfirmasi</ModalTitle>
            <ModalDescription>
              {confirmAction?.type === 'approve' && 'Yakin ingin menyetujui agen ini?'}
              {confirmAction?.type === 'reject' && confirmAction.isPending && 'Yakin ingin menolak pendaftaran agen ini?'}
              {confirmAction?.type === 'reject' && !confirmAction.isPending && 'Yakin ingin menghapus agen ini?'}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Batal</Button>
            <Button
              variant={confirmAction?.type === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmAction?.type === 'approve') handleApprove(confirmAction.id);
                if (confirmAction?.type === 'reject') handleReject(confirmAction.id, confirmAction.isPending || false);
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === 'approve' ? 'Setujui' : 'Lanjutkan'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 transition-[border-color,box-shadow] w-full sm:w-48"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu Persetujuan</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* Desktop: tabel */}
      <Card className={`overflow-hidden p-0 hidden md:block transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>No. HP / WA</TableHead>
              <TableHead>Kota/Kabupaten</TableHead>
              <TableHead>Kode Agen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.user.name}</TableCell>
                <TableCell>{agent.user.email}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>{agent.city}</TableCell>
                <TableCell>{agent.agentCode || '-'}</TableCell>
                <TableCell>
                  <Badge variant={agent.status === 'active' ? 'success' : agent.status === 'pending' ? 'warning' : 'default'}>
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {agent.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <Tooltip content="Setujui">
                        <Button variant="outline" size="icon-sm" onClick={() => setConfirmAction({ type: 'approve', id: agent.id })} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                          <Check className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Tolak">
                        <Button variant="outline" size="icon-sm" onClick={() => setConfirmAction({ type: 'reject', id: agent.id, isPending: agent.status === 'pending' })} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                          <X className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-neutral-500 py-10">
                  Tidak ada data agen yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: card/stacked layout */}
      <div className={`space-y-3 md:hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {!loading && agents.length === 0 && (
          <Card className="p-6 text-center text-neutral-500">
            Tidak ada data agen.
          </Card>
        )}
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 leading-snug truncate">{agent.user.name}</p>
                <p className="text-sm text-neutral-500 truncate">{agent.user.email}</p>
              </div>
              <Badge variant={agent.status === 'active' ? 'success' : agent.status === 'pending' ? 'warning' : 'default'}>
                {agent.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600 mb-4 bg-slate-50 p-2 rounded-md">
              <div>
                <p className="text-xs text-neutral-400">Telepon</p>
                <p className="font-medium">{agent.phone}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Kota/Kab</p>
                <p className="font-medium">{agent.city}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-400">Kode Agen</p>
                <p className="font-medium">{agent.agentCode || '-'}</p>
              </div>
            </div>

            {agent.status === 'pending' && (
              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3">
                <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: 'reject', id: agent.id, isPending: agent.status === 'pending' })} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1">
                  <X className="h-4 w-4 mr-1" /> Tolak
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: 'approve', id: agent.id })} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 flex-1">
                  <Check className="h-4 w-4 mr-1" /> Setujui
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
