'use client';

interface Step2ActionsProps {
  onBack: () => void;
  submitting: boolean;
}

export function Step2Actions({ onBack, submitting }: Step2ActionsProps) {
  return (
    <div className="flex justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        ← Voltar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-800 disabled:opacity-50"
      >
        {submitting ? 'Cadastrando...' : 'Concluir Cadastro do Clube'}
      </button>
    </div>
  );
}
