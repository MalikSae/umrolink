/**
 * PageContainer — wrapper konsisten untuk semua halaman /dashboard/*.
 * Referensi nilai: halaman Manajemen Paket (Sprint 3, §7 AGENTS.md).
 *
 * Penggunaan:
 *   <PageContainer>
 *     <h1>...</h1>
 *     ...konten halaman...
 *   </PageContainer>
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['w-full max-w-7xl mx-auto pb-8', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
