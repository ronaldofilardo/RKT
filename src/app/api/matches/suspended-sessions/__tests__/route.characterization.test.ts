import { GET, POST, PUT, DELETE } from '../route';

describe('src/app/api/matches/suspended-sessions/route.ts - Caracterizacao', () => {
  it('deve exportar funcoes de route', () => {
    expect(typeof GET === 'function' || typeof POST === 'function' || typeof PUT === 'function' || typeof DELETE === 'function').toBe(true);
  });
});
