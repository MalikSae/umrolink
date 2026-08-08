import { Metadata } from 'next';
import DeparturesClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Keberangkatan | Dashboard Umrolink',
};

export default function DeparturesPage() {
  return <DeparturesClientPage />;
}
