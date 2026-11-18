'use client';
import { useState, useRef, useEffect } from 'react';
import { TermsContent } from './terms-content';
import { PrivacyContent } from './privacy-content';

export type TermsTab = 'TERMOS' | 'PRIVACIDADE';

interface TermsPrivacyModalProps {
  open: boolean;
  initialTab?: TermsTab;
  onClose: () => void;
  onAccept: () => void;
}

function getInstruction(terms: boolean, privacy: boolean): string {
  if (!terms && !privacy) return 'Role ambos os documentos até o final para liberar o botão Concordo.';
  if (terms && !privacy) return 'Termos lidos! Abra a aba Política de Privacidade e role até o final.';
  if (!terms && privacy) return 'Política lida! Abra a aba Termos de Uso e role até o final.';
  return 'Ambos os documentos lidos até o final. Clique em Concordo.';
}

const tabClass = (active: boolean) =>
  `flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
    active
      ? 'bg-telemetry-blue text-white shadow-sm'
      : 'bg-telemetry-base/60 text-telemetry-text-muted hover:text-telemetry-text-primary border border-telemetry-border/20'
  }`;

export function TermsPrivacyModal({ open, initialTab = 'TERMOS', onClose, onAccept }: TermsPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<TermsTab>(initialTab);
  const [scrolledTerms, setScrolledTerms] = useState(false);
  const [scrolledPrivacy, setScrolledPrivacy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab);
    setScrolledTerms(false);
    setScrolledPrivacy(false);
  }, [open, initialTab]);

  function markRead(tab: TermsTab): void {
    if (tab === 'TERMOS') setScrolledTerms(true);
    else setScrolledPrivacy(true);
  }

  // Volta ao topo ao trocar de aba e, se o documento couber todo, conta como lido.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    if (el.clientHeight > 0 && el.scrollHeight <= el.clientHeight + 24) {
      if (activeTab === 'TERMOS') setScrolledTerms(true);
      else setScrolledPrivacy(true);
    }
  }, [open, activeTab]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>): void {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 24) return;
    markRead(activeTab);
  }

  if (!open) return null;
  const canAccept = scrolledTerms && scrolledPrivacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
      <div className="bg-telemetry-card rounded-2xl shadow-2xl border border-telemetry-border/20 w-full max-w-2xl p-5 sm:p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-telemetry-border/10 mb-3">
          <h2 id="terms-modal-title" className="text-base sm:text-lg font-bold text-telemetry-text-primary">Termos e Privacidade</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-telemetry-text-muted hover:text-telemetry-text-primary p-1 rounded-lg transition-colors">✕</button>
        </div>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setActiveTab('TERMOS')} className={tabClass(activeTab === 'TERMOS')}>
            <span>Termos de Uso</span>
            {scrolledTerms && <span className="text-emerald-400 font-bold text-xs" title="Lido até o fim">✓</span>}
          </button>
          <button type="button" onClick={() => setActiveTab('PRIVACIDADE')} className={tabClass(activeTab === 'PRIVACIDADE')}>
            <span>Política de Privacidade</span>
            {scrolledPrivacy && <span className="text-emerald-400 font-bold text-xs" title="Lido até o fim">✓</span>}
          </button>
        </div>
        <div ref={scrollRef} onScroll={handleScroll} data-testid="terms-modal-scroll" className="flex-1 overflow-y-auto pr-2 rounded-xl border border-telemetry-border/10 bg-telemetry-base/40 p-4 text-xs sm:text-sm text-telemetry-text-muted">
          {activeTab === 'TERMOS' ? <TermsContent /> : <PrivacyContent />}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-telemetry-border/10 mt-3">
          <p data-testid="terms-modal-instruction" className="text-[11px] sm:text-xs text-telemetry-text-muted text-center sm:text-left flex-1">
            {getInstruction(scrolledTerms, scrolledPrivacy)}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-medium text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">Cancelar</button>
            <button type="button" disabled={!canAccept} onClick={onAccept} className="flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-semibold bg-telemetry-blue hover:bg-telemetry-blue-light text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer">Concordo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
