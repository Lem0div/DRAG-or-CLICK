import Dropzone from '@/components/Dropzone';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Drop Or Click</h1>
        <p className="mt-2 text-gray-500">
          파일을 드롭하면 무료 다운로드 링크가 만들어져.
        </p>
      </div>
      <Dropzone />
    </main>
  );
}