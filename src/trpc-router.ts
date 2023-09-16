import * as trpc from "https://esm.sh/@trpc/server@9.27.2";

// setup tRPC router
const appRouter = trpc.router().query("hw", {
  resolve() {
    const data = { hello: "world" };
    return data;
  },
});

export type AppRouter = typeof appRouter;
