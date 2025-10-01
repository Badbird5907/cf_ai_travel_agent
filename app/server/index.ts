import { router } from './trpc';
import { planRouter } from './routers/plan';
import { tripsRouter } from './routers/trips';

export const appRouter = router({
  plan: planRouter,
  trips: tripsRouter,
});
export type AppRouter = typeof appRouter;