import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const globalForPg = globalThis as typeof globalThis & {
  __realityCheckPool?: Pool
}

export const pool =
  globalForPg.__realityCheckPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__realityCheckPool = pool
}

export const db = drizzle(pool, { schema })
