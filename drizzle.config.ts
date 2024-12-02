import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: "mono.db",
    // For Cloudflare D1
    // accountId: process.env.ACCOUNT_ID!,
    // databaseId: process.env.DB_ID!,
    // token: process.env.CF_TOKEN!,
  },
  // For Cloudflare D1
  // driver: "d1-http",
});
