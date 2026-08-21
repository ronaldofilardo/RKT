import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';

describe('Audio Route - Caracterizacao', () => {
  it('deve exportar GET, POST e DELETE', () => {
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
    expect(typeof DELETE).toBe('function');
  });

  it('deve aceitar params Promise<{ id: string; pointId: string }>', async () => {
    const req = new NextRequest('http://localhost:3000/api/test');
    // Apenas verificar que a funcao aceita o parametro esperado sem lancar erro de tipo
    expect(() => GET(req, { params: Promise.resolve({ id: 'm1', pointId: 'p1' }) })).not.toThrow();
  });
});
