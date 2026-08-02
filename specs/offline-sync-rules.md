# Regras de Sincronização Offline

## Fluxo
1. Usuário registra ponto → ação salva no IndexedDB (optimisticQueue)
2. Estado local é atualizado otimisticamente (UI reflete imediatamente)
3. Ao restaurar conectividade → `useOfflineSync` faz flush da fila
4. Cada ação é enviada em ordem FIFO para `/api/matches/:id/point`
5. Conflitos são resolvidos pelo servidor (última escrita vence por padrão)

## Estrutura da Fila
```typescript
interface QueuedAction {
  id: string;          // UUID local
  matchId: string;
  type: 'POINT';
  payload: PointFlowInput;
  timestamp: number;
  retries: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}
```
