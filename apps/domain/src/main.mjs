import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FileFakeEmailClient } from "./adapters/fake-email-client.mjs";
import { SqliteStore } from "./adapters/sqlite-store.mjs";
import { loadFixtures } from "./fixtures.mjs";
import { createReferenceServer } from "./http/server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(root, ".data");
const databasePath = path.join(dataDirectory, "reference.sqlite");
await mkdir(dataDirectory, { recursive: true });

const databaseExists = await access(databasePath).then(() => true, () => false);
const store = new SqliteStore(databasePath);
if (!databaseExists) {
  const emailClient = new FileFakeEmailClient(path.join(dataDirectory, "fake-email-outbox.json"));
  await loadFixtures(store, emailClient);
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const server = createReferenceServer({ store });
server.listen(port, "127.0.0.1", () => {
  console.log(`Workshop registration reference API listening on http://127.0.0.1:${port}`);
});

const close = () => server.close(() => {
  store.close();
  process.exit(0);
});
process.on("SIGINT", close);
process.on("SIGTERM", close);
