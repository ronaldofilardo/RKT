import { loadAvailableCts, type CtOption } from './match-new-ct-logic';

type BooleanSetter = (value: boolean) => void;
type ListSetter = (value: string[]) => void;
type CtIdSetter = (value: string | ((prev: string) => string)) => void;
type CtsSetter = (value: CtOption[]) => void;

interface ActiveContextSetters {
  setIsParticular: BooleanSetter;
  setFollowedPlayerIds: ListSetter;
  setCtId: CtIdSetter;
  setAvailableCts: CtsSetter;
}

/**
 * Carrega o contexto ativo (particular/CT) e as CTs disponíveis.
 * Falha em qualquer etapa cai no mesmo fallback silencioso do fluxo original:
 * tenta carregar as CTs de novo e, em último caso, segue sem CTs.
 */
export async function loadActiveContext(setters: ActiveContextSetters): Promise<void> {
  if (typeof fetch !== 'function') return;
  const applyCts = async () => {
    const cts = await loadAvailableCts();
    setters.setAvailableCts(cts);
    if (cts.length > 0) setters.setCtId((prev) => prev || cts[0].id);
  };
  try {
    const res = await fetch('/api/auth/me');
    const data = res.ok ? await res.json() : null;
    const particular = (data?.activeContextId ?? null) === 'PARTICULAR' || data?.activeArea === 'TREINADOR_AVULSO';
    setters.setIsParticular(particular);
    const ids = data?.followedPlayerIds ?? [];
    if (Array.isArray(ids)) setters.setFollowedPlayerIds(ids);

    const cts = await loadAvailableCts();
    setters.setAvailableCts(cts);
    if (particular) setters.setCtId('');
    else if (cts.length > 0) setters.setCtId((prev) => prev || cts[0].id);
  } catch {
    await applyCts().catch(() => undefined);
  }
}
