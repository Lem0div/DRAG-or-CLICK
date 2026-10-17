import { NextResponse } from 'next/server';
import { admin, fail, hashToken, isValidToken } from '@/lib/server';
import { QUOTA_BYTES } from '@/lib/config';

// 토큰을 URL에 노출하지 않으려고 GET 대신 POST를 써
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!isValidToken(body?.token)) return fail('인증 정보가 올바르지 않아.', 401);

  const { data, error } = await admin()
    .from('files')
    .select('id, name, size, likes, downloads, created_at, ready')
    .eq('owner_hash', hashToken(body.token))
    .order('created_at', { ascending: false });
  if (error) return fail('목록을 불러오지 못했어.', 500);

  const rows = data ?? [];
  const used = rows.reduce((sum, r) => sum + Number(r.size), 0);

  return NextResponse.json({
    files: rows.filter((r) => r.ready),
    used,
    limit: QUOTA_BYTES,
  });
}