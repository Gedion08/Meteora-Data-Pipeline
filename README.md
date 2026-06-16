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
### Persistence to Postgres

To enable persistent storage to Postgres, set `DATABASE_URL` in your environment or in a `.env` file and then generate/migrate the Prisma schema:

```bash
npx prisma generate
npx prisma migrate deploy  # use `prisma migrate dev` for local development
```

When `DATABASE_URL` is present the pipeline will upsert normalized pools into the `Pool` table.
   npm run pipeline
   ```

- Fetches DAMM v2 pools from `https://damm-v2.datapi.meteora.ag/pools`
- Prints a summary of the fetched data

## Notes

- The pipeline uses `node-fetch` and a browser-style `User-Agent` header to access the API.
- This repository is currently a scaffold and can be extended with persistence, ETL, analytics, and alerting layers.
