import { describe, it, expect } from 'vitest';
import { normalizeDlmmPool, normalizeDammV2Pool } from '../pipeline';

const sampleDlmm = {
  address: '0xabc',
  name: 'DLMM Sample',
  token_x: { address: '0xtx', symbol: 'TX', decimals: 6, price: 1 },
  token_y: { address: '0xty', symbol: 'TY', decimals: 6, price: 2 },
  tvl: 1000,
  current_price: 2,
  apr: 0.1,
  apy: 0.11,
  created_at: 1690000000,
  tags: ['test']
};

const sampleDamm = {
  address: '0xdef',
  name: 'DAMM Sample',
  token_a: { address: '0xta', symbol: 'TA', decimals: 6, price: 3 },
  token_b: { address: '0xtb', symbol: 'TB', decimals: 6, price: 4 },
  tvl: 2000,
  current_price: 0.5,
  apr: 0.05,
  apy: 0.051,
  created_at: 1690001000,
  tags: ['sample']
};

describe('normalize functions', () => {
  it('normalizes dlmm pool', () => {
    const out = normalizeDlmmPool(sampleDlmm as any);
    expect(out.address).toBe(sampleDlmm.address);
    expect(out.base_token.symbol).toBe('TX');
    expect(out.quote_token.symbol).toBe('TY');
  });

  it('normalizes damm v2 pool', () => {
    const out = normalizeDammV2Pool(sampleDamm as any);
    expect(out.address).toBe(sampleDamm.address);
    expect(out.base_token.symbol).toBe('TA');
    expect(out.quote_token.symbol).toBe('TB');
  });
});
