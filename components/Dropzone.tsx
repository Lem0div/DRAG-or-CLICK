'use client';

import { useRef, useState, type DragEvent } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function Dropzone() {
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
    if (file.size > MAX_SIZE) {
      setError('파일은 50MB까지만 올릴 수 있어.');
      return;
    }

    setUploading(true);
    try {
      // 스토리지 키는 영문/숫자만 (한글 파일명 에러 방지), 원본 이름은 DB에 저장
      const ext = file.name.includes('.')
        ? file.name.split('.').pop()!.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
        : '';
      const storagePath = ext
        ? `${crypto.randomUUID()}.${ext}`
        : crypto.randomUUID();

      const { error: upErr } = await supabase.storage
        .from('files')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data, error: dbErr } = await supabase
        .from('files')
        .insert({
          name: file.name,
          size: file.size,
          mime_type: file.type || null,
          storage_path: storagePath,
        })
        .select('id')
        .single();
      if (dbErr) throw dbErr;

      setLink(`${window.location.origin}/f/${data.id}`);
    } catch (e) {
      console.error(e);
      setError('업로드에 실패했어. 잠시 후 다시 시도해줘.');
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
        <p className="mt-2 text-sm text-gray-500">최대 50MB · 로그인 필요 없음</p>
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
        <div className="mt-4 flex items-center gap-2 rounded-xl border p-3">
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
      )}
    </div>
  );
}