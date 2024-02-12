import { cac } from "cac";
import { config, login } from "./config.ts";
import {
  createThread,
  listThreads,
  getThread,
  updateThread,
  createMessage,
  listMessages,
  getMessage,
  updateMessage,
  listRuns,
  getRun,
  deploy,
  import_dir,
  list_agent,
  list_extension,
  list_file,
  newRebyteJson,
  upload_file,
  createKnowledge,
  insertTextToKnowledge,
} from "./rebyte.ts";
import { version } from "./version.ts";
import { compareVersion } from "./utils.ts";

const cli = cac("rebyte");

cli
  .command("update", "Update rebyte cli to latest version")
  .action(async () => {
    // get content https://api.github.com/repos/ReByteAI/rebyte-cli/releases/latest
    // download content

    const response = await fetch(
      "https://api.github.com/repos/ReByteAI/rebyte-cli/releases/latest",
    );
    const latestVersion = JSON.parse(await response.text()).tag_name;
    // remove v from version
    const latestVersionNumber = latestVersion.substring(1);
    const currentVersionNumber = version.substring(1);
    if (compareVersion(currentVersionNumber, latestVersionNumber)) {
      console.log(
        `New version ${latestVersion} found, please update to latest version, run: wget -qO- https://raw.githubusercontent.com/rebyteai/rebyte-cli/main/install.sh | sudo sh -`,
      );
    } else {
      console.log("You are using latest version");
    }
  });

cli
  .command("login", "Login rebyte use your api key")
  .option("-k, --api-key <api-key>", "Your rebyte api key")
  .option(
    "-u, --url <server-url>",
    "Your rebyte server url, default is: https://rebyte.ai. For cn user, please use: https://colingo.ai",
    {
      default: "https://rebyte.ai",
    },
  )
  .action(async (options) => {
    const key = options.apiKey;
    const url = options.url;
    const success = await login(key, url);
    if (success) {
      console.log("Login successfully 🎉");
    } else {
      console.log("Login failed, api key is invalidate");
    }
  });

cli.command("get-context", "show current server context").action(async () => {
  console.log(config);
});

cli.command("use-context", "use specific server context")
    .option("-k, --api-key <api-key>", "Your rebyte api key")
    .action(async (options) => {
  const key = options.apiKey;
  // lookup config to find api key match with key
  // if not found, return error

  const server = config.servers.find((c) => c.api_key === key);
  if (!server) {
    console.log("api key not found");
    return;
  }
  const success = await login(key, server.url);
  if (success) {
    console.log("Login successfully 🎉");
  } else {
    console.log("Login failed, api key is invalidate");
  }
});

cli.command("logout", "Logout current project").action(async () => {
  // todo(cj): implement logout
  console.log("logout not implement yet");
});

cli
  .command("list-agent", "List all agent belong to project")
  .action(async () => {
    await list_agent();
  });

// cli
//   .command("list-knowledge", "List all knowledge belong to project")
//   .action(async () => {
//     await list_knowledge();
//   });

cli
  .command("list-extension", "List all extensions belong to project")
  .action(async () => {
    await list_extension();
  });

cli
  .command("list-file", "List all agent belong to project")
  .action(async () => {
    await list_file();
  });

cli
  .command("upload-file", "upload file to rebyte for further processing")
  .option("-f, --file <file>", "path to upload")
  .action(async (options) => {
    const file = options.file;
    await upload_file(file);
  });

cli
  .command("deploy <dir>", "deploy your extension to rebyte")
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir);
    await deploy(dir, rebyte);
  })
  .example("rebyte deploy .");

cli
  .command("index <dir>", "import files in directory to knowledge")
  .option("-k, --knowledge <knowledge>", "knowledge name")
  .action(async (dir, options) => {
    await import_dir(dir, options.knowledge);
  });

cli
  .command("create-thread", "Create thread")
  .option("-m, --metadata <metadata>", "A key-value JSON string of metadata")
  .action(async (options) => {
    await createThread(options.metadata);
  });

cli
  .command("list-threads", "List threads")
  .option("-l, --limit <limit>", "A limit on the number of objects. Defaults to 20")
  .option("-o, --order <order>", "asc for ascending order and desc for descending order. Defaults to desc")
  .option("-a, --after <after>", "An object ID that defines your place in the list")
  .option("-b, --before <before>", "An object ID that defines your place in the list")
  .action(async (options) => {
    await listThreads(options);
  });

cli
  .command("create-knowledge", "Create knowledge")
  .option("-n, --name <name>", "The name of the knowledge. Must unique in your project")
  .option("-d, --description <description>", "The description of the knowledge. Description must be less than 255 chars and more than 32 chars")
  .option("-v, --visibility <visibility>", "The visibility of the knowledge, 'private' or 'public'. Default: private")
  .option("-e, --embedder <embedder>", "The embedder id, available values is 'openai.text-embedding-ada-002', 'openai.text-embedding-3-small'(team only), 'openai.text-embedding-3-large'(team only), 'voyage.voyage-02'(team only), 'voyage.voyage-lite-02-instruct'(team only), 'voyage.voyage-code-02'(team only), Default: openai.text-embedding-ada-002")
  .option("-c, --chunkSize <chunkSize>", "The chunk size, must not be greater than embedder max context length, Default: 384")
  .action(async (options) => {
    await createKnowledge(
      options.name,
      options.description,
      options.visibility || "private",
      options.embedder || "openai.text-embedding-ada-002",
      options.chunkSize || 384
    )
  });
cli
  .command("insert-text", "Insert text to knowledge")
  .option("-k, --knowledgeName <knowledgeName>", "The name of the knowledge.")
  .option("-d, --documentId <documentId>", "The documentId in the knowledge of this text. Description unique in your project")
  .option("-t, --text <text>", "The text content to be inserted")
  .action(async (options) => {
    await insertTextToKnowledge(
      options.knowledgeName,
      options.documentId,
      options.text,
    )
  });

cli
  .command("get-thread <thread>", "Retrieve thread by ID")
  .action(async (thread) => {
    await getThread(thread);
  });

cli
  .command("update-thread <thread>", "Modify thread by ID")
  .option("-m, --metadata <metadata>", "A key-value JSON string of metadata")
  .action(async (thread, options) => {
    await updateThread(thread, options.metadata);
  });

cli
  .command("create-message <thread>", "Create message on thread")
  .option("-c, --content <content>", "Message content")
  .option("-m, --metadata <metadata>", "A key-value JSON string of metadata")
  .action(async (thread, options) => {
    await createMessage(thread, options.content, options.metadata);
  });

cli
  .command("list-messages <thread>", "List messages on thread")
  .option("-l, --limit <limit>", "A limit on the number of objects. Defaults to 20")
  .option("-o, --order <order>", "asc for ascending order and desc for descending order. Defaults to desc")
  .option("-a, --after <after>", "An object ID that defines your place in the list")
  .option("-b, --before <before>", "An object ID that defines your place in the list")
  .action(async (thread, options) => {
    await listMessages(thread, options);
  });

cli
  .command("get-message <thread> <message>", "Retrieve message by ID")
  .action(async (thread, message) => {
    await getMessage(thread, message);
  });

cli
  .command("update-message <thread> <message>", "Modify message by ID")
  .option("-m, --metadata <metadata>", "A key-value JSON string of metadata")
  .action(async (thread, message, options) => {
    await updateMessage(thread, message, options.metadata);
  });

cli
  .command("list-runs <thread>", "List runs on thread")
  .option("-l, --limit <limit>", "A limit on the number of objects. Defaults to 20")
  .option("-o, --order <order>", "asc for ascending order and desc for descending order. Defaults to desc")
  .option("-a, --after <after>", "An object ID that defines your place in the list")
  .option("-b, --before <before>", "An object ID that defines your place in the list")
  .action(async (thread, options) => {
    await listRuns(thread, options);
  });

cli
  .command("get-run <run>", "Retrieve run by ID")
  .action(async (run) => {
    await getRun(run);
  });

async function update() {
  const isDev= Deno.env.get("REBYTE_CLI_DEV") === "1";
  if (isDev) {
    return true;
  }
  const response = await fetch(
    "https://api.github.com/repos/ReByteAI/rebyte-cli/releases/latest",
  );
  const latestVersion = JSON.parse(await response.text()).tag_name;
  // remove v from version
  const latestVersionNumber = latestVersion.substring(1);
  const currentVersionNumber = version.substring(1);
  if (compareVersion(currentVersionNumber, latestVersionNumber)) {
    console.log(
      `New version ${latestVersion} found, please update to latest version, run: wget -qO- https://raw.githubusercontent.com/rebyteai/rebyte-cli/main/install.sh | sudo sh -`,
    );
    return false;
  } else {
    console.log("You are using latest version");
    return true;
  }
}

// whether we're running from prod or locally

const latest = await update();
if (!latest) {
  Deno.exit(1);
}
cli.help();
cli.version(version);
cli.outputHelp();
const parsed = cli.parse();
