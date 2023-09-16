import { readableStreamFromReader } from "https://deno.land/std@0.201.0/streams/mod.ts";
import { RebyteJson } from "./rebyte.ts";
import { RebyteServer } from "./config.ts";
import { AppRouter } from "./trpc-router.ts";
import { createTRPCClient } from "../deps.ts";

var env = Deno.env.toObject();

export class RebyteAPI {
  key: string;
  base: string;

  constructor(server: RebyteServer) {
    this.key = server.api_key;
    this.base = server.url + "/api/sdk";
  }

  async ping(): Promise<boolean> {
    const response = await fetch(this.base + "/block/ping", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return false;
    }
    if (response.ok) {
      return true;
    } else {
      throw Error(`Failed to ping with server ${await response.text()} `);
    }
  }

  async getUploadURL(fileName: string): Promise<string> {
    const response = await fetch(this.base + "/block/upload", {
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

  async checkJsBlockName(rebyte: RebyteJson) {
    const response = await fetch(this.base + "/block/check", {
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

  async createJsBlock(rebyte: RebyteJson, fileId: string) {
    const response = await fetch(this.base + "/block", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.key}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...rebyte, fileId }),
    });

    if (!response.ok) {
      throw Error(`Failed to create jsblock err: ${await response.text()} `);
    }
  }
}

// const client = createTRPCClient<AppRouter>({ url: 'http://localhost:5005/trpc' });
//
// try {
//   const query = await client.query("hw");
//   console.log(JSON.stringify(query));
// } catch (e) {
//   console.error(e);
// }
