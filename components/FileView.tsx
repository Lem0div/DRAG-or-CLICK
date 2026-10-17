'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatSize, PICK } from '@/lib/config';

type FileRow = {
  id: string;
  name: string;
  size: number;
  likes: number;
  downloads: number;
  owner_name: string;
  created_at: string;
};

const COLUMNS = 'id, name, size, likes, downloads, owner_name, created_at';

export default function FileView() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileRow | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('files')
        .select(COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setStatus('notfound');
        return;
      }
      setFile(data as FileRow);
      setLiked(localStorage.getItem(`liked:${id}`) === '1');
      setStatus('ready');
    };

    load();
  }, [id]);

  const toggleLike = async () => {
    if (!file || busy) return;
    setBusy(true);

    const next = !liked;
    const { data, error } = await supabase.rpc('like_file', {
      file_id: file.id,
      delta: next ? 1 : -1,
    });

    if (!error && typeof data === 'number') {
      setFile({ ...file, likes: data });
      setLiked(next);
      if (next) localStorage.setItem(`liked:${file.id}`, '1');
      else localStorage.removeItem(`liked:${file.id}`);
    }
    setBusy(false);
  };

  if (status === 'loading') {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-gray-500">불러오는 중...</p>
      </main>
    );
  }

  if (status === 'notfound' || !file) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold">파일을 찾을 수 없어.</p>
        <Link href="/" className="text-sm underline">
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6">
        <p className="break-all text-2xl font-bold">{file.name}</p>
        <p className="mt-2 text-sm text-gray-500">
          {file.owner_name || '익명'} · {formatSize(file.size)} · 다운로드{' '}
          {file.downloads}회 · {new Date(file.created_at).toLocaleDateString('ko-KR')}
        </p>

        <div className="mt-6 flex gap-3">
          {/* /f/[id]/[id]로 이동해서 받고, 다 받으면 이 페이지로 돌아와 */}
          <Link
            href={`/f/${file.id}/${file.id}`}
            replace
            prefetch={false}
            className="flex-1 rounded-xl bg-black py-3 text-center font-semibold text-white"
          >
            다운로드
          </Link>
          <button
            onClick={toggleLike}
            disabled={busy}
            className={`rounded-xl border px-5 py-3 font-semibold transition ${
              liked ? 'border-amber-500 text-amber-600' : 'hover:bg-gray-50'
            }`}
          >
            {PICK.icon} {PICK.label} {file.likes}
          </button>
        </div>
      </div>
    </main>
  );
}