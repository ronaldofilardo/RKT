'use client';

interface SignupBirthdateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function SignupBirthdateField({ value, onChange, error }: SignupBirthdateFieldProps) {
  return (
    <div>
      <label htmlFor="signup-athlete-birthdate" className="block text-xs font-medium text-telemetry-text-muted mb-1">
        Data de nascimento do atleta <span className="text-red-400">*</span>
      </label>
      <input
        id="signup-athlete-birthdate"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="w-full border border-telemetry-border/30 rounded-lg p-3 text-sm bg-telemetry-base text-telemetry-text-primary focus:outline-none focus:ring-2 focus:ring-telemetry-blue"
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
