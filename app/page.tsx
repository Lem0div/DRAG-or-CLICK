import HomeLists from '@/components/HomeLists';
import { DESKTOP_APP_URL } from '@/lib/config';

export default function Home() {
  const external = DESKTOP_APP_URL.startsWith('http');

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
      <a
        href={DESKTOP_APP_URL}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="flex items-center justify-between rounded-[2rem] bg-[#222] px-8 py-8 text-white transition hover:bg-[#2c2c2c] sm:px-12"
      >
        <div>
          <p className="text-2xl font-bold sm:text-3xl">
            데스크톱 앱으로도 쓸 수 있어요
          </p>
          <p className="mt-2 text-sm text-gray-300">
            설치 프로그램 다운로드 페이지로 이동해요 →
          </p>
        </div>
        <span className="text-6xl" aria-hidden>
          🖥️
        </span>
      </a>

      <HomeLists />
    </main>
  );
}