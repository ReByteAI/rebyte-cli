import { homedir } from "https://deno.land/std@0.110.0/node/os.ts";
import { RebyteAPI } from "./client.ts";

const CONFIG_FILE_NAME = "config.json"

export type RebyteServer = {
  url: string,
  api_key: string
}

class RebyteConfig {
  
  config_dir: string
  api_key?: string
  servers: RebyteServer[]

  constructor() {
    const home = homedir()
    if (!home) {
      throw Error("Can't find home dir")
    }
    this.config_dir = home + "/.rebyte"
    this.servers = []
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

  activeServer(): RebyteServer | undefined {
    if (!this.api_key) {
      return
    }
    return this.servers.find(s => s.api_key === this.api_key)
  }

  async save() {
    Deno.mkdirSync(this.config_dir, { recursive: true });
    
    await this.writeJson(this.config_dir + "/" + CONFIG_FILE_NAME)
  }

  async writeJson(filePath: string) {
    await Deno.writeTextFile(filePath, JSON.stringify(this, null, 2), { create: true });
  }
}
export const config = new RebyteConfig()
await config.restore()

export async function login(api_key: string, url: string): Promise<boolean> {
  const client = new RebyteAPI({api_key, url})
  const logged = await client.ping()
  if (!logged) {
    return false
  }
  config.api_key = api_key
  config.servers.push({ api_key, url })
  await config.save()
  return true
}