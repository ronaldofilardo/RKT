'use client';

import { formatCpf } from '@/lib/validators/cpf.validator';

interface ConviteGuardianFieldsProps {
  guardianName: string;
  setGuardianName: (v: string) => void;
  guardianCpf: string;
  setGuardianCpf: (v: string) => void;
  relationship: string;
  setRelationship: (v: string) => void;
  preGuardianCpfMasked?: string | null;
}

export function ConviteGuardianFields({
  guardianName, setGuardianName,
  guardianCpf, setGuardianCpf,
  relationship, setRelationship,
  preGuardianCpfMasked,
}: ConviteGuardianFieldsProps) {
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCpf(raw);
    setGuardianCpf(formatted);
  };

  return (
    <div className="bg-telemetry-elevated/20 border border-telemetry-border/30 rounded-xl p-3.5 space-y-3">
      <div>
        <span className="text-xs font-semibold block text-telemetry-text-primary">
          Seus Dados Pessoais (Responsável Legal):
        </span>
        <p className="text-[11px] text-telemetry-text-muted mt-0.5">
          Insira seu nome completo e CPF para cruzamento e validação de segurança com o cadastro do clube.
        </p>
        {preGuardianCpfMasked && (
          <span className="inline-block mt-1 text-[11px] text-telemetry-blue bg-telemetry-blue/10 px-2 py-0.5 rounded font-mono">
            ℹ️ CPF cadastrado pelo clube: {preGuardianCpfMasked}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <label htmlFor="guardianName" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
            Nome Completo do Responsável <span className="text-rose-400">*</span>
          </label>
          <input
            id="guardianName"
            type="text"
            required
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            placeholder="Ex: João Carlos da Silva"
            className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2 text-xs text-telemetry-text-primary focus:border-telemetry-blue focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="guardianCpf" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
              CPF do Responsável <span className="text-rose-400">*</span>
            </label>
            <input
              id="guardianCpf"
              type="text"
              required
              value={guardianCpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2 text-xs font-mono text-telemetry-text-primary focus:border-telemetry-blue focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="relationship" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
              Grau de Parentesco <span className="text-rose-400">*</span>
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2 text-xs text-telemetry-text-primary focus:border-telemetry-blue focus:outline-none"
            >
              <option value="PAI">Pai</option>
              <option value="MAE">Mãe</option>
              <option value="TUTOR_LEGAL">Tutor(a) Legal</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
