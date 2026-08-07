import { Metadata } from 'next';
import ClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Manajemen Komisi | Umrolink',
};

export default function CommissionsPage() {
  return <ClientPage />;
}
