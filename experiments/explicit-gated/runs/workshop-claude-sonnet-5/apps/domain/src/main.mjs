/**
 * The workshop service.
 *
 * Opens the catalogue, seeds it the first time it is empty, and serves the
 * product's HTTP API together with a browsable description of it.
 */

import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { descriptionPath, documentationPath, createWorkshopService } from "./http/service.mjs";
import { createMailbox } from "./messaging/mailbox.mjs";
import { bootstrapCatalogue } from "./persistence/fixtures.mjs";
import { openDatabase } from "./persistence/database.mjs";

const applicationRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultDatabaseFile = path.join(applicationRoot, ".data", "workshops.sqlite");
const defaultPort = 8787;
const defaultAppBaseUrl = "http://localhost:5173";

/** Opens the catalogue, creating its directory the first time it is needed. */
export function openCatalogue(location = defaultDatabaseFile) {
  if (location !== ":memory:") mkdirSync(path.dirname(location), { recursive: true });
  const database = openDatabase(location);
  const seeded = bootstrapCatalogue(database);
  return { database, seeded };
}

export function startWorkshopService({
  databaseLocation = process.env.WORKSHOP_DATABASE ?? defaultDatabaseFile,
  port = Number(process.env.PORT ?? defaultPort),
  host = process.env.HOST ?? "127.0.0.1",
  appBaseUrl = process.env.WORKSHOP_APP_URL ?? defaultAppBaseUrl,
  announce = console.log
} = {}) {
  const { database, seeded } = openCatalogue(databaseLocation);
  const service = createWorkshopService({ database, mailbox: createMailbox(), appBaseUrl });
  const server = createServer(service.handler);

  server.listen(port, host, () => {
    const address = server.address();
    const origin = `http://${host}:${address.port}`;
    announce(`Workshop service listening on ${origin}`);
    announce(`  API description  ${origin}${descriptionPath}`);
    announce(`  API documentation ${origin}${documentationPath}`);
    if (seeded) announce("  Catalogue seeded with its starting workshops and participants.");
  });

  return { server, database, service };
}

const isEntrypoint = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) startWorkshopService();
