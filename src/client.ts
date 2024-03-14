import { readableStreamFromReader } from "https://deno.land/std@0.201.0/streams/mod.ts";
import FormDataV2 from "npm:form-data";
import { typeByExtension } from "mimetypes";
import { RebyteJson } from "./rebyte.ts";
import { RebyteServer } from "./config.ts";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { AppRouter } from "./router.ts";
import * as path from "path";
import { ListQuery, ListResult, listQueryString } from "./pagination.ts";
import { ExternalFileType, KnowledgeType, KnowledgeVisibility, MessageType, RunType, ThreadType } from "./types.ts";

export class RebyteAPI {
  key: string;
  server: string;
  sdkBase: string;
  trpc: any;
  pId: string;

  constructor(server: RebyteServer) {
    this.key = server.api_key;
    this.server = server.url;
    this.sdkBase = server.url + "/api/sdk";
    this.pId = server.pId;

    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${server.url}/api/trpc`,
          // You can pass any HTTP headers you wish here
          headers() {
            return {
              Authorization: `Bearer ${server.api_key}`,
            };
          },
        }),
      ],
      //@ts-ignore: superjson type error
      transformer: superjson,
    });
    this.trpc = client;
  }

  async ping(): Promise<string | null> {
    const response = await fetch(this.sdkBase + "/ext/ping", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return null;
    }
    if (response.ok) {
      this.pId = (await response.json()).pId;
      return this.pId;
    } else {
      throw Error(`Failed to ping with server ${await response.text()} `);
    }
  }

  async getUploadURL(fileName: string): Promise<string> {
    const response = await fetch(this.sdkBase + "/ext/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
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

  async uploadExtensionFile(url: string, filePath: string) {
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
    return exts;
  }

  async listFiles() {
    const response = await fetch(this.sdkBase + "/files", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.files
    } else {
      throw Error(`Failed to list files ${await response.text()} `);
    }
  }

  async uploadFile(filePath: string) {
    const decoder = new TextDecoder("utf-8");
    const f = Deno.readFileSync(filePath);
    const formData = new FormDataV2();
    const file_extension = filePath.split(".").pop();
    let mime_type = "application/octet-stream";
    if (file_extension && typeByExtension(file_extension)) {
      mime_type = typeByExtension(file_extension) as string;
    }
    formData.append('file', decoder.decode(f), {
      filename: path.basename(filePath),
      contentType: mime_type
    });

    const response = await fetch(this.sdkBase + "/files", {
      method: "POST",
      headers: formData.getHeaders({
        Authorization: `Bearer ${this.key}`,
      }),
      body: formData.getBuffer(),
    });
    if (!response.ok) {
      throw Error(`Failed to upload file: ${await response.text()}`);
    }
    const file_info = await response.json();
    return file_info;
  }

  async getFileById(id: string) {
    const response = await fetch(this.sdkBase + "/files/" + id, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.key}`,
      },
    });
    if (!response.ok) {
      throw Error(`Failed to upload file: ${await response.text()}`);
    }
    const file_info = await response.json();
    return file_info.file as ExternalFileType;
  }

  async downloadFileById(id: string, output: string) {
    const response = await fetch(this.sdkBase + "/files/" + id + "/content", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.key}`,
      },
    });
    if (!response.ok) {
      throw Error(`Failed to upload file: ${await response.text()}`);
    }
    const file = await Deno.open(output, {write: true, create: true});
    await file.write(new Uint8Array(await response.arrayBuffer()));
    return "file saved to " + output;
  }

  async deleteFileById(id: string) {
    const response = await fetch(this.sdkBase + "/files/" + id, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.key}`,
      },
    });
    if (!response.ok) {
      throw Error(`Failed to upload file: ${await response.text()}`);
    }
    const file_info = await response.json();
    return file_info;
  }

  async checkValidVersion(rebyte: RebyteJson) {
    const response = await fetch(this.sdkBase + "/ext/check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
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
    const response = await fetch(this.sdkBase + `/ext/${rebyte.name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
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
    return exts["json"];
  }

  async upsertDoc(
    knowledgeName: string,
    file: Deno.DirEntry,
    baseDir: string,
  ): Promise<string> {
    console.log("upserting doc: ", file.name);
    const urlSafeName = encodeURIComponent(knowledgeName);
    const url = `${this.sdkBase}/p/${this.pId}/knowledge/${urlSafeName}/d/${file.name}/upload`;

    const fileContent = await Deno.readFile(path.join(baseDir, file.name));

    const form = new FormData();
    form.append(
      "file",
      new Blob([fileContent], {
        type: file.name.endsWith(".pdf") ? "application/pdf" : "text/plain",
      }),
      file.name,
    );
    form.append("knowledgeName", knowledgeName);

    try {
      const response = await fetch(url, {
        method: "POST",
        body: form,
        headers: {
          Authorization: `Bearer ${this.key}`,
        },
      });
      console.log("upserted doc success: ", file.name);
      return response.statusText;
    } catch (error) {
      console.log(error);
      throw Error(`Failed to index file ${file.name}`);
    }
  }

  async createThread(metadata?: string) {
    const url = `${this.sdkBase}/threads`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metadata: metadata ? JSON.parse(metadata) : undefined
      })
    });
    if (response.ok) {
      return await response.json() as ThreadType;
    } else {
      throw Error(`Failed to create thread ${JSON.stringify(await response.json())}`);
    }
  }

  async listThreads(query: ListQuery) {
    const url = `${this.sdkBase}/threads?${listQueryString(query)}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}`},
    });
    if (response.ok) {
      return await response.json() as ListResult<ThreadType>;
    } else {
      throw Error(`Failed to list threads ${JSON.stringify(await response.json())}`);
    }
  }

  async createKnowledge(
    name: string,
    description: string,
    visibility: KnowledgeVisibility,
    embedder: string,
    chunkSize: number
  ) {
    const url = `${this.sdkBase}/p/${this.pId}/knowledge`
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        visibility,
        embedder,
        chunkSize,
        provider: "files" // Only support create files knowledge through API
      })
    });
    if (response.ok) {
      return await response.json() as { knowledge: KnowledgeType };
    } else {
      throw Error(`Failed to create knowledge ${JSON.stringify(await response.json())}`);
    }
  }

  async insertContentToKnowledge(
    knowledgeName: string,
    documentId: string,
    text: string,
  ) {
    const url = `${this.sdkBase}/p/${this.pId}/knowledge/${knowledgeName}/d`
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
        text,
      })
    });
    if (response.ok) {
      return await response.json() as { documentId: string, textSize: number };
    } else {
      throw Error(`Failed to insert text  to knowledge ${JSON.stringify(await response.json())}`);
    }
  }

  async getThread(threadId: string) {
    const url = `${this.sdkBase}/threads/${threadId}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}`},
    });
    if (response.ok) {
      return await response.json() as ThreadType;
    } else {
      throw Error(`Failed to get thread ${JSON.stringify(await response.json())}`);
    }
  }

  async updateThread(threadId: string, metadata?: string) {
    const url = `${this.sdkBase}/threads/${threadId}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metadata: metadata ? JSON.parse(metadata) : undefined
      })
    });
    if (response.ok) {
      return await response.json() as ThreadType;
    } else {
      throw Error(`Failed to update thread ${JSON.stringify(await response.json())}`);
    }
  }

  async createMessage(threadId: string, content: string, metadata?: string) {
    const url = `${this.sdkBase}/threads/${threadId}/messages`
    const message: MessageType = {
      role: "user",
      content,
      metadata: metadata ? JSON.parse(metadata) : undefined
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message)
    });
    if (response.ok) {
      return await response.json() as MessageType;
    } else {
      throw Error(`Failed to create message ${JSON.stringify(await response.json())}`);
    }
  }

  async listMessages(threadId: string, query: ListQuery) {
    const url = `${this.sdkBase}/threads/${threadId}/messages?${listQueryString(query)}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}`},
    });
    if (response.ok) {
      return await response.json() as ListResult<MessageType>;
    } else {
      throw Error(`Failed to list messages ${JSON.stringify(await response.json())}`);
    }
  }

  async getMessage(threadId: string, messageId: string) {
    const url = `${this.sdkBase}/threads/${threadId}/messages/${messageId}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}`},
    });
    if (response.ok) {
      return await response.json() as MessageType;
    } else {
      throw Error(`Failed to get message ${JSON.stringify(await response.json())}`);
    }
  }

  async updateMessage(threadId: string, messageId: string, metadata?: string) {
    const url = `${this.sdkBase}/threads/${threadId}/messages/${messageId}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metadata: metadata ? JSON.parse(metadata) : undefined
      })
    });
    if (response.ok) {
      return await response.json() as MessageType;
    } else {
      throw Error(`Failed to update message ${JSON.stringify(await response.json())}`);
    }
  }

  async listRuns(threadId: string, query: ListQuery) {
    const url = `${this.sdkBase}/threads/${threadId}/runs?${listQueryString(query)}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}` },
    });
    if (response.ok) {
      return await response.json() as ListResult<RunType>;
    } else {
      throw Error(`Failed to list runs ${JSON.stringify(await response.json())}`);
    }
  }

  async getRun(runId: string) {
    const url = `${this.sdkBase}/runs/${runId}`
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}`},
    });
    if (response.ok) {
      return await response.json() as RunType;
    } else {
      throw Error(`Failed to get run ${JSON.stringify(await response.json())}`);
    }
  }
}
