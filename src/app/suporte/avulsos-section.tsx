'use client';

export function AvulsosSection() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contas Avulsas</h2>
      <p className="text-sm text-gray-500 mb-4">Usuários sem vínculo ativo a clubes/CTs.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Atletas Avulsos</h3>
          <p className="text-xs text-gray-500">Atletas sem registro em PlayerCT.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Treinadores Avulsos</h3>
          <p className="text-xs text-gray-500">Treinadores sem ctId ativo.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Espectadores Avulsos</h3>
          <p className="text-xs text-gray-500">Usuários sem vínculos a CTs.</p>
        </div>
      </div>
    </div>
  );
}
