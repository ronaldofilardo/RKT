import {
  normalizeMatchVisibility,
  canCreateShareLinkForVisibility,
} from '../spectator-visibility.logic';
import {
  checkRedeemRateLimit,
  resetRedeemRateLimitForTests,
} from '../spectator-rate-limit.logic';

describe('spectator-visibility.logic', () => {
  test.each([
    [undefined, 'PUBLIC'],
    [null, 'PUBLIC'],
    ['UNKNOWN', 'PUBLIC'],
    ['PRIVATE', 'PRIVATE'],
    ['CIRCLE', 'CIRCLE'],
    ['PUBLIC', 'PUBLIC'],
  ])('normalizeMatchVisibility(%p) -> %s', (input, expected) => {
    expect(normalizeMatchVisibility(input)).toBe(expected);
  });

  test.each([
    ['PRIVATE', false],
    ['CIRCLE', true],
    ['PUBLIC', true],
    [null, true],
  ])('canCreateShareLinkForVisibility(%p) -> %s', (input, expected) => {
    expect(canCreateShareLinkForVisibility(input)).toBe(expected);
  });
});

describe('spectator-rate-limit.logic', () => {
  beforeEach(() => resetRedeemRateLimitForTests());

  it('permite até 20 tentativas por janela e bloqueia a 21ª', () => {
    const now = 1_000_000;
    for (let i = 0; i < 20; i += 1) {
      expect(checkRedeemRateLimit('1.2.3.4:tok', now)).toBe(true);
    }
    expect(checkRedeemRateLimit('1.2.3.4:tok', now)).toBe(false);
    expect(checkRedeemRateLimit('1.2.3.4:tok', now + 61_000)).toBe(true);
  });
});
