import { router, publicProcedure } from "@/server/trpc";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getAgentByName, type AgentNamespace } from "agents";

export const planRouter = router({
  beginPlanning: publicProcedure.input(z.object({
    prompt: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { prompt } = input;
    const randomId = generateId("agent");
    const agent = await getAgentByName(ctx.env.PlannerAgent, randomId);
    if (!agent) {
      return new Response(null, { status: 404 })
    }
    return {
      agentId: randomId,
    }
  }),
});