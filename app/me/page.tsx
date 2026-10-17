'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import OwnerGate from '@/components/OwnerGate';
import { clearOwner, type Owner } from '@/lib/owner';
import { formatSize, PICK, QUOTA_BYTES } from '@/lib/config';

type Row = {
  id: string;
  name: string;
  size: number;
  likes: number;
  downloads: number;
  created_at: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function MyFiles({ owner }: { owner: Owner }) {
  const [files, setFiles] = useState<Row[] | null>(null);
  const [used, setUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/files/mine', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ token: owner.token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? '불러오지 못했어.');
      return;
    }
    setError(null);
    setFiles(data.files);
    setUsed(data.used);
  }, [owner.token]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (file: Row) => {
    if (!confirm(`"${file.name}" 파일을 삭제할까? 링크도 같이 사라져.`)) return;
    const res = await fetch(`/api/files/${file.id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
      body: JSON.stringify({ token: owner.token }),
    });
    if (!res.ok) {
      setError('삭제에 실패했어.');
      return;
    }
    load();
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const logout = () => {
    if (
      confirm(
        '이 브라우저에서 로그아웃할까? 복구 코드를 따로 저장해두지 않았다면 내 파일을 다시 관리할 수 없어.'
      )
    ) {
      clearOwner();
    }
  };

  const percent = Math.min(100, (used / QUOTA_BYTES) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{owner.name} 님의 파일</h1>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-black" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {formatSize(used)} / {formatSize(QUOTA_BYTES)} 사용 중
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {files === null ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center text-gray-500">
          아직 올린 파일이 없어.{' '}
          <Link href="/add" className="underline">
            파일 추가하러 가기
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/f/${file.id}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {file.name}
                </Link>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSize(file.size)} · {PICK.icon} {file.likes} · 다운로드{' '}
                  {file.downloads}회 ·{' '}
                  {new Date(file.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() =>
                  copy(file.id, `${window.location.origin}/f/${file.id}`)
                }
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                {copiedKey === file.id ? '복사됨!' : '링크 복사'}
              </button>
              <button
                onClick={() => remove(file)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border p-5 text-sm">
        <p className="font-semibold">복구 코드</p>
        <p className="mt-1 text-gray-500">
          이 코드가 내 계정 열쇠야. 다른 기기나 브라우저에서 내 파일을 관리하려면
          이름을 정할 때 이 코드를 넣으면 돼. 다른 사람에게 알려주지 마.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={owner.token}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-xs"
          />
          <button
            onClick={() => copy('token', owner.token)}
            className="rounded-lg bg-black px-3 py-2 text-white"
          >
            {copiedKey === 'token' ? '복사됨!' : '복사'}
          </button>
        </div>
        <button onClick={logout} className="mt-3 text-gray-500 underline">
          이 브라우저에서 로그아웃
        </button>
      </div>
    </div>
  );
}

export default function MePage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl p-6">
      <OwnerGate>{(owner) => <MyFiles owner={owner} />}</OwnerGate>
    </main>
  );
}