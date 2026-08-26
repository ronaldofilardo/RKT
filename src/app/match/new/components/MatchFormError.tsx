'use client';

export function MatchFormError({ error, missingFields }: { error: string | null; missingFields: string[] }) {
  if (!error) return null;
  return <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2"><span className="text-red-500 mt-0.5">⚠️</span><div><p className="font-medium">Erro</p><p>{error}</p>{missingFields.length > 0 && <ul className="mt-1 text-xs text-red-600 list-disc list-inside">{missingFields.map((field) => <li key={field}>Falta: {field}</li>)}</ul>}</div></div>;
}
