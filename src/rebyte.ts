import * as path from "https://deno.land/std@0.201.0/path/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.19.4/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.2/mod.ts";
import { RebyteAPI } from "./client.ts";
import { config } from "./config.ts";

import AsciiTable, { AsciiAlign } from 'https://deno.land/x/ascii_table/mod.ts';


import { chalk} from "../deps.ts";

const REBYTE_JSON_FILE = "rebyte.json";

export const supportedFileTypes = [
  "doc",
  "docx",
  "img",
  "epub",
  "jpeg",
  "jpg",
  "png",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "md",
  "txt",
  "rtf",
  "rst",
  "pdf",
  "json",
  "html",
  "eml",
]


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
  displayName: z.string().max(
    30, {
      message: "displayName must be less than 30 characters",
      }
  ).optional().nullable(),
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

function getUploadFileName(rebyte: RebyteJson, pid: string): string {
  return pid + "-" + rebyte.name + "-" + rebyte.version + "-" + new Date().getTime();
}

export async function deploy(dir: string, rebyte: RebyteJson) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  // check name is available
  const client = new RebyteAPI(activeServer);

  Deno.chdir(dir);
  const entryPoint = path.join(Deno.cwd(), rebyte.main ?? "index.ts");
  const output = path.join(
      Deno.cwd(),
      rebyte.out ?? "./dist/" + rebyte.name + ".js",
  );

  await esbuild.build({
    plugins: [...denoPlugins({ loader: "portable", nodeModulesDir: true })],
    // plugins: [...denoPlugins({ loader: "portable", configPath: "/Users/homo/src/callable/ext_diagram/deno.json"})],
    entryPoints: [entryPoint],
    outfile: output,
    bundle: true,
    format: "esm",
    write: true,
  });
  esbuild.stop();

  console.log("Build success 🎉")

  await client.checkValidVersion(rebyte);

  const shouldProceed = confirm(`Are you sure you want to deploy ${rebyte.name} version ${rebyte.version} to ${activeServer.url}?`);
  if (!shouldProceed) {
    console.log("Deploy canceled")
    return;
  }

  // get upload url
  const fileId = getUploadFileName(rebyte, activeServer.pId);
  const uploadURL = await client.getUploadURL(fileId);
  await client.uploadFile(uploadURL, output);
  await client.createExtension(rebyte, fileId);
  console.log(`Deploy ReByte Extension Success 🎉, you can go to ${activeServer.url}/p/${activeServer.pId}/settings/extensions to check it`);
}

export async function list_extension() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);

  let extensions = await client.getExtensions();
  // flatten
  extensions = extensions.reduce((acc: any, cur: any) => {
    acc.push(...cur[1]);
    return acc;
  }, [])

  // console.log(extensions)

  const table = AsciiTable.fromJSON({
    title: 'Action Extensions',
    heading: [ 'id', 'name' ],
    rows: extensions.map((a: any) => [a.name, a.version])
  })
  console.log(table.toString())

  logSuccess("List extension success 🎉");
}

export async function list_knowledge() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const agents = await client.listAgents()

  const table = AsciiTable.fromJSON({
    title: 'Title',
    heading: [ 'id', 'name' ],
    rows: agents
  })
  console.log(table)

  logSuccess("List agent success");
}


export async function list_agent() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const agents = await client.listAgents()
  const table = AsciiTable.fromJSON({
    title: 'Agents',
    heading: [ 'id', 'name' ],
    rows: agents.map((a: any) => [a.sId, a.name])
  })
  console.log(table.toString())

  logSuccess("List agent success");
}

export async function import_dir(dir: string, knowledgeName: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }

  const files = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile) {
      const ext = path.extname(entry.name).slice(1);
      if (supportedFileTypes.includes(ext)) {
        files.push(entry);
      }
    }
  }
  // console.log(files.map((f) => f.name))

  const table = AsciiTable.fromJSON({
    title: 'Files',
    heading: [ 'name'],
    rows: files.map((f) => [f.name])
  })

  console.log(table.toString())

  const shouldProceed = confirm(`Found ${files.length} files, Do you want to proceed?`);
  if (!shouldProceed) {
    return;
  }

  // index files
  const client = new RebyteAPI(activeServer);
  // track progress and log failed files
  for (const file of files) {
    await client.upsertDoc(knowledgeName, file, dir)
  }

  logSuccess(`Index directory ${dir} success 🎉`);
}
