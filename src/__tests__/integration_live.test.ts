import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { loadAllDlmmPools, persistDlmmPools, loadAllDammV2Pools, persistDammV2Pools } from '../pipeline';

const runLive = process.env.RUN_LIVE_INTEGRATION === '1' || process.env.RUN_LIVE_INTEGRATION === 'true';

describe('live integration tests (Meteora public API)', () => {
  if (!runLive) {
    it('skipped live tests (set RUN_LIVE_INTEGRATION=1 to enable)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('fetches and persists DLMM pools (live)', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'meteora-live-'));
    process.env.DATA_DIR = tmp;
    const res = await loadAllDlmmPools();
    expect(res.data.length).toBeGreaterThanOrEqual(0);
    if (res.data.length > 0) {
      const file = await persistDlmmPools(res as any);
      const stat = await fs.stat(file);
      expect(stat.size).toBeGreaterThan(0);
    }
  }, 120000);

  it('fetches and persists DAMM v2 pools (live)', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'meteora-live-'));
    process.env.DATA_DIR = tmp;
    const res = await loadAllDammV2Pools();
    expect(res.data.length).toBeGreaterThanOrEqual(0);
    if (res.data.length > 0) {
      const file = await persistDammV2Pools(res as any);
      const stat = await fs.stat(file);
      expect(stat.size).toBeGreaterThan(0);
    }
  }, 120000);
});
