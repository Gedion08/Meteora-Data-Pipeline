import { loadAllDlmmPools, loadAllDammV2Pools, persistDlmmPools, persistDammV2Pools } from "./pipeline.ts";

async function main() {
  console.log("Starting Meteora data pipeline...");

  const dlmmData = await loadAllDlmmPools();
  console.log(`Fetched ${dlmmData.data.length} DLMM pools.`);
  await persistDlmmPools(dlmmData);
  console.log("DLMM pools persisted to data/ folder.");
  const dammV2Data = await loadAllDammV2Pools();
  console.log(`Fetched ${dammV2Data.data.length} DAMM v2 pools.`);
  await persistDammV2Pools(dammV2Data);
  console.log("DAMM v2 pools persisted to data/ folder.");
  console.log("Sample DLMM pool:", dlmmData.data[0]?.address);
  console.log("Sample DAMM v2 pool:", dammV2Data.data[0]?.address);
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
