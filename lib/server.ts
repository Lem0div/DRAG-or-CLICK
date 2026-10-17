import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

let client: SupabaseClient | null = null;

// 빌드 때 환경변수가 없어도 터지지 않게 처음 쓸 때 만들기
export function admin() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return client;
}

export const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export const isValidToken = (t: unknown): t is string =>
  typeof t === 'string' && /^[a-f0-9]{64}$/.test(t);

// DB에는 토큰 원본이 아니라 해시만 저장
export const hashToken = (t: string) =>
  createHash('sha256').update(t).digest('hex');

export async function getUsedBytes(ownerHash: string) {
  const { data, error } = await admin()
    .from('files')
    .select('size')
    .eq('owner_hash', ownerHash);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.size), 0);
}