import { ReactNode } from 'react';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-surface shadow-2xl relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
