import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EmailOfferMessage,
  EmailOfferContent,
  EmailLinkControl
} from "@workshop-claude-sonnet/design-system";

const here = path.dirname(fileURLToPath(import.meta.url));
const outboxDir = path.resolve(here, "../.data/outbox");

function renderOfferEmail({ workshopTitle, expiresAt, offerUrl }) {
  const body = createElement(EmailOfferContent, {
    title: "A place opened up",
    message: `A registration place for ${workshopTitle} has become available for you.`,
    workshopTitle,
    expiresAt
  });
  const link = createElement(EmailLinkControl, { label: "View your offer", href: offerUrl });
  const markup = renderToStaticMarkup(createElement(EmailOfferMessage, { emailBody: body, emailLinkAction: link }));
  return `<!doctype html><html><head><meta charset="utf-8"><title>A place opened up</title></head><body>${markup}</body></html>`;
}

/**
 * Stands in for the email touchpoint's fake-client delivery adapter: instead
 * of sending real mail, the rendered message is written to a local outbox
 * file so the offer link can be inspected and followed manually or in tests.
 */
export function deliverOfferedPlaceEmail({ offerId, workshopTitle, expiresAt, appBaseUrl }) {
  fs.mkdirSync(outboxDir, { recursive: true });
  const offerUrl = `${appBaseUrl}/offers/${offerId}`;
  const html = renderOfferEmail({ workshopTitle, expiresAt, offerUrl });
  const target = path.join(outboxDir, `${offerId}.html`);
  fs.writeFileSync(target, html);
  return { target, offerUrl };
}

export function readOutbox() {
  if (!fs.existsSync(outboxDir)) return [];
  return fs.readdirSync(outboxDir).filter((name) => name.endsWith(".html"));
}

export function outboxDirectory() {
  return outboxDir;
}
