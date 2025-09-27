import { router, publicProcedure } from './trpc';

const testRouter = router({
  hello: publicProcedure.query(() => 'Hello World'),
});

export const appRouter = router({
  test: testRouter,
});
export type AppRouter = typeof appRouter;