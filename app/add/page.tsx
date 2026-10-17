'use client';

import Dropzone from '@/components/Dropzone';
import OwnerGate from '@/components/OwnerGate';

export default function AddPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 p-6">
      <OwnerGate>
        {(owner) => (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold">파일 추가</h1>
              <p className="mt-2 text-gray-500">
                파일을 드롭하면 무료 다운로드 링크가 만들어져.
              </p>
            </div>
            <Dropzone owner={owner} />
          </>
        )}
      </OwnerGate>
    </main>
  );
}