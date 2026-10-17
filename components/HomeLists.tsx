'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { countDownload } from '@/lib/downloads';
import { BUCKET, formatSize, PICK } from '@/lib/config';

type FileRow = {
  id: string;
  name: string;
  size: number;
  storage_path: string;
  likes: number;
  downloads: number;
  owner_name: string;
};

const COLUMNS = 'id, name, size, storage_path, likes, downloads, owner_name';

function FileCard({
  file,
  onDownload,
}: {
  file: FileRow;
  onDownload: (id: string) => void;
}) {
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.slice(0, 5).toUpperCase()
    : 'FILE';

  const url = supabase.storage
    .from(BUCKET)
    .getPublicUrl(file.storage_path, { download: file.name }).data.publicUrl;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/f/${file.id}`} className="block">
        <div className="relative flex h-32 items-center justify-center bg-gray-900 text-3xl font-bold tracking-wider text-white">
          {ext}
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium">
            {formatSize(file.size)}
          </span>
        </div>
        <div className="p-4">
          <p className="truncate font-semibold">{file.name}</p>
          <p className="mt-1 truncate text-sm text-gray-500">
            {file.owner_name || '익명'}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-4 border-t px-4 py-3 text-sm text-gray-500">
        <span>
          {PICK.icon} {file.likes}
        </span>
        <span>⬇ {file.downloads}</span>
        <a
          href={url}
          onClick={() => onDownload(file.id)}
          className="ml-auto rounded-lg bg-black px-3 py-1 font-medium text-white"
        >
          받기
        </a>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  files,
  onDownload,
}: {
  title: string;
  desc: string;
  files: FileRow[] | null;
  onDownload: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-gray-500">{desc}</p>

      {files === null ? (
        <p className="mt-6 text-gray-500">불러오는 중...</p>
      ) : files.length === 0 ? (
        <p className="mt-6 text-gray-500">아직 파일이 없어.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onDownload={onDownload} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomeLists() {
  const [byLikes, setByLikes] = useState<FileRow[] | null>(null);
  const [byDownloads, setByDownloads] = useState<FileRow[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const [likes, downloads] = await Promise.all([
        supabase
          .from('files')
          .select(COLUMNS)
          .order('likes', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('files')
          .select(COLUMNS)
          .order('downloads', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8),
      ]);
      setByLikes((likes.data ?? []) as FileRow[]);
      setByDownloads((downloads.data ?? []) as FileRow[]);
    };
    load();
  }, []);

  const handleDownload = (id: string) => {
    countDownload(id);
    const bump = (list: FileRow[] | null) =>
      list &&
      list.map((f) => (f.id === id ? { ...f, downloads: f.downloads + 1 } : f));
    setByLikes((prev) => bump(prev));
    setByDownloads((prev) => bump(prev));
  };

  return (
    <div className="space-y-14">
      <Section
        title={`가장 많은 ${PICK.label}`}
        desc="사람들이 가장 많이 골라둔 파일이에요."
        files={byLikes}
        onDownload={handleDownload}
      />
      <Section
        title="가장 많은 다운로드 수"
        desc="가장 많이 받아간 파일이에요."
        files={byDownloads}
        onDownload={handleDownload}
      />
    </div>
  );
}