import { readableStreamFromReader } from "https://deno.land/std@0.201.0/streams/mod.ts";
import { RebyteJson } from "./rebyte.ts";
import { RebyteServer } from "./config.ts";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import {AppRouter} from "./router.ts";

var env = Deno.env.toObject();

export class RebyteAPI {
  key: string;
  base: string;
  trpc: any;
  pId: string

  constructor(server: RebyteServer) {
    this.key = server.api_key;
    this.base = server.url + "/api/sdk";
    this.pId = server.pId

    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${server.url}/api/trpc`,
          // You can pass any HTTP headers you wish here
          headers() {
            return {
              "Authorization": `Bearer ${server.api_key}`,
            };
          },
        }),
      ],
    });
    this.trpc = client
  }

  async ping(): Promise<string | null> {
    const response = await fetch(this.base + "/ext/ping", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return null;
    }
    if (response.ok) {
      this.pId = (await response.json()).pId
      return this.pId
    } else {
      throw Error(`Failed to ping with server ${await response.text()} `);
    }
  }

  async getUploadURL(fileName: string): Promise<string> {
    const response = await fetch(this.base + "/ext/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.url;
    } else {
      throw Error(`Failed to get upload url: `);
    }
  }

  async uploadFile(url: string, filePath: string) {
    const f = await Deno.open(filePath);
    const response = await fetch(url, {
      method: "PUT",
      body: readableStreamFromReader(f),
      headers: {
        "Content-Type": "text/javascript",
      },
    });
    if (!response.ok) {
      throw Error(`Failed to upload file: ${response.statusText}`);
    }
  }

  async listAgents() {
    const exts = await this.trpc["callable.getCallables"].query();
    return exts['json']
  }

  async checkValidVersion(rebyte: RebyteJson) {
    const response = await fetch(this.base + "/ext/check", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: rebyte.name, version: rebyte.version }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
    } else {
      throw Error(`Failed to check name ${await response.text()} `);
    }
  }

  async createExtension(rebyte: RebyteJson, fileId: string) {
    const response = await fetch(this.base + `/ext/${rebyte.name}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...rebyte, fileId }),
    });

    if (!response.ok) {
      throw Error(`Failed to create extension err: ${await response.text()} `);
    }
  }

  async getExtensions() {
    const exts = await this.trpc["extension.get"].query();
    return exts['json']
  }

  async upsertDoc(knowledgeName: string, file: string): Promise<string> {
    const urlSafeName = encodeURIComponent(knowledgeName);
    const url = `${this.base}/p/${this.pId}/knowledge/${urlSafeName}/d/${file}`

    const runnerRequestConfig = {
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    };

    const timestamp = Date.now();
    const runnerRequestPayload = {
      text: "",
      source_url: "",
      timestamp,
      tags: [],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: runnerRequestConfig.headers,
      body: JSON.stringify(runnerRequestPayload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("upserted doc success: ", file)
      return data
    } else {
      console.log(response.status)
      console.log(await response.json())
      throw Error(`Failed to index file ${file}`);
    }
  }
}