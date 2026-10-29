import { describeSpectatorPoint } from '../point-labels';

describe('describeSpectatorPoint', () => {
  it('should describe standard point types', () => {
    expect(describeSpectatorPoint('ACE')).toBe('ace');
    expect(describeSpectatorPoint('WINNER')).toBe('winner');
    expect(describeSpectatorPoint('FORCED_ERROR')).toBe('erro forçado');
    expect(describeSpectatorPoint('UNFORCED_ERROR')).toBe('erro não forçado');
    expect(describeSpectatorPoint('DOUBLE_FAULT')).toBe('dupla falta');
  });

  it('should handle fallback types gracefully', () => {
    expect(describeSpectatorPoint('UNKNOWN_TYPE')).toBe('unknown type');
    expect(describeSpectatorPoint('CUSTOM')).toBe('custom');
  });
});

