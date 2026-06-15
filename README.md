# Meteora Data Pipeline

This project is a TypeScript pipeline scaffold for ingesting Meteora DLMM and DAMM v2 pool data.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the pipeline in development mode:

   ```bash
   npm run dev
   ```

3. Build and run:

   ```bash
   npm run pipeline
   ```

## What it does

- Fetches DLMM pools from `https://dlmm.datapi.meteora.ag/pools`
- Fetches DAMM v2 pools from `https://damm-v2.datapi.meteora.ag/pools`
- Prints a summary of the fetched data

## Notes

- The pipeline uses `node-fetch` and a browser-style `User-Agent` header to access the API.
- This repository is currently a scaffold and can be extended with persistence, ETL, analytics, and alerting layers.
