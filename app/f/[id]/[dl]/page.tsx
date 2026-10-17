import { Suspense } from 'react';
import DownloadGateway from '@/components/DownloadGateway';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <p className="text-gray-500">준비 중...</p>
        </main>
      }
    >
      <DownloadGateway />
    </Suspense>
  );
}