'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { countDownload } from '@/lib/downloads';
import { BUCKET, formatSize } from '@/lib/config';

type FileRow = {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
};

type Phase = 'loading' | 'downloading' | 'done' | 'error';

const COLUMNS = 'id, name, size, mime_type, storage_path';

export default function DownloadGateway() {
  const { id, dl } = useParams<{ id: string; dl: string }>();
  const router = useRouter();
  const started = useRef(false);

  const [phase, setPhase] = useState<Phase>('loading');
  const [file, setFile] = useState<FileRow | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [saveUrl, setSaveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id || started.current) return;
    started.current = true;

    // /f/[id]/[id] 모양이 아니면 그냥 파일 페이지로 돌려보냄
    if (dl !== id) {
      router.replace(`/f/${id}`);
      return;
    }

    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('files')
          .select(COLUMNS)
          .eq('id', id)
          .maybeSingle();

        if (error || !data) {
          setMessage('파일을 찾을 수 없어.');
          setPhase('error');
          return;
        }
        const row = data as FileRow;
        setFile(row);
        setPhase('downloading');

        // 끝까지 받았는지 알 수 있게 직접 받아서 진행률을 계산
        const url = supabase.storage
          .from(BUCKET)
          .getPublicUrl(row.storage_path).data.publicUrl;
        const res = await fetch(url);
        if (!res.ok || !res.body) throw new Error('다운로드 요청이 거절됐어.');

        const total = Number(res.headers.get('content-length')) || row.size;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value as BlobPart);
          received += value.length;
          setProgress(Math.min(100, Math.round((received / total) * 100)));
        }

        // 전부 받았으면 원래 파일 이름으로 저장
        const blob = new Blob(chunks, {
          type: row.mime_type || 'application/octet-stream',
        });
        const objectUrl = URL.createObjectURL(blob);
        setSaveUrl(objectUrl);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = row.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

        countDownload(row.id);
        setProgress(100);
        setPhase('done');

        // 완료되면 파일 페이지로 돌아가기 (그 사이에 다른 곳으로 갔으면 건드리지 않음)
        setTimeout(() => {
          if (window.location.pathname === `/f/${row.id}/${row.id}`) {
            router.replace(`/f/${row.id}`);
          }
        }, 2000);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : '다운로드에 실패했어.');
        setPhase('error');
      }
    };

    run();
  }, [id, dl, router]);

  const directUrl = file
    ? supabase.storage
        .from(BUCKET)
        .getPublicUrl(file.storage_path, { download: file.name }).data.publicUrl
    : null;

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6 text-center">
        {phase === 'error' ? (
          <>
            <p className="text-xl font-semibold">다운로드하지 못했어</p>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
            <div className="mt-5 flex justify-center gap-3 text-sm">
              {directUrl && (
                <a href={directUrl} className="rounded-lg bg-black px-4 py-2 text-white">
                  직접 받기
                </a>
              )}
              <Link href={`/f/${id}`} className="rounded-lg border px-4 py-2">
                파일 페이지로
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold">
              {phase === 'done' ? '다운로드 완료!' : '다운로드 중...'}
            </p>
            <p className="mt-2 break-all text-sm text-gray-500">
              {file ? `${file.name} · ${formatSize(file.size)}` : '파일 정보를 불러오는 중'}
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{progress}%</p>

            {phase === 'done' && (
              <p className="mt-4 text-sm text-gray-500">
                잠시 후 파일 페이지로 돌아가요.{' '}
                {saveUrl && file && (
                  <a href={saveUrl} download={file.name} className="underline">
                    저장이 안 됐다면 여기를 눌러줘
                  </a>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}