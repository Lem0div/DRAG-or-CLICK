import { NextResponse } from 'next/server';
import { admin, fail, hashToken, isValidToken } from '@/lib/server';
import { BUCKET } from '@/lib/config';

type Ctx = { params: Promise<{ id: string }> };

// 내 파일인지 확인
async function findOwned(id: string, token: unknown) {
  if (!isValidToken(token)) {
    return { error: fail('인증 정보가 올바르지 않아.', 401) };
  }
  const { data } = await admin()
    .from('files')
    .select('id, storage_path, owner_hash')
    .eq('id', id)
    .maybeSingle();
  if (!data || data.owner_hash !== hashToken(token)) {
    return { error: fail('내 파일이 아니거나 없는 파일이야.', 404) };
  }
  return { file: data };
}

// 업로드 완료 확정 (실제로 올라갔는지 확인하고 공개)
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const found = await findOwned(id, body?.token);
  const file = found.file;
  if (!file) return found.error!;

  const db = admin();
  const { data: objects } = await db.storage
    .from(BUCKET)
    .list('', { search: file.storage_path, limit: 1 });
  const object = objects?.find((o) => o.name === file.storage_path);
  if (!object) return fail('업로드된 파일을 찾지 못했어.', 400);

  // 신고한 크기 대신 실제 크기로 기록 (용량 계산 속임수 방지)
  const actual = Number(object.metadata?.size);
  const update: { ready: boolean; size?: number } = { ready: true };
  if (Number.isFinite(actual) && actual > 0) update.size = actual;

  await db.from('files').update(update).eq('id', id);
  return NextResponse.json({ ok: true });
}

// 삭제 (스토리지 파일 + DB 행)
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const found = await findOwned(id, body?.token);
  const file = found.file;
  if (!file) return found.error!;

  const db = admin();
  await db.storage.from(BUCKET).remove([file.storage_path]);
  await db.from('files').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}