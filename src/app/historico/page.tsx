'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoricoPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Carregando...</div>
    </div>
  );
}