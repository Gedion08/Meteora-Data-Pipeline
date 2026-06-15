import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { loadAllDlmmPools, persistDlmmPools } from '../pipeline';

const sampleDlmm = {
  address: '0xabc',
  name: 'DLMM Sample',
  token_x: { address: '0xtx', symbol: 'TX', decimals: 6, price: 1 },
  token_y: { address: '0xty', symbol: 'TY', decimals: 6, price: 2 },
  tvl: 1000,
  current_price: 2,
  apr: 0.1,
  apy: 0.11,
  created_at: Date.now(),
  tags: ['test']
};

// Mock fetch
vi.mock('node-fetch', async () => {
  return {
    default: async (url: string) => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ pages: 1, data: [sampleDlmm] }),
        text: async () => JSON.stringify({ pages: 1, data: [sampleDlmm] }),
      };
    },
  };
});

let tmpDir = '';

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'meteora-test-'));
  process.env.DATA_DIR = tmpDir;
});

afterEach(async () => {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
});

describe('integration pipeline', () => {
  it('loads and persists dlmm pools', async () => {
    const res = await loadAllDlmmPools();
    expect(res.data.length).toBeGreaterThan(0);
    const jsonFile = await persistDlmmPools(res as any);
    const stat = await fs.stat(jsonFile);
    expect(stat.size).toBeGreaterThan(0);
  });
});
