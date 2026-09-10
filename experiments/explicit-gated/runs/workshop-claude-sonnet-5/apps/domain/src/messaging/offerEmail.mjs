/**
 * The offered-place email.
 *
 * The email a participant receives is the same authored message the product's
 * visual library already ships, rendered to HTML on the server: the offer
 * message with the offer's own body inside it and a link back into the
 * application. Nothing about the message is written twice — the body reads the
 * same offer summary document the offer screen reads.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLinkControl, EmailOfferContent, EmailOfferMessage } from "@workshop/design-system";

const documentType = "<!doctype html>";

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Where the email's link takes the participant in the workshop application. */
export function offerLink(appBaseUrl, offeredPlaceId) {
  const base = appBaseUrl.endsWith("/") ? appBaseUrl.slice(0, -1) : appBaseUrl;
  return `${base}/#/offers/${encodeURIComponent(offeredPlaceId)}`;
}

/**
 * Renders the offer message for `summary`, an offer summary document, into a
 * complete HTML mail body plus the subject line it is sent under.
 */
export function renderOfferEmail({ summary, href, stylesheetHref }) {
  const message = renderToStaticMarkup(
    createElement(EmailOfferMessage, {
      body: createElement(EmailOfferContent, {
        title: summary.title,
        message: summary.message,
        workshopTitle: summary.workshopTitle,
        expiresAt: summary.expiresAt
      }),
      linkAction: createElement(EmailLinkControl, {
        label: "Open the offer",
        href
      })
    })
  );

  const head = [
    '<meta charset="utf-8">',
    `<title>${escapeText(summary.title)}</title>`,
    stylesheetHref === undefined ? "" : `<link rel="stylesheet" href="${escapeText(stylesheetHref)}">`
  ].join("");

  return {
    subject: `${summary.title} — ${summary.workshopTitle}`,
    html: `${documentType}<html lang="en"><head>${head}</head><body>${message}</body></html>`
  };
}
