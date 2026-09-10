/**
 * Who is asking. The stand-in sign-in proves nothing about a participant, but
 * it is the only place the service learns which one is asking, so every subject
 * rule downstream of it depends on it resolving exactly one.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  endSession,
  readSignInDirectory,
  resolveSession,
  sessionTokenFromHeaders,
  startSession
} from "../src/identity/sessions.mjs";
import { freshCatalogue, participants, seededAt } from "./support/catalogue.mjs";

describe("signing in as a seeded participant", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("offers every seeded participant to sign in as", () => {
    const directory = readSignInDirectory(database);

    assert.equal(directory.length, 5);
    assert.deepEqual(Object.keys(directory[0]).sort(), ["email", "id", "name"]);
    assert.ok(directory.some((participant) => participant.id === participants.ada));
  });

  it("hands back a token that resolves to the participant it was issued for", () => {
    const session = startSession(database, participants.grace, seededAt);

    assert.equal(session.participant.id, participants.grace);
    assert.equal(resolveSession(database, session.token).id, participants.grace);
  });

  it("gives every sign-in its own token", () => {
    const first = startSession(database, participants.grace, seededAt);
    const second = startSession(database, participants.alan, seededAt);

    assert.notEqual(first.token, second.token);
    assert.equal(resolveSession(database, first.token).id, participants.grace);
    assert.equal(resolveSession(database, second.token).id, participants.alan);
  });

  it("will not sign in as somebody who is not in the directory", () => {
    assert.equal(startSession(database, "participant-nobody", seededAt), null);
  });

  it("resolves nothing for a token it never issued", () => {
    assert.equal(resolveSession(database, "not-a-token"), null);
    assert.equal(resolveSession(database, ""), null);
    assert.equal(resolveSession(database, undefined), null);
  });

  it("stops resolving a token once the session ends", () => {
    const session = startSession(database, participants.grace, seededAt);

    assert.equal(endSession(database, session.token), true);
    assert.equal(resolveSession(database, session.token), null);
    assert.equal(endSession(database, session.token), false);
  });

  it("reads a token out of a bearer authorization header", () => {
    assert.equal(sessionTokenFromHeaders({ authorization: "Bearer abc123" }), "abc123");
    assert.equal(sessionTokenFromHeaders({ authorization: "bearer abc123" }), "abc123");
  });

  it("reads no token out of anything else", () => {
    assert.equal(sessionTokenFromHeaders({}), null);
    assert.equal(sessionTokenFromHeaders({ authorization: "Basic abc123" }), null);
    assert.equal(sessionTokenFromHeaders({ authorization: "Bearer   " }), null);
    assert.equal(sessionTokenFromHeaders(undefined), null);
  });
});
