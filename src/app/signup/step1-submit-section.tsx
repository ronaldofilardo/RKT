'use client';

interface Step1SubmitSectionProps {
  onNext: () => void;
  submitting: boolean;
}

export function Step1SubmitSection({ onNext, submitting }: Step1SubmitSectionProps) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onNext}
        disabled={submitting}
        className="bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-800 disabled:opacity-50"
      >
        Avançar para Responsável
      </button>
    </div>
  );
}
