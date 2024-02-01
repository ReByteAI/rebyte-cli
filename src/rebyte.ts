import * as path from "path";
import * as esbuild from "esbuild";
import { denoPlugins } from "esbuild-deno-loader";
import { z } from "zod";
import { RebyteAPI } from "./client.ts";
import { config } from "./config.ts";
import AsciiTable, { AsciiAlign } from "asciitable";
import { chalk } from "./chalk.ts";
import { ListQuery, displayListQuery } from "./pagination.ts";
import { formatUnix } from "./utils.ts";
import { MessageType, ThreadType, RunType } from "./types.ts";

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
];

function logSuccess(msg: string) {
  console.log(chalk.green(msg));
}

const RebyteJson = z.object({
  name: z
    .string()
    .min(5)
    .max(30)
    .refine((value: string) => /^[a-z0-9\_]*$/.test(value), {
      message: "Only lowercase letters, number and underline are allowed",
    }),
  displayName: z
    .string()
    .max(30, {
      message: "displayName must be less than 30 characters",
    })
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  version: z.string(),
  main: z.string().optional().nullable(),
  out: z.string().optional().nullable(),
  // link to doc
  docLink: z.string().optional().nullable(),
  // agent Id
  exampleAgent: z.string().optional().nullable(),
  inputArgs: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.string(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
});

export type RebyteJson = z.infer<typeof RebyteJson>;

export async function newRebyteJson(dir: string): Promise<RebyteJson> {
  const file_path = path.join(dir, REBYTE_JSON_FILE);
  await Deno.stat(file_path);
  const data = JSON.parse(await Deno.readTextFile(file_path));
  return RebyteJson.parse(data);
}

function getUploadFileName(rebyte: RebyteJson, pid: string): string {
  return (
    pid + "-" + rebyte.name + "-" + rebyte.version + "-" + new Date().getTime()
  );
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

  console.log("Build success 🎉");

  await client.checkValidVersion(rebyte);

  const shouldProceed = confirm(
    `Are you sure you want to deploy ${rebyte.name} version ${rebyte.version} to ${activeServer.url}?`,
  );
  if (!shouldProceed) {
    console.log("Deploy canceled");
    return;
  }

  // get upload url
  const fileId = getUploadFileName(rebyte, activeServer.pId);
  const uploadURL = await client.getUploadURL(fileId);
  await client.uploadFile(uploadURL, output);
  await client.createExtension(rebyte, fileId);
  console.log(
    `Deploy ReByte Extension Success 🎉, you can go to ${activeServer.url}/p/${activeServer.pId}/settings/extensions to check it`,
  );
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
  }, []);

  // console.log(extensions)

  const table = AsciiTable.fromJSON({
    title: "Action Extensions",
    heading: ["id", "name"],
    rows: extensions.map((a: any) => [a.name, a.version]),
  });
  console.log(table.toString());

  logSuccess("List extension success 🎉");
}

// export async function list_knowledge() {
//   const activeServer = config.activeServer();
//   if (!activeServer) {
//     throw Error("Please login first");
//   }
//   const client = new RebyteAPI(activeServer);
//   const agents = await client.listAgents();
//
//   const table = AsciiTable.fromJSON({
//     title: "Title",
//     heading: ["id", "name"],
//     rows: agents,
//   });
//   console.log(table);
//
//   logSuccess("List agent success");
// }

export async function list_agent() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const agents = await client.listAgents();
  const table = AsciiTable.fromJSON({
    title: "Agents",
    heading: ["id", "name"],
    rows: agents.map((a: any) => [a.sId, a.name]),
  });
  console.log(table.toString());

  logSuccess("List agent success");
}

export async function list_file() {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const agents = await client.listFiles();
  const table = AsciiTable.fromJSON({
    title: "External Files",
    heading: ["uuid", "name"],
    rows: agents.map((a: any) => [a.uuid, a.name]),
  });
  console.log(table.toString());

  logSuccess("List agent success");
}

export async function upload_file(file: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const { uploadUrl } = await client.createUploadUrl(file);
  console.log(uploadUrl);

  logSuccess("Upload file success");
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
    title: "Files",
    heading: ["name"],
    rows: files.map((f) => [f.name]),
  });

  console.log(table.toString());

  const shouldProceed = confirm(
    `Found ${files.length} files, Do you want to proceed?`,
  );
  if (!shouldProceed) {
    return;
  }

  // index files
  const client = new RebyteAPI(activeServer);
  // track progress and log failed files
  for (const file of files) {
    await client.upsertDoc(knowledgeName, file, dir);
  }

  logSuccess(`Index directory ${dir} success 🎉`);
}

function showThreadTable(title: string, threads: ThreadType[]) {
  const table = AsciiTable.fromJSON({
    title,
    heading: ["ID", "Created", "More"],
    rows: threads.map((thread) => [
      thread.id,
      formatUnix(thread.created_at),
      JSON.stringify({
        ...thread,
        id: undefined,
        created_at: undefined,
      })
    ]),
  });
  console.log(table.toString());
}

export async function createThread(metadata?: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.createThread(metadata);
  showThreadTable(`Thread`, [result])
  logSuccess("Create thread success");
}

export async function listThreads(query: ListQuery) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.listThreads(query);
  showThreadTable(`Threads (${displayListQuery(query)})`, result.list)
  logSuccess("List threads success");
}

export async function getThread(threadId: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.getThread(threadId);
  showThreadTable(`Thread`, [result])
  logSuccess("Get thread success");
}

export async function updateThread(threadId: string, metadata?: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.updateThread(threadId, metadata);
  showThreadTable(`Thread`, [result])
  logSuccess("Update thread success");
}

function showMessageTable(title: string, messages: MessageType[]) {
  const table = AsciiTable.fromJSON({
    title,
    heading: ["ID", "Created", "Role", "Agent ID", "Name", "Content", "Run ID", "More"],
    rows: messages.map((message) => [
      message.id,
      formatUnix(message.created_at),
      message.role,
      message.agent_id,
      message.name,
      message.content,
      message.run_id,
      JSON.stringify({
        ...message,
        id: undefined,
        created_at: undefined,
        thread_id: undefined,
        role: undefined,
        agent_id: undefined,
        name: undefined,
        content: undefined,
        run_id: undefined,
      })
    ]),
  });
  console.log(table.toString());
}

export async function createMessage(threadId: string, content: string, metadata?: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.createMessage(threadId, content, metadata);
  showMessageTable(`Messages (thread: ${threadId})`, [result])
  logSuccess("Create message success");
}

export async function listMessages(threadId: string, query: ListQuery) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.listMessages(threadId, query);
  showMessageTable(
    `Messages (thread: ${threadId} ${displayListQuery(query)})`,
    result.list,
  )
  logSuccess("List messages success");
}

export async function getMessage(threadId: string, messageId: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.getMessage(threadId, messageId);
  showMessageTable(`Message (thread: ${threadId})`, [result])
  logSuccess("Get message success");
}

export async function updateMessage(threadId: string, messageId: string, metadata?: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.updateMessage(threadId, messageId, metadata);
  showMessageTable(`Message (thread: ${threadId})`, [result])
  logSuccess("Update message success");
}

function showRunTable(title: string, runs: RunType[]) {
  const table = AsciiTable.fromJSON({
    title,
    heading: ["ID", "Created", "Agent ID", "Status", "More"],
    rows: runs.map((run) => [
      run.id,
      formatUnix(run.created_at),
      run.agent_id,
      run.status,
      JSON.stringify({
        ...run,
        id: undefined,
        created_at: undefined,
        thread_id: undefined,
        agent_id: undefined,
        status: undefined,
      })
    ]),
  });
  console.log(table.toString());
}

export async function listRuns(threadId: string, query: ListQuery) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.listRuns(threadId, query);
  showRunTable(
    `Runs (thread: ${threadId} ${displayListQuery(query)})`,
    result.list,
  )
  logSuccess("List runs success");
}

export async function getRun(runId: string) {
  const activeServer = config.activeServer();
  if (!activeServer) {
    throw Error("Please login first");
  }
  const client = new RebyteAPI(activeServer);
  const result = await client.getRun(runId);
  showRunTable(`Run (thread: ${result.thread_id ?? ""})`, [result])
  logSuccess("Get run success");
}
