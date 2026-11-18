interface NewAthleteCoachAlertProps {
  isParticular: boolean;
  age: number | null;
}

export function NewAthleteCoachAlert({ isParticular, age }: NewAthleteCoachAlertProps) {
  if (!isParticular) return null;
  const isMinor = age !== null && age < 18;

  if (isMinor) {
    return (
      <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2">
        <span className="flex-shrink-0">⚠️</span>
        <span>
          <strong>Cadastro Bloqueado:</strong> Atleta menor de idade ({age} anos). O ECA Digital (Lei 15.211/2025) veda o cadastro de menores por treinadores particulares. Solicite ao responsável legal cadastrar o menor e indicar você como treinador.
        </span>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-center gap-2">
      <span className="flex-shrink-0">ℹ️</span>
      <span>
        <strong>Treinador Particular:</strong> O ECA Digital veda o cadastro de atletas menores de 18 anos por pessoa física. Menores devem ser cadastrados pelo responsável legal.
      </span>
    </div>
  );
}
