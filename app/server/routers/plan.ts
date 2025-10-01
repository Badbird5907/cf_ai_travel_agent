import { router, publicProcedure } from "@/server/trpc";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getAgentByName, type AgentNamespace } from "agents";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const planRouter = router({
  beginPlanning: publicProcedure.input(z.object({
    prompt: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { prompt } = input;
    const randomId = generateId("agent");
    
    // Create the agent in the database
    await ctx.db.insert(agents).values({
      id: randomId,
      prompt: prompt,
      status: "active",
    });
    
    // Initialize the Durable Object agent
    const agent = await getAgentByName(ctx.env.PlannerAgent, randomId);
    if (!agent) {
      return new Response(null, { status: 404 })
    }
    
    return {
      agentId: randomId,
    }
  }),
  
  markInitialPromptUsed: publicProcedure.input(z.object({
    agentId: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { agentId } = input;
    
    // Update the agent to mark initial prompt as used
    await ctx.db.update(agents)
      .set({ initialPromptUsed: true })
      .where(eq(agents.id, agentId));
    
    return { success: true };
  }),
});