import { initTRPC } from "@trpc/server";
import { z } from "zod";
import {TRPCError} from "https://esm.sh/v133/@trpc/server@10.28.2/denonext/server.mjs";

const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  "extension.get": publicProcedure.query(() => {
    return [
        ["extension1", [
            {
                name: "extension1",
                description: "extension1",
              version: "1.0.0",
            }
        ]],
    ]
  }),
  "callable.getCallables": publicProcedure.query(() => {
    return {}
  }),
  // "post.create": publicProceducre
  //     .input(
  //         z.object({
  //           name: z.string(),
  //         })
  //     )
  //     .mutation(({ input }) => {
  //       posts.push(input);
  //       return input;
  //     }),
});

export type AppRouter = typeof appRouter;