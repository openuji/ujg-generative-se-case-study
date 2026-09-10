/**
 * Two participants going for the same last place at the same time.
 *
 * These bookings are genuinely simultaneous: each runs on its own thread with
 * its own connection to the same catalogue file, and both are held at a barrier
 * until the other is ready. Exactly one of them may come away with the place.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { afterEach, beforeEach, describe, it } from "node:test";

import { respondToOfferedPlace } from "../src/domain/offeredPlace.mjs";
import { setOfferedPlaceStatus, takeAvailablePlace } from "../src/domain/repository.mjs";
import { closeDatabase, openDatabase } from "../src/persistence/database.mjs";
import { bootstrapCatalogue } from "../src/persistence/fixtures.mjs";
import {
  freshCatalogue,
  offers,
  participants,
  readOfferRow,
  readParticipationRow,
  seededAt,
  shortlyAfter,
  workshops
} from "./support/catalogue.mjs";

const workerModule = fileURLToPath(new URL("./support/competingBooking.mjs", import.meta.url));

function bookInParallel({ databaseFile, workshopId, bookings }) {
  const barrier = new SharedArrayBuffer(4);
  return Promise.all(
    bookings.map(
      (booking) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(workerModule, {
            workerData: {
              databaseFile,
              workshopId,
              participantId: booking.participantId,
              submitted: booking.submitted,
              barrier,
              competitors: bookings.length
            }
          });
          let answer;
          worker.on("message", (message) => {
            answer = message;
          });
          worker.on("error", reject);
          worker.on("exit", () => resolve(answer));
        })
    )
  );
}

describe("two bookings competing for the same last place", () => {
  let directory;
  let databaseFile;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "workshop-catalogue-"));
    databaseFile = path.join(directory, "workshops.sqlite");
    const database = openDatabase(databaseFile);
    bootstrapCatalogue(database, seededAt);
    closeDatabase(database);
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("gives the place to exactly one of them and leaves the catalogue sound", async () => {
    const answers = await bookInParallel({
      databaseFile,
      workshopId: workshops.lastPlace,
      bookings: [
        {
          participantId: participants.grace,
          submitted: { name: "Grace Hopper", email: "grace@workshops.example" }
        },
        {
          participantId: participants.alan,
          submitted: { name: "Alan Turing", email: "alan@workshops.example" }
        }
      ]
    });

    const outcomes = answers.map((answer) => answer.outcome).sort();
    assert.deepEqual(outcomes, ["confirmed", "placeUnavailable"]);
    assert.equal(answers.filter((answer) => answer.effectApplied).length, 1);

    const database = openDatabase(databaseFile);
    try {
      const workshop = database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshops.lastPlace);
      assert.equal(workshop.remaining_places, 0);
      assert.ok(workshop.remaining_places >= 0);
      assert.equal(workshop.registration_availability, "waitlistOpen");

      const booked = database
        .prepare("SELECT * FROM workshop_participations WHERE workshop_id = ? AND participation_status = 'confirmed'")
        .all(workshops.lastPlace);
      assert.equal(booked.length, 1);
      assert.equal(
        booked[0].participant_id,
        answers.find((answer) => answer.outcome === "confirmed").participantId
      );
    } finally {
      closeDatabase(database);
    }
  });

  it("holds when four bookings go for one place at once", async () => {
    const answers = await bookInParallel({
      databaseFile,
      workshopId: workshops.lastPlace,
      bookings: [participants.grace, participants.alan, participants.katherine, participants.mary].map(
        (participantId) => ({
          participantId,
          submitted: { name: "Someone", email: `${participantId}@workshops.example` }
        })
      )
    });

    assert.equal(answers.filter((answer) => answer.outcome === "confirmed").length, 1);
    assert.equal(answers.filter((answer) => answer.outcome === "placeUnavailable").length, 3);

    const database = openDatabase(databaseFile);
    try {
      const workshop = database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshops.lastPlace);
      assert.equal(workshop.remaining_places, 0);
      assert.equal(workshop.registration_availability, "waitlistOpen");
    } finally {
      closeDatabase(database);
    }
  });
});

describe("the guards a competing command runs into", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("only lets one command take the last place", () => {
    assert.equal(takeAvailablePlace(database, workshops.lastPlace), 1);
    assert.equal(takeAvailablePlace(database, workshops.lastPlace), 0);

    const workshop = database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshops.lastPlace);
    assert.equal(workshop.remaining_places, 0);
    assert.equal(workshop.registration_availability, "waitlistOpen");
  });

  it("refuses to take a place from a workshop that is not offering one", () => {
    assert.equal(takeAvailablePlace(database, workshops.waitlistOpen), 0);
    assert.equal(takeAvailablePlace(database, workshops.closed), 0);
  });

  it("only lets one answer settle an offered place", () => {
    assert.equal(setOfferedPlaceStatus(database, offers.waiting, "accepted", "available"), 1);
    assert.equal(setOfferedPlaceStatus(database, offers.waiting, "declined", "available"), 0);
    assert.equal(readOfferRow(database, offers.waiting).offered_place_status, "accepted");
  });

  it("keeps an offer's own answer authoritative when a second one follows it", () => {
    assert.equal(
      respondToOfferedPlace({
        database,
        offeredPlaceId: offers.waiting,
        participantId: participants.grace,
        response: "accept",
        now: shortlyAfter
      }).outcome,
      "accepted"
    );

    const second = respondToOfferedPlace({
      database,
      offeredPlaceId: offers.waiting,
      participantId: participants.grace,
      response: "decline",
      now: shortlyAfter
    });

    assert.equal(second.outcome, "alreadyAccepted");
    assert.equal(second.effectApplied, false);
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.grace).participation_status,
      "confirmed"
    );
  });
});
