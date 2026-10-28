'use client';

export function GestorError({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-md">
        <h2 className="font-bold mb-2">Erro</h2>
        <p>{error}</p>
      </div>
    </div>
  );
}
