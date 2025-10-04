import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const tripsRouter = router({
  getAgents: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
  })).query(async ({ input, ctx }) => {
    const { limit, offset } = input;
    
    const userAgents = await ctx.db
      .select()
      .from(agents)
      .where(eq(agents.ownerId, ctx.session.user.id))
      .orderBy(desc(agents.createdAt))
      .limit(limit)
      .offset(offset);
    
    const totalCount = await ctx.db
      .select({ count: agents.id })
      .from(agents)
      .where(eq(agents.ownerId, ctx.session.user.id))
      .then(rows => rows.length);
    
    return {
      agents: userAgents,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }),
});