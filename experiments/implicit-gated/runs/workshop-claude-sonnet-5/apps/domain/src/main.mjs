import http from "node:http";
import { openDatabase, defaultDatabaseFile, seedFixtures } from "./db.mjs";
import { createRequestHandler } from "./http.mjs";
import { getOffer } from "./domain.mjs";
import { deliverOfferedPlaceEmail } from "./email.mjs";

const port = Number(process.env.PORT ?? 4000);
const appBaseUrl = process.env.APP_BASE_URL ?? `http://localhost:${port}`;
const databaseFile = process.env.DATABASE_FILE ?? defaultDatabaseFile();

const db = openDatabase({ file: databaseFile });
seedFixtures(db);

for (const offerId of ["fixture-offer-open", "fixture-offer-expired"]) {
  const offer = getOffer(db, offerId);
  if (!offer) continue;
  const { offerUrl } = deliverOfferedPlaceEmail({
    offerId: offer.id,
    workshopTitle: offer.workshopTitle,
    expiresAt: offer.expiresAt,
    appBaseUrl
  });
  console.log(`Offered-place email delivered (fake): ${offerUrl}`);
}

const server = http.createServer(createRequestHandler({ db }));
server.listen(port, () => {
  console.log(`Workshop domain engine listening on ${appBaseUrl}`);
  console.log(`API docs: ${appBaseUrl}/docs`);
});
