export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

/** Fraca (<8), Média (8+ só letras/números) ou Forte (letras + números + especial). */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  if (password.length < 8) return 'weak';

  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLetters && hasNumbers && hasSpecial ? 'strong' : 'medium';
}

const LABELS: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
};

const COLORS: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'bg-telemetry-error',
  medium: 'bg-telemetry-alert',
  strong: 'bg-telemetry-volt',
};

const SEGMENTS = [0, 1, 2];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (strength === 'empty') return null;

  const filled = strength === 'weak' ? 1 : strength === 'medium' ? 2 : 3;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {SEGMENTS.map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${index < filled ? COLORS[strength] : 'bg-telemetry-border/20'}`}
          />
        ))}
      </div>
      <p role="status" className="mt-1 text-xs text-telemetry-text-muted">
        Força da senha: <span className="font-semibold text-telemetry-text-primary">{LABELS[strength]}</span>
      </p>
    </div>
  );
}
