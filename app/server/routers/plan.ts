import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getAgentByName, type AgentNamespace } from "agents";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const planRouter = router({
  beginPlanning: protectedProcedure.input(z.object({
    prompt: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { prompt } = input;
    const randomId = generateId("agent");
    
    await ctx.db.insert(agents).values({
      id: randomId,
      prompt: prompt,
      status: "active",
      ownerId: ctx.session.user.id,
    });
    
    const agent = await getAgentByName(ctx.env.PlannerAgent, randomId);
    if (!agent) {
      return new Response(null, { status: 404 })
    }
    
    return {
      agentId: randomId,
    }
  }),
  
  markInitialPromptUsed: protectedProcedure.input(z.object({
    agentId: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { agentId } = input;
    
    await ctx.db.update(agents)
      .set({ initialPromptUsed: true })
      .where(eq(agents.id, agentId));
    
    return { success: true };
  }),
});