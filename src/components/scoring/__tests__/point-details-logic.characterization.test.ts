import { formReducer, initialForm } from '../point-details-logic';

describe('point-details-logic - Caracterizacao', () => {
  it('deve atualizar situacao e resetar campos subsequentes ao disparar SET_SITUACAO', () => {
    const state = formReducer(initialForm, { type: 'SET_SITUACAO', value: 'SAQUE' as any });
    expect(state.situacao).toBe('SAQUE');
    expect(state.tipo).toBeNull();
  });

  it('deve atualizar tipo e limpar golpe e subtipos ao disparar SET_TIPO', () => {
    const prevState = { ...initialForm, situacao: 'SAQUE' as any, golpe: 'FOREHAND' as any };
    const state = formReducer(prevState, { type: 'SET_TIPO', value: 'WINNER' as any });
    expect(state.tipo).toBe('WINNER');
    expect(state.golpe).toBeNull();
  });

  it('deve restaurar initialForm ao disparar RESET', () => {
    const dirtyState = { ...initialForm, situacao: 'SAQUE' as any, tipo: 'ACE' as any };
    const state = formReducer(dirtyState, { type: 'RESET' });
    expect(state).toEqual(initialForm);
  });
});
