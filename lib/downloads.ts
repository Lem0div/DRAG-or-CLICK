import { supabase } from '@/lib/supabase';

// supabase 쿼리는 await하거나 .then()을 불러야 실제로 요청이 나가.
// 다운로드는 링크 이동과 같이 일어나니까 기다리지 않고 .then()으로 바로 쏘기만 해.
export function countDownload(fileId: string) {
  supabase.rpc('count_download', { file_id: fileId }).then(({ error }) => {
    if (error) console.error('다운로드 수 기록 실패:', error.message);
  });
}