import { router, publicProcedure } from "@/server/trpc";
import { z } from "zod";

export const planRouter = router({
  beginPlanning: publicProcedure.input(z.object({
    prompt: z.string(),
  })).mutation(async ({ input }) => {
    const { prompt } = input;
    return {
      prompt,
    };
  }),
});