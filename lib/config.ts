export const BUCKET = 'files';
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 파일 1개 최대 50MB
export const QUOTA_BYTES = 1024 * 1024 * 1024; // 1인당 1GB

// 데스크톱 앱 설치 프로그램을 받는 사이트 주소로 바꿔줘
export const DESKTOP_APP_URL = '#';

// "좋아요" 대신 쓸 이름 — 여기만 바꾸면 화면 전체에 반영돼
export const PICK = { label: '픽', icon: '★' };

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}