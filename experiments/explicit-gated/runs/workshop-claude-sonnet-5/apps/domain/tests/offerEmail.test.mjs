/**
 * The message a participant is written to with while a place is being held for
 * them: it is the product's own authored message, composed from its own parts,
 * and it goes to a delivery stand-in that keeps everything in this process.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { offerSummary } from "../src/domain/presentation.mjs";
import { createMailbox } from "../src/messaging/mailbox.mjs";
import { offerLink, renderOfferEmail } from "../src/messaging/offerEmail.mjs";
import { freshCatalogue, offers, participants, readOfferRow, seededAt, workshops } from "./support/catalogue.mjs";

function seededSummary() {
  const database = freshCatalogue();
  try {
    const offer = readOfferRow(database, offers.waiting);
    const workshop = database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshops.offering);
    return offerSummary(offer, workshop);
  } finally {
    database.close();
  }
}

describe("where the message's link goes", () => {
  it("points at the offer inside the application", () => {
    assert.equal(
      offerLink("https://workshops.example/app", offers.waiting),
      "https://workshops.example/app/#/offers/offer-grace-inclusive-copy"
    );
  });

  it("does not double up a trailing separator", () => {
    assert.equal(offerLink("https://workshops.example/", "offer-1"), "https://workshops.example/#/offers/offer-1");
  });

  it("keeps an awkward identifier safe in the address", () => {
    assert.match(offerLink("https://workshops.example", "offer a/b"), /offers\/offer%20a%2Fb$/);
  });
});

describe("rendering the message", () => {
  it("composes the offer body and the link into the product's offer message", () => {
    const rendered = renderOfferEmail({
      summary: seededSummary(),
      href: "https://workshops.example/app/#/offers/offer-grace-inclusive-copy"
    });

    assert.match(rendered.html, /^<!doctype html>/);
    assert.match(rendered.html, /<section class="[^"]+">/);
    assert.match(rendered.html, /A place has opened up/);
    assert.match(rendered.html, /<dt[^>]*>Workshop<\/dt><dd[^>]*>Inclusive Copywriting<\/dd>/);
    assert.match(rendered.html, /<dt[^>]*>Offer expires<\/dt>/);
    assert.match(rendered.html, /<footer class="[^"]+"><a class="[^"]+" href="https:\/\/workshops\.example\/app\/#\/offers\/offer-grace-inclusive-copy">Open the offer<\/a><\/footer>/);
  });

  it("names the workshop in the subject", () => {
    const rendered = renderOfferEmail({ summary: seededSummary(), href: "https://workshops.example" });

    assert.equal(rendered.subject, "A place has opened up — Inclusive Copywriting");
  });

  it("carries a stylesheet when one is given, and none when it is not", () => {
    const summary = seededSummary();

    assert.match(
      renderOfferEmail({ summary, href: "https://x", stylesheetHref: "/styles.css" }).html,
      /<link rel="stylesheet" href="\/styles\.css">/
    );
    assert.doesNotMatch(renderOfferEmail({ summary, href: "https://x" }).html, /<link rel="stylesheet"/);
  });

  it("does not let a title carry markup into the page head", () => {
    const rendered = renderOfferEmail({
      summary: { ...seededSummary(), title: "<script>alert(1)</script>" },
      href: "https://x"
    });

    assert.match(rendered.html, /<title>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/title>/);
  });
});

describe("the delivery stand-in", () => {
  const message = { to: "grace@workshops.example", subject: "s", html: "<p>h</p>" };

  it("keeps what it was handed, against the participant it was for", () => {
    const mailbox = createMailbox();
    const record = mailbox.deliver({ participantId: participants.grace, ...message, deliveredAt: seededAt });

    assert.equal(record.deliveredAt, seededAt.toISOString());
    assert.deepEqual(mailbox.read(participants.grace), [record]);
    assert.deepEqual(mailbox.read(participants.alan), []);
  });

  it("puts the newest message first", () => {
    const mailbox = createMailbox();
    mailbox.deliver({ participantId: participants.grace, ...message, subject: "first" });
    mailbox.deliver({ participantId: participants.grace, ...message, subject: "second" });

    assert.deepEqual(mailbox.read(participants.grace).map((entry) => entry.subject), ["second", "first"]);
  });

  it("keeps only the most recent few", () => {
    const mailbox = createMailbox({ retainPerParticipant: 2 });
    for (const subject of ["one", "two", "three"]) {
      mailbox.deliver({ participantId: participants.grace, ...message, subject });
    }

    assert.deepEqual(mailbox.read(participants.grace).map((entry) => entry.subject), ["three", "two"]);
  });

  it("forgets everything when it is cleared", () => {
    const mailbox = createMailbox();
    mailbox.deliver({ participantId: participants.grace, ...message });
    mailbox.clear();

    assert.deepEqual(mailbox.readAll(), []);
  });
});
