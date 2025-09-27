import { router } from './trpc';
import { planRouter } from './routers/plan';

export const appRouter = router({
  plan: planRouter,
});
export type AppRouter = typeof appRouter;