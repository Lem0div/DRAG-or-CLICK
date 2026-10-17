import { NextResponse } from 'next/server';
import { admin, fail, getUsedBytes, hashToken, isValidToken } from '@/lib/server';
import { BUCKET, MAX_FILE_SIZE, QUOTA_BYTES } from '@/lib/config';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { token, ownerName, name, size, mimeType } = body ?? {};

  if (!isValidToken(token)) return fail('인증 정보가 올바르지 않아.', 401);

  const owner = String(ownerName ?? '').trim().slice(0, 20);
  const fileName = String(name ?? '').trim().slice(0, 200);
  const fileSize = Number(size);

  if (!owner || !fileName) return fail('이름 정보가 비어 있어.', 400);
  if (!Number.isFinite(fileSize) || fileSize <= 0) return fail('잘못된 파일 크기야.', 400);
  if (fileSize > MAX_FILE_SIZE) return fail('파일은 50MB까지만 올릴 수 있어.', 413);

  const ownerHash = hashToken(token);
  const db = admin();

  // 업로드가 끝나지 않은 채 1시간 지난 흔적 정리
  await db
    .from('files')
    .delete()
    .eq('owner_hash', ownerHash)
    .eq('ready', false)
    .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const used = await getUsedBytes(ownerHash);
  if (used + fileSize > QUOTA_BYTES) {
    return fail('저장 공간(1GB)이 부족해. 내 파일에서 정리해줘.', 413);
  }

  // 스토리지 키는 영문/숫자만 (한글 파일명 에러 방지), 원본 이름은 DB에 저장
  const ext = fileName.includes('.')
    ? fileName.split('.').pop()!.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
    : '';
  const storagePath = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID();

  const { data: signed, error: signErr } = await db.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);
  if (signErr || !signed) return fail('업로드 준비에 실패했어.', 500);

  const { data: row, error: insErr } = await db
    .from('files')
    .insert({
      name: fileName,
      size: fileSize,
      mime_type: typeof mimeType === 'string' ? mimeType.slice(0, 100) : null,
      storage_path: storagePath,
      owner_hash: ownerHash,
      owner_name: owner,
      ready: false,
    })
    .select('id')
    .single();
  if (insErr || !row) return fail('파일 정보를 저장하지 못했어.', 500);

  return NextResponse.json({
    id: row.id,
    path: signed.path,
    uploadToken: signed.token,
  });
}