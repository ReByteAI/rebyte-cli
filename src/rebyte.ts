import * as path from "https://deno.land/std@0.201.0/path/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.17.19/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.2/mod.ts";
import { RebyteAPI } from "./client.ts";
import { config } from "./config.ts";

import { chalk} from "../deps.ts";

const REBYTE_JSON_FILE = "rebyte.json";

function logSuccess(msg: string) {
  console.log(chalk.green(msg));
}

const RebyteJson = z.object({
  name: z.string().min(5).max(30).refine(
    (value: string) => /^[a-z0-9\_]*$/.test(value),
    {
      message: "Only lowercase letters, number and underline are allowed",
    },
  ),
  description: z.string().optional().nullable(),
  version: z.string(),
  main: z.string().optional().nullable(),
  out: z.string().optional().nullable(),
  inputArgs: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
  })).optional(),
});

export type RebyteJson = z.infer<typeof RebyteJson>;

export async function newRebyteJson(dir: string): Promise<RebyteJson> {
  const file_path = path.join(dir, REBYTE_JSON_FILE);
  await Deno.stat(file_path);
  const data = JSON.parse(await Deno.readTextFile(file_path));
  return RebyteJson.parse(data);
}

function getUploadFileName(rebyte: RebyteJson): string {
  return rebyte.name + "-" + rebyte.version + "-" + new Date().getTime();
}

export async function deploy(dir: string, rebyte: RebyteJson) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  // check name is available
  const client = new RebyteAPI(activeServer);
  await client.checkValidVersion(rebyte);

  Deno.chdir(dir);
  const entryPoint = path.join(Deno.cwd(), rebyte.main ?? "index.ts");
  const output = path.join(
    Deno.cwd(),
    rebyte.out ?? "./dist/" + rebyte.name + ".js",
  );
  await esbuild.build({
    plugins: [...denoPlugins({ loader: "portable", nodeModulesDir: true })],
    entryPoints: [entryPoint],
    outfile: output,
    bundle: true,
    format: "esm",
    write: true,
  });
  esbuild.stop();

  // get upload url
  const fileId = getUploadFileName(rebyte);
  const uploadURL = await client.getUploadURL(fileId);
  await client.uploadFile(uploadURL, output);
  await client.createExtension(rebyte, fileId);
  console.log("Deploy ReByte Extension Success 🎉");
}

export async function list_extension() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);

  const jsBundles = await client.getExtensions();

  console.log(jsBundles)

  logSuccess("List extension success 🎉");
}

export async function list_agent() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const agents = await client.listAgents()
  console.log(agents)

  logSuccess("List agent success");
}

export async function import_dir(dir: string, rebyte: RebyteJson) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  logSuccess("List callable success");
}
