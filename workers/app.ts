/// <reference types="@cloudflare/workers-types" />

import { createRequestHandler, type AppLoadContext } from "react-router";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../app/db/schema';
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AgentNamespace } from "agents";
import { routeAgentRequest } from "agents";
import type { PlannerAgent } from "@/agents/plan";
import { auth } from "@/lib/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server";

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
const createContext = (ctx: AppLoadContext, headers: Headers) => {
  return {
    headers: headers,
    env: ctx.cloudflare.env,
    db: ctx.db,
    auth: ctx.auth,
  }
}
export type TRPCContext = ReturnType<typeof createContext>;

export default {
  async fetch(request, env, ctx) {
    const db = drizzle(env.DATABASE, { schema })
    const betterAuth = auth(env)
    const url = new URL(request.url);
    const loadContext: AppLoadContext = {
      cloudflare: { env, ctx },
      env,
      db,
      auth: betterAuth,
    }
    if (url.pathname.startsWith("/agents")) {
      // Let the agents SDK handle agent routes
      return (await routeAgentRequest(request, env)) || Response.json({ msg: 'no agent here' }, { status: 404 });
    }
    if (url.pathname.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: () => {
          return createContext(loadContext, request.headers)
        }
      });
    }
    if (url.pathname.startsWith("/api/auth")) {
      return betterAuth.handler(request);
    }
    return requestHandler(request, {
      cloudflare: { env, ctx: ctx },
      db,
      auth: betterAuth,
    });
  },
} satisfies ExportedHandler<Env>;

export { PlannerAgent } from "../app/agents/plan";