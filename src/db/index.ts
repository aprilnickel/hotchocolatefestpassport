import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL!;

// For query purposes (server-only). Use postgres.js for serverless/edge compatibility.
const client = postgres(connectionString, { max: 4 });
export const db = drizzle(client, { schema });

export * from "@/db/schema";
