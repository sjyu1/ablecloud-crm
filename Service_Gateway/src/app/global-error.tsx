'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              치명적인 오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              {error.message || '시스템에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'}
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 