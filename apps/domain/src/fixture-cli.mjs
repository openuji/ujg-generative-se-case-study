import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FileFakeEmailClient } from "./adapters/fake-email-client.mjs";
import { SqliteStore } from "./adapters/sqlite-store.mjs";
import { loadFixtures } from "./fixtures.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(root, ".data");
const databasePath = path.join(dataDirectory, "reference.sqlite");
await mkdir(dataDirectory, { recursive: true });
await rm(databasePath, { force: true });

const store = new SqliteStore(databasePath);
const emailClient = new FileFakeEmailClient(path.join(dataDirectory, "fake-email-outbox.json"));
await loadFixtures(store, emailClient);
store.close();
console.log(`Loaded reference fixtures into ${databasePath}`);
