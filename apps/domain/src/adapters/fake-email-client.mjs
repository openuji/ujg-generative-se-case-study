import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export class MemoryFakeEmailClient {
  messages = [];

  async reset() {
    this.messages = [];
  }

  async send(message) {
    this.messages.push(structuredClone(message));
  }
}

export class FileFakeEmailClient extends MemoryFakeEmailClient {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async flush() {
    await mkdir(path.dirname(this.filename), { recursive: true });
    await writeFile(this.filename, `${JSON.stringify(this.messages, null, 2)}\n`);
  }
}
