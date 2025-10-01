import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./app/db/schema";

export const auth = betterAuth(
  {
    database: drizzleAdapter({} as DrizzleD1Database<typeof schema>, {
      provider: "sqlite",
    })
  }
);