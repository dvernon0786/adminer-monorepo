import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from './schema'

// Ensure NEON_DATABASE_URL exists in env
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL! })
export const db = drizzle(pool, { schema })

// Export for use in API routes
export { schema } 