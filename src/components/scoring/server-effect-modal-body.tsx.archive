import type { ServerEffectContext } from './server-effect-modal.types';
import { PillGroup, Section, EFFECT_OPTIONS, DIRECTION_OPTIONS } from './server-effect-modal-controls';

interface ServerEffectModalBodyProps {
  context: ServerEffectContext;
  effect: string | null;
  direction: string | null;
  onEffectChange: (v: string) => void;
  onDirectionChange: (v: string) => void;
  isDoubleFault: boolean;
}

export function ServerEffectModalBody({
  context,
  effect,
  direction,
  onEffectChange,
  onDirectionChange,
  isDoubleFault,
}: ServerEffectModalBodyProps) {
  return (
    <div className="px-5 py-4 space-y-[18px]">
      <Section label={context === 'error' ? 'Efeito da Falha (opcional)' : 'Efeito'}>
        <PillGroup options={EFFECT_OPTIONS} selected={effect} onChange={onEffectChange} />
      </Section>
      <Section label={context === 'error' ? 'Direção da Falha (opcional)' : 'Direção'}>
        <PillGroup options={DIRECTION_OPTIONS} selected={direction} onChange={onDirectionChange} />
      </Section>

      {isDoubleFault && (
        <p className="text-xs text-telemetry-text-muted italic leading-relaxed bg-gray-800/60 rounded-lg px-3 py-2">
          O ponto já está definido para o adversário por dupla falta.
          Efeito e direção descrevem a falha do sacador.
        </p>
      )}
    </div>
  );
}
