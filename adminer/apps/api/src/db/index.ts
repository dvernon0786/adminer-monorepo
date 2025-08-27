// apps/api/src/db/index.ts

// Re-export the db client
export { db } from "./client";

// Re-export schema so both "@/db" and "@/db/schema" work nicely
export * from "./schema"; 