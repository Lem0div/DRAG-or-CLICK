import { useMemo, useSyncExternalStore } from 'react';

export type Owner = { name: string; token: string };

const KEY = 'doc:owner';
const EVENT = 'doc:owner-changed';
const LOADING = '__loading__';

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(EVENT, cb);
  };
}

// undefined = 아직 확인 중, null = 이름 없음, Owner = 로그인 상태
export function useOwner(): Owner | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => LOADING);
  return useMemo(() => {
    if (raw === LOADING) return undefined;
    try {
      const o = JSON.parse(raw);
      if (typeof o?.name === 'string' && /^[a-f0-9]{64}$/.test(o.token)) {
        return o as Owner;
      }
    } catch {
      // 저장값이 깨졌으면 없는 걸로 취급
    }
    return null;
  }, [raw]);
}

export function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function saveOwner(owner: Owner) {
  localStorage.setItem(KEY, JSON.stringify(owner));
  window.dispatchEvent(new Event(EVENT));
}

export function clearOwner() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}