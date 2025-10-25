import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import ws from "ws";

// Configure Neon to use WebSockets for local development
if (process.env.NODE_ENV === "development") {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a Neon Pool instance
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the Drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Export schema for use in queries
export { schema };
