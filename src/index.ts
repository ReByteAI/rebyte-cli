import { cac } from "https://unpkg.com/cac@6.7.14/mod.ts";
import { login } from "./config.ts";
import {
  deploy, import_dir,
  list_callable,
  list_jsbundle,
  newRebyteJson,
} from "./rebyte.ts";
import { version } from "./version.ts";

const cli = cac("rebyte");

cli.command("login", "Login rebyte use your api key")
  .option("-k, --api-key <api-key>", "Your rebyte api key")
  .option(
    "-u, --url <server-url>",
    "Your rebyte server url, default is: https://rebyte.ai",
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
    console.log("list callable");
  });

cli.command("list-callable", "List all callable belong to you")
  .action(async () => {
    console.log("list callable");
    await list_callable();
  });

cli.command("list-jsbundle", "List all jsbundle belong to project")
  .action(async () => {
    console.log("list jsbundle");
    await list_jsbundle();
  });

cli.command("deploy <dir>", "deploy your main file to rebyte")
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir);
    await deploy(dir, rebyte);
  });

cli.command("import <dir>", "import dir to knowledges")
    .action(async (dir) => {
      const rebyte = await newRebyteJson(dir);
      await import_dir(dir, rebyte);
    });

cli.version(version)
cli.outputHelp();
cli.parse();
