import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from '@/entry.server';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TRPCContext>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.auth.api.getSession({
    headers: ctx.headers,
  });
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session } });
});