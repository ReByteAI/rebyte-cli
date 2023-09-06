import { homedir } from "https://deno.land/std@0.110.0/node/os.ts";

const CONFIG_FILE_NAME = "config.json"

class RebyteConfig {
  
  config_dir: string
  api_key?: string

  constructor() {
    const home = homedir()
    if (!home) {
      throw Error("Can't find home dir")
    }
    this.config_dir = home + "/.rebyte"
  }
  async restore() {
    const filePath = this.config_dir + "/" + CONFIG_FILE_NAME;
    try {
      const cachedConfig = JSON.parse(await Deno.readTextFile(filePath));
      if (cachedConfig && cachedConfig.api_key) {
        this.api_key = cachedConfig.api_key
      }
    } catch (_) {
      // ignore
    }
  }

  async save() {
    Deno.mkdirSync(this.config_dir, { recursive: true });
    
    await this.writeJson(this.config_dir + "/" + CONFIG_FILE_NAME)
  }

  async writeJson(filePath: string) {
    await Deno.writeTextFile(filePath, JSON.stringify(this, null, 2), { create: true });
  }
}
const config = new RebyteConfig()
await config.restore()

export async function login(key: string) {
    config.api_key = key
    //todo assert key is validate
    await config.save()
}