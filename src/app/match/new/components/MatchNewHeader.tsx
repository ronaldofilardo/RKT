'use client';

import { useRouter } from 'next/navigation';

export function MatchNewHeader() {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10 safe-top">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Voltar</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate">Nova Partida</h1>
      </div>
    </header>
  );
}