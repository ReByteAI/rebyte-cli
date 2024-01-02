import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  "extension.get": publicProcedure.query(() => {
    return [
      [
        "extension1",
        [
          {
            name: "extension1",
            description: "extension1",
            version: "1.0.0",
          },
        ],
      ],
    ];
  }),
  "callable.getCallables": publicProcedure.query(() => {
    return [];
  }),
  "gcp.listFiles": publicProcedure.query(() => {
    return [
      {
        uuid: "uuid",
        name: "name",
        mimeType: "",
        size: 0,
      },
    ];
  }),
  "gcp.createUploadSignedUrl": publicProcedure
    .input(
      z.object({
        fileName: z.string({
          required_error: "File name is required",
        }),
        fileType: z.string({
          required_error: "File type is required",
        }),
      }),
    )
    .mutation((input: {}) => {
      return {
        uploadUrl: "",
        downloadUrl: "",
      };
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
