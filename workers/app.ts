/// <reference types="@cloudflare/workers-types" />

import { createRequestHandler } from "react-router";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../app/db/schema';
import type { DrizzleD1Database } from "drizzle-orm/d1";
interface Env {
  DATABASE: D1Database;
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
      db: drizzle(env.DATABASE, { schema }),
    });
  },
} satisfies ExportedHandler<Env>;
