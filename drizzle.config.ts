import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./server/backoffice/schema.ts",
  out: "./server/backoffice/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "./data/backoffice.sqlite",
  },
});
