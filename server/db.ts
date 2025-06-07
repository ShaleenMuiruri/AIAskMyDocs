import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}


export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Test the connection and log database info
async function testConnection() {
  try {
    const result = await db.execute(sql`
      SELECT current_database(), current_user, version();
    `);
    console.log("Connected to database:", result.rows[0]);
    
    // Run the migration
    console.log("Running vector dimension migration...");
    await db.execute(sql`
      -- Drop existing vector column
      ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "embedding";
      
      -- Recreate vector column with new dimensions
      ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(768);
    `);
    console.log("Migration completed successfully");
    
    // List tables
    const tables = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log("tables", tables);
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Run the test
testConnection();
