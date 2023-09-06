import * as path from "https://deno.land/std@0.201.0/path/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.17.19/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.2/mod.ts";

const REBYTE_JSON_FILE = "rebyte.json"

const RebyteJson = z.object({
  name: z.string().min(5).max(30).refine((value: string) => /^[a-zA-Z\-]*$/.test(value), {
    message: "Only uppercase and lowercase letters and hyphens are allowed",
  }),
  description: z.string().optional().nullable(),
  main: z.string().optional().nullable(),
  out: z.string().optional().nullable(),
});

export type RebyteJson = z.infer<typeof RebyteJson>;

export async function newRebyteJson(dir: string): Promise<RebyteJson> {
  const file_path = path.join(dir, REBYTE_JSON_FILE)
  await Deno.stat(file_path);
  const data = JSON.parse(await Deno.readTextFile(file_path));
  return RebyteJson.parse(data)
}

export async function deploy(dir: string, rebyte: RebyteJson) {
  Deno.chdir(dir)
  const entryPoint = path.join(Deno.cwd(), rebyte.main ?? "index.ts")
  const output = path.join(Deno.cwd(), rebyte.out ?? "./dist/" + rebyte.name + ".js")
  await esbuild.build({
    plugins: [...denoPlugins({ loader: "portable", nodeModulesDir: true })],
    entryPoints: [entryPoint],
    outfile: output,
    bundle: true,
    format: "esm",
    write: true,
  });
  esbuild.stop();
}