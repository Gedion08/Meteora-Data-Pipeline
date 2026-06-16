import { PrismaClient } from '@prisma/client';
import { PoolNormalized } from './pipeline';

const prisma = new PrismaClient();

export async function upsertPools(pools: PoolNormalized[]) {
  const ops = pools.map((p) =>
    prisma.pool.upsert({
      where: { address: p.address },
      update: {
        name: p.name,
        base_token: p.base_token.address,
        quote_token: p.quote_token.address,
        tvl: p.tvl,
        current_price: p.current_price,
        apr: p.apr,
        apy: p.apy,
        tags: p.tags as any,
        source: p.source,
      },
      create: {
        address: p.address,
        name: p.name,
        base_token: p.base_token.address,
        quote_token: p.quote_token.address,
        tvl: p.tvl,
        current_price: p.current_price,
        apr: p.apr,
        apy: p.apy,
        tags: p.tags as any,
        source: p.source,
      },
    })
  );
  return Promise.all(ops);
}

export async function closeDb() {
  await prisma.$disconnect();
}
