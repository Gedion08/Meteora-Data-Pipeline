import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import dotenv from "dotenv";
import winston from "winston";
import { poolsFetched, lastFetch, fetchDuration } from './metrics.ts';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});

export type PoolToken = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  is_verified: boolean;
  holders: number;
  freeze_authority_disabled: boolean;
  total_supply: number;
  price: number;
  market_cap: number;
};

export type DlmmPool = {
  address: string;
  name: string;
  token_x: PoolToken;
  token_y: PoolToken;
  reserve_x: string;
  reserve_y: string;
  token_x_amount: number;
  token_y_amount: number;
  created_at: number;
  reward_mint_x: string;
  reward_mint_y: string;
  pool_config: {
    bin_step: number;
    base_fee_pct: number;
    max_fee_pct: number;
    protocol_fee_pct: number;
    collect_fee_mode: number;
  };
  dynamic_fee_pct: number;
  tvl: number;
  current_price: number;
  apr: number;
  apy: number;
  has_farm: boolean;
  farm_apr: number;
  farm_apy: number;
  volume: Record<string, number>;
  fees: Record<string, number>;
  protocol_fees: Record<string, number>;
  fee_tvl_ratio: Record<string, number>;
  cumulative_metrics: {
    volume: number;
    fees: number;
  };
  is_blacklisted: boolean;
  launchpad: string;
  tags: string[];
};

export type DammV2Pool = {
  address: string;
  name: string;
  token_a: PoolToken;
  token_b: PoolToken;
  reserve_a: string;
  reserve_b: string;
  token_a_amount: number;
  token_b_amount: number;
  created_at: number;
  reward_mint_a: string;
  reward_mint_b: string;
  pool_config: {
    bin_step: number;
    base_fee_pct: number;
    max_fee_pct: number;
    protocol_fee_pct: number;
    collect_fee_mode: number;
  };
  dynamic_fee_pct: number;
  tvl: number;
  current_price: number;
  apr: number;
  apy: number;
  has_farm: boolean;
  farm_apr: number;
  farm_apy: number;
  volume: Record<string, number>;
  fees: Record<string, number>;
  protocol_fees: Record<string, number>;
  fee_tvl_ratio: Record<string, number>;
  cumulative_metrics: {
    volume: number;
    fees: number;
  };
  is_blacklisted: boolean;
  launchpad: string;
  tags: string[];
};

const DLMM_API_URL = "https://dlmm.datapi.meteora.ag/pools";
const DAMM_V2_API_URL = "https://damm-v2.datapi.meteora.ag/pools";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelay = 300) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const delay = Math.floor(baseDelay * Math.pow(2, i) + Math.random() * baseDelay);
      logger.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms: ${e}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
};

async function fetchJson<T>(url: string) {
  return retry(async () => {
    const response = await fetch(url, { headers: DEFAULT_HEADERS as any });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText} ${text}`);
    }
    const body = (await response.json()) as T;
    return body;
  });
}

export async function loadDlmmPools(page = 1, pageSize = 20) {
  const url = `${DLMM_API_URL}?page=${page}&page_size=${pageSize}`;
  return fetchJson<{ total: number; pages: number; current_page: number; page_size: number; data: DlmmPool[] }>(url);
}

export async function loadDammV2Pools(page = 1, pageSize = 20) {
  const url = `${DAMM_V2_API_URL}?page=${page}&page_size=${pageSize}`;
  return fetchJson<{ total: number; pages: number; current_page: number; page_size: number; data: DammV2Pool[] }>(url);
}


// zod schemas (partial) for runtime validation
const TokenSchema = z.object({
  address: z.string(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
  price: z.number().optional(),
});

const DlmmPoolSchema = z.object({
  address: z.string(),
  name: z.string().optional(),
  token_x: TokenSchema,
  token_y: TokenSchema,
  tvl: z.number().optional(),
  current_price: z.number().optional(),
  apr: z.number().optional(),
  apy: z.number().optional(),
  created_at: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const DammV2PoolSchema = z.object({
  address: z.string(),
  name: z.string().optional(),
  token_a: TokenSchema,
  token_b: TokenSchema,
  tvl: z.number().optional(),
  current_price: z.number().optional(),
  apr: z.number().optional(),
  apy: z.number().optional(),
  created_at: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const ApiPageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ total: z.number().optional(), pages: z.number().optional(), current_page: z.number().optional(), page_size: z.number().optional(), data: z.array(item) });

type Checkpoint = { last_fetched_at?: number };

async function readCheckpoint(source: string): Promise<Checkpoint> {
  const dir = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
  const file = path.join(dir, `${source}_checkpoint.json`);
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt) as Checkpoint;
  } catch (e) {
    return {};
  }
}

async function writeAtomic(filePath: string, content: string) {
  const tmp = `${filePath}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
  return filePath;
}

export type PoolNormalized = {
  address: string;
  name: string;
  base_token: { address: string; symbol: string; decimals: number; price?: number };
  quote_token: { address: string; symbol: string; decimals: number; price?: number };
  tvl: number;
  current_price: number;
  apr: number;
  apy: number;
  volume_24h?: number;
  fees_24h?: number;
  protocol_fees_24h?: number;
  tags: string[];
  source: "DLMM" | "DAMM_V2";
};

export function normalizeDlmmPool(p: DlmmPool): PoolNormalized {
  return {
    address: p.address,
    name: p.name,
    base_token: { address: p.token_x.address, symbol: p.token_x.symbol || "", decimals: p.token_x.decimals, price: p.token_x.price },
    quote_token: { address: p.token_y.address, symbol: p.token_y.symbol || "", decimals: p.token_y.decimals, price: p.token_y.price },
    tvl: p.tvl,
    current_price: p.current_price,
    apr: p.apr,
    apy: p.apy,
    volume_24h: p.volume?.["24h"] ?? null,
    fees_24h: p.fees?.["24h"] ?? null,
    protocol_fees_24h: p.protocol_fees?.["24h"] ?? null,
    tags: p.tags ?? [],
    source: "DLMM",
  };
}

export function normalizeDammV2Pool(p: DammV2Pool): PoolNormalized {
  return {
    address: p.address,
    name: p.name,
    base_token: { address: p.token_a.address, symbol: p.token_a.symbol || "", decimals: p.token_a.decimals, price: p.token_a.price },
    quote_token: { address: p.token_b.address, symbol: p.token_b.symbol || "", decimals: p.token_b.decimals, price: p.token_b.price },
    tvl: p.tvl,
    current_price: p.current_price,
    apr: p.apr,
    apy: p.apy,
    volume_24h: p.volume?.["24h"] ?? null,
    fees_24h: p.fees?.["24h"] ?? null,
    protocol_fees_24h: p.protocol_fees?.["24h"] ?? null,
    tags: p.tags ?? [],
    source: "DAMM_V2",
  };
}

async function ensureDataDir(): Promise<string> {
  const out = path.resolve(process.cwd(), process.env.DATA_DIR || "data");
  try {
    await fs.mkdir(out, { recursive: true });
  } catch (e) {
    // ignore
  }
  return out;
}

export async function saveJson(filename: string, obj: unknown) {
  const out = await ensureDataDir();
  const file = path.join(out, filename);
  await writeAtomic(file, JSON.stringify(obj, null, 2));
  return file;
}

function csvEscape(val: unknown) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function saveCsv(filename: string, rows: Record<string, unknown>[]) {
  const out = await ensureDataDir();
  if (rows.length === 0) {
    const fileEmpty = path.join(out, filename);
    await writeAtomic(fileEmpty, "");
    return fileEmpty;
  }
  const keys = Object.keys(rows[0]);
  const header = keys.join(",") + "\n";
  const body = rows.map((r) => keys.map((k) => csvEscape((r as any)[k])).join(",")).join("\n");
  const file = path.join(out, filename);
  await writeAtomic(file, header + body);
  return file;
}

export async function persistDlmmPools(raw: { data: DlmmPool[] }) {
  // validate items
  const pageSchema = ApiPageSchema(DlmmPoolSchema);
  const validated = pageSchema.parse({ data: raw.data });
  const normalized = validated.data.map((d) => normalizeDlmmPool(d as DlmmPool));
  const ts = Date.now();
  const jsonFile = await saveJson(`dlmm_pools_${ts}.json`, { fetched_at: ts, count: normalized.length, data: normalized });
  await saveCsv(`dlmm_pools_${ts}.csv`, normalized as unknown as Record<string, unknown>[]);
  return jsonFile;
}

export async function persistDammV2Pools(raw: { data: DammV2Pool[] }) {
  const pageSchema = ApiPageSchema(DammV2PoolSchema);
  const validated = pageSchema.parse({ data: raw.data });
  const normalized = validated.data.map((d) => normalizeDammV2Pool(d as DammV2Pool));
  const ts = Date.now();
  const jsonFile = await saveJson(`dammv2_pools_${ts}.json`, { fetched_at: ts, count: normalized.length, data: normalized });
  await saveCsv(`dammv2_pools_${ts}.csv`, normalized as unknown as Record<string, unknown>[]);
  return jsonFile;
}

export async function loadAllDlmmPools() {
  const checkpoint = await readCheckpoint("dlmm");
  let page = 1;
  const pageSize = 50;
  const all: DlmmPool[] = [];
  while (true) {
    logger.info(`Fetching DLMM page ${page}`);
    const endTimer = fetchDuration.startTimer({ source: 'DLMM' });
    const res = await loadDlmmPools(page, pageSize);
    // runtime validate
    const parsed = ApiPageSchema(DlmmPoolSchema).parse(res as any);
    const newer = (parsed.data as DlmmPool[]).filter((p) => (checkpoint.last_fetched_at ? (p.created_at || 0) > checkpoint.last_fetched_at : true));
    all.push(...newer);
    if (!parsed.pages || page >= (parsed.pages || 0)) break;
    if (newer.length === 0 && checkpoint.last_fetched_at) break;
    page++;
  }
  // update checkpoint
  if (all.length > 0) {
    const maxCreated = Math.max(...all.map((p) => p.created_at || 0));
    const dir = await ensureDataDir();
    const file = path.join(dir, "dlmm_checkpoint.json");
    await writeAtomic(file, JSON.stringify({ last_fetched_at: maxCreated }, null, 2));
    poolsFetched.inc({ source: 'DLMM' } as any, all.length);
    lastFetch.set({ source: 'DLMM' } as any, maxCreated);
    fetchDuration.observe({ source: 'DLMM' } as any, 0); // ensure metric exists
  }
  return { data: all } as { data: DlmmPool[] };
}

export async function loadAllDammV2Pools() {
  const checkpoint = await readCheckpoint("dammv2");
  let page = 1;
  const pageSize = 50;
  const all: DammV2Pool[] = [];
  while (true) {
    logger.info(`Fetching DAMM v2 page ${page}`);
    const endTimer = fetchDuration.startTimer({ source: 'DAMM_V2' });
    const res = await loadDammV2Pools(page, pageSize);
    const parsed = ApiPageSchema(DammV2PoolSchema).parse(res as any);
    const newer = (parsed.data as DammV2Pool[]).filter((p) => (checkpoint.last_fetched_at ? (p.created_at || 0) > checkpoint.last_fetched_at : true));
    all.push(...newer);
    if (!parsed.pages || page >= (parsed.pages || 0)) break;
    if (newer.length === 0 && checkpoint.last_fetched_at) break;
    page++;
  }
  if (all.length > 0) {
    const maxCreated = Math.max(...all.map((p) => p.created_at || 0));
    const dir = await ensureDataDir();
    const file = path.join(dir, "dammv2_checkpoint.json");
    await writeAtomic(file, JSON.stringify({ last_fetched_at: maxCreated }, null, 2));
    poolsFetched.inc({ source: 'DAMM_V2' } as any, all.length);
    lastFetch.set({ source: 'DAMM_V2' } as any, maxCreated);
    fetchDuration.observe({ source: 'DAMM_V2' } as any, 0);
  }
  return { data: all } as { data: DammV2Pool[] };
}
