import { performance } from 'perf_hooks';
import { loadDlmmPools, loadDammV2Pools } from '../src/pipeline.ts';

async function benchmark() {
  console.log('Starting pipeline benchmarks...\n');

  // Benchmark DLMM fetching
  console.log('Benchmarking DLMM pool fetch (1 page)...');
  const dlmmStart = performance.now();
  const dlmmRes = await loadDlmmPools(1, 50);
  const dlmmEnd = performance.now();
  const dlmmTime = dlmmEnd - dlmmStart;
  console.log(`  ✓ Fetched ${dlmmRes.data.length} pools in ${dlmmTime.toFixed(2)}ms`);
  console.log(`  ✓ Average per pool: ${(dlmmTime / dlmmRes.data.length).toFixed(2)}ms\n`);

  // Benchmark DAMM v2 fetching
  console.log('Benchmarking DAMM v2 pool fetch (1 page)...');
  const dammStart = performance.now();
  const dammRes = await loadDammV2Pools(1, 50);
  const dammEnd = performance.now();
  const dammTime = dammEnd - dammStart;
  console.log(`  ✓ Fetched ${dammRes.data.length} pools in ${dammTime.toFixed(2)}ms`);
  console.log(`  ✓ Average per pool: ${(dammTime / dammRes.data.length).toFixed(2)}ms\n`);

  // Summary
  console.log('Benchmark Summary:');
  console.log(`  DLMM:   ${dlmmTime.toFixed(2)}ms`);
  console.log(`  DAMM v2: ${dammTime.toFixed(2)}ms`);
  console.log(`  Total:  ${(dlmmTime + dammTime).toFixed(2)}ms\n`);
}

benchmark().catch(console.error);
