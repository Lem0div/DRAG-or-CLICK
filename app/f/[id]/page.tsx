import { Suspense } from 'react';
import FileView from '@/components/FileView';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">불러오는 중...</p>
        </main>
      }
    >
      <FileView />
    </Suspense>
  );
}