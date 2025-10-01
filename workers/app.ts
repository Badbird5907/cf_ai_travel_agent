/// <reference types="@cloudflare/workers-types" />

import { createRequestHandler } from "react-router";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../app/db/schema';
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AgentNamespace, Agent } from "agents";
import type { PlannerAgent } from "@/agents/plan";
import { auth } from "@/lib/auth";
declare global {
  interface Env {
    EXA_API_KEY: string;
    DATABASE: D1Database;
    PlannerAgent: AgentNamespace<PlannerAgent>;
    AI: Ai;
    RAPIDAPI_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  }
}
declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
    auth: ReturnType<typeof auth>;
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
      auth: auth(env),
    });
  },
} satisfies ExportedHandler<Env>;

export { PlannerAgent } from "../app/agents/plan";