import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Drop Or Click',
  description: '파일을 드롭하면 무료 다운로드 링크가 만들어져요.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Suspense fallback={<div className="h-14 border-b" />}>
          <TopBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}