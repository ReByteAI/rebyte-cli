import { cac } from "https://unpkg.com/cac@6.7.14/mod.ts";
import { config, login } from "./config.ts";
import {
  deploy, import_dir,
  list_agent,
  list_extension, list_knowledge,
  newRebyteJson,
} from "./rebyte.ts";
import { version } from "./version.ts";

const cli = cac("rebyte");

cli.command("update", "Update rebyte cli to latest version")
    .action(async () => {
      console.log("update not implement yet");
    });

cli.command("login", "Login rebyte use your api key")
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

cli.command("get-context", "show current context")
    .action(async () => {
      console.log(config)
    });

cli.command("logout", "Logout current project")
  .action(async () => {
    // todo(cj): implement logout
    console.log("logout not implement yet");
  });

cli.command("list-agent", "List all agent belong to project")
  .action(async () => {
    await list_agent();
  });

cli.command("list-knowledge", "List all knowledge belong to project")
    .action(async () => {
      await list_knowledge();
    });

cli.command("list-extension", "List all extensions belong to project")
  .action(async () => {
    await list_extension();
  });

cli.command("deploy <dir>", "deploy your extension to rebyte")
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir);
    await deploy(dir, rebyte);
  }).example("rebyte deploy .");

cli.command("index <dir>", "index files in directory to specific knowledge")
    .option("-k, --knowledge <knowledge>", "knowledge name")
    .action(async (dir, options) => {
      await import_dir(dir, options.knowledge);
    });

cli.help()
cli.version(version)
cli.outputHelp();
const parsed = cli.parse()
