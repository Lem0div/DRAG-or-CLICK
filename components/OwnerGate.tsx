'use client';

import { useState, type ReactNode } from 'react';
import { newToken, saveOwner, useOwner, type Owner } from '@/lib/owner';

export default function OwnerGate({
  children,
}: {
  children: (owner: Owner) => ReactNode;
}) {
  const owner = useOwner();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (owner === undefined) {
    return <p className="p-10 text-center text-gray-500">불러오는 중...</p>;
  }
  if (owner) return <>{children(owner)}</>;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('이름을 적어줘.');
      return;
    }
    const restore = code.trim().toLowerCase();
    if (restore && !/^[a-f0-9]{64}$/.test(restore)) {
      setError('복구 코드가 올바르지 않아.');
      return;
    }
    // 복구 코드가 있으면 그 코드로, 없으면 새로 만들어서 시작
    saveOwner({ name: trimmed.slice(0, 20), token: restore || newToken() });
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border p-6">
      <h1 className="text-xl font-bold">먼저 이름을 정해줘</h1>
      <p className="mt-2 text-sm text-gray-500">
        로그인 없이 이 이름과 브라우저에 저장되는 비밀 코드로 내 파일을 구분해.
        저장 공간은 1인당 1GB야.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        maxLength={20}
        placeholder="이름 (최대 20자)"
        className="mt-4 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
      />

      <details className="mt-3 text-sm text-gray-500">
        <summary className="cursor-pointer">이미 쓰던 복구 코드가 있어?</summary>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="복구 코드 (64자)"
          className="mt-2 w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-black"
        />
      </details>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        className="mt-4 w-full rounded-xl bg-black py-3 font-semibold text-white"
      >
        시작하기
      </button>
    </div>
  );
}