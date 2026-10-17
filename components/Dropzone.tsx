'use client';

import { useRef, useState, type DragEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BUCKET, MAX_FILE_SIZE } from '@/lib/config';
import type { Owner } from '@/lib/owner';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default function Dropzone({ owner }: { owner: Owner }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const upload = async (file: File) => {
    setError(null);
    setLink(null);
    setCopied(false);

    if (file.size === 0) {
      setError('빈 파일은 올릴 수 없어.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('파일은 50MB까지만 올릴 수 있어.');
      return;
    }

    setUploading(true);
    let fileId: string | null = null;
    try {
      // 1) 서버가 용량을 검사하고 업로드 전용 주소를 발급
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          token: owner.token,
          ownerName: owner.name,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        }),
      });
      const init = await res.json();
      if (!res.ok) throw new Error(init.error ?? '업로드 준비에 실패했어.');
      fileId = init.id;

      // 2) 파일은 브라우저에서 Supabase로 바로 전송
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(init.path, init.uploadToken, file, {
          contentType: file.type || 'application/octet-stream',
        });
      if (upErr) throw new Error('업로드 중 문제가 생겼어. 다시 시도해줘.');

      // 3) 서버에 완료 알림 → 이때부터 공개
      const done = await fetch(`/api/files/${init.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ token: owner.token }),
      });
      if (!done.ok) throw new Error('업로드 확정에 실패했어. 다시 시도해줘.');

      setLink(`${window.location.origin}/f/${init.id}`);
    } catch (e) {
      if (fileId) {
        // 실패한 흔적 정리
        fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
          headers: JSON_HEADERS,
          body: JSON.stringify({ token: owner.token }),
        }).catch(() => {});
      }
      setError(e instanceof Error ? e.message : '업로드에 실패했어.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-xl">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition
          ${dragging ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-gray-500'}
          ${uploading ? 'cursor-wait opacity-60' : ''}`}
      >
        <p className="text-lg font-semibold">
          {uploading ? '업로드 중...' : '파일을 여기에 드롭하거나 클릭'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          최대 50MB · {owner.name} 님의 저장 공간(1GB)에 저장돼
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {link && (
        <div className="mt-4 rounded-xl border p-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={copyLink}
              className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
          <Link href="/me" className="mt-2 block text-xs text-gray-500 underline">
            내 파일에서 보기 / 삭제하기
          </Link>
        </div>
      )}
    </div>
  );
}