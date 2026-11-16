'use client';

interface ConviteConsentBoxesProps {
  dataConsent: boolean;
  setDataConsent: (v: boolean) => void;
  broadcastConsent: boolean;
  setBroadcastConsent: (v: boolean) => void;
  statsConsent: boolean;
  setStatsConsent: (v: boolean) => void;
  declaration: boolean;
  setDeclaration: (v: boolean) => void;
}

interface ItemProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  href: string;
  badge: string;
  desc: string;
}

function ConsentItem({ id, checked, onChange, href, badge, desc }: ItemProps) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 cursor-pointer shrink-0" />
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-telemetry-text-muted hover:text-telemetry-text-primary hover:underline group inline cursor-pointer leading-relaxed" title="Abrir descritivo legal em nova aba">
        <strong className="text-telemetry-text-primary group-hover:text-telemetry-blue font-bold">{badge}:</strong>{' '}
        <span>{desc}</span> <span className="text-telemetry-blue text-[11px] font-semibold whitespace-nowrap">↗</span>
      </a>
    </div>
  );
}

export function ConviteConsentBoxes({
  dataConsent, setDataConsent,
  broadcastConsent, setBroadcastConsent,
  statsConsent, setStatsConsent,
  declaration, setDeclaration,
}: ConviteConsentBoxesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2.5 border border-telemetry-border/30 rounded-xl p-3 bg-telemetry-elevated/30">
        <span className="text-xs font-semibold block mb-1">Autorizações de Uso (Termo v2.0):</span>
        <ConsentItem
          id="consent-data" checked={dataConsent} onChange={setDataConsent}
          href="/termos/responsavel#autorizacao-1-dados" badge="Obrigatória — Dados e Equipe do CT"
          desc="Partidas e perfil visíveis ao gestor e treinador anotador."
        />
        <ConsentItem
          id="consent-broadcast" checked={broadcastConsent} onChange={setBroadcastConsent}
          href="/termos/responsavel#autorizacao-2-transmissao" badge="Opcional — Transmissão e Compartilhamento"
          desc="Acompanhamento pelo responsável e convidados com nome anonimizado (ex.: Atleta #8F2A7B)."
        />
        <ConsentItem
          id="consent-stats" checked={statsConsent} onChange={setStatsConsent}
          href="/termos/responsavel#autorizacao-3-pool" badge="Opcional — Pool de Estatísticas"
          desc="Desempenho em médias agregadas sem nome (mínimo de 10 jogos/atletas)."
        />
      </div>

      <div className="flex items-start gap-2 text-xs border border-telemetry-border/20 p-2.5 rounded-lg bg-telemetry-base/50">
        <input type="checkbox" id="consent-declaration" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-0.5 cursor-pointer shrink-0" />
        <a href="/termos/responsavel#declaracao-tutela" target="_blank" rel="noopener noreferrer" className="text-telemetry-text-muted hover:text-telemetry-text-primary hover:underline group inline cursor-pointer leading-relaxed" title="Abrir declaração completa em nova aba">
          Declaro que sou o responsável legal do atleta menor e que li o <span className="text-telemetry-blue font-semibold group-hover:underline">termo completo (versão 2.0)</span> <span className="text-telemetry-blue text-[11px] font-semibold whitespace-nowrap">↗</span>
        </a>
      </div>
    </div>
  );
}
