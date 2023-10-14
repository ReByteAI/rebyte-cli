import { cac } from "https://unpkg.com/cac@6.7.14/mod.ts";
import { login } from "./config.ts";
import {
  deploy, import_dir,
  list_agent,
  list_extension,
  newRebyteJson,
} from "./rebyte.ts";
import { version } from "./version.ts";

const cli = cac("rebyte");

cli.command("update", "Update rebyte cli to latest version")
    .action(async () => {});

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

cli.command("logout", "Logout current project")
  .action(async () => {
    // todo(cj): implement logout
    console.log("logout not implement yet");
  });

cli.command("list-agents", "List all agent belong to you")
  .action(async () => {
    await list_agent();
  });

// cli.command("list-extensions", "List all extensions belong to project")
//   .action(async () => {
//     await list_extension();
//   });

cli.command("deploy <dir>", "deploy your extension to rebyte")
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir);
    await deploy(dir, rebyte);
  });

cli.command("import <dir>", "import dir to knowledges")
    .action(async (dir) => {
      const rebyte = await newRebyteJson(dir);
      await import_dir(dir, rebyte);
    });

cli.help()
cli.version(version)
cli.outputHelp();
cli.parse()

