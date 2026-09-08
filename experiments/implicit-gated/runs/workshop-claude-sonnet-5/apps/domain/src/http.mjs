import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absolutePath as swaggerUiAssetsPath } from "swagger-ui-dist";
import {
  listWorkshops,
  getWorkshopDetail,
  confirmRegistration,
  joinWaitlist,
  getOffer,
  acceptOffer,
  declineOffer
} from "./domain.mjs";
import { readParticipantId, issueParticipantId, participantCookie } from "./identity.mjs";
import { openApiDocument } from "./openapi.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const uiDistDir = path.resolve(here, "../../ui/dist");

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(payload);
}

function sendFile(response, filePath, contentType) {
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function resolveParticipant(request, response) {
  const existing = readParticipantId(request);
  if (existing) return existing;
  const issued = issueParticipantId();
  response.setHeader("Set-Cookie", participantCookie(issued));
  return issued;
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png"
};

function serveDocs(request, response, pathname) {
  if (pathname === "/docs") {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Workshop registration API docs</title>
<link rel="stylesheet" href="/docs/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="/docs/swagger-ui-bundle.js"></script>
<script src="/docs/swagger-ui-standalone-preset.js"></script>
<script>
window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: "/openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout"
  });
};
</script>
</body>
</html>`;
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return true;
  }
  if (pathname.startsWith("/docs/")) {
    const asset = pathname.slice("/docs/".length);
    const assetPath = path.join(swaggerUiAssetsPath(), asset);
    if (!assetPath.startsWith(swaggerUiAssetsPath()) || !fs.existsSync(assetPath)) return false;
    sendFile(response, assetPath, CONTENT_TYPES[path.extname(assetPath)] ?? "application/octet-stream");
    return true;
  }
  return false;
}

function serveUiApp(response, pathname) {
  if (!fs.existsSync(uiDistDir)) return false;
  const requested = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.join(uiDistDir, requested);
  const filePath = fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(uiDistDir, "index.html");
  if (!fs.existsSync(filePath)) return false;
  sendFile(response, filePath, CONTENT_TYPES[path.extname(filePath)] ?? "text/html; charset=utf-8");
  return true;
}

export function createRequestHandler({ db }) {
  return async function handleRequest(request, response) {
    const url = new URL(request.url, "http://localhost");
    const pathname = url.pathname;
    const segments = pathname.split("/").filter(Boolean);

    try {
      if (pathname === "/openapi.json") {
        return sendJson(response, 200, openApiDocument());
      }
      if (pathname === "/docs" || pathname.startsWith("/docs/")) {
        if (serveDocs(request, response, pathname)) return;
        response.writeHead(404);
        return response.end();
      }

      if (segments[0] === "api") {
        const participantId = resolveParticipant(request, response);

        if (segments.length === 2 && segments[1] === "workshops" && request.method === "GET") {
          return sendJson(response, 200, listWorkshops(db));
        }

        if (segments.length === 3 && segments[1] === "workshops" && request.method === "GET") {
          const detail = getWorkshopDetail(db, segments[2], participantId);
          if (!detail) return sendJson(response, 404, { error: "not_found" });
          return sendJson(response, 200, detail);
        }

        if (segments.length === 4 && segments[1] === "workshops" && segments[3] === "registration" && request.method === "POST") {
          const body = await readJsonBody(request);
          const result = confirmRegistration(db, segments[2], participantId, body);
          if (result.outcome === "notFound") return sendJson(response, 404, { error: "not_found" });
          return sendJson(response, 200, result);
        }

        if (segments.length === 4 && segments[1] === "workshops" && segments[3] === "waitlist" && request.method === "POST") {
          const body = await readJsonBody(request);
          const result = joinWaitlist(db, segments[2], participantId, body);
          if (result.outcome === "notFound") return sendJson(response, 404, { error: "not_found" });
          return sendJson(response, 200, result);
        }

        if (segments.length === 3 && segments[1] === "offers" && request.method === "GET") {
          const offer = getOffer(db, segments[2]);
          if (!offer) return sendJson(response, 404, { error: "not_found" });
          // Possessing the link is the (fake) proof of identity for this offer.
          response.setHeader("Set-Cookie", participantCookie(offer.participantId));
          return sendJson(response, 200, offer);
        }

        if (segments.length === 4 && segments[1] === "offers" && segments[3] === "accept" && request.method === "POST") {
          const result = acceptOffer(db, segments[2], participantId);
          if (result.outcome === "notFound") return sendJson(response, 404, { error: "not_found" });
          return sendJson(response, 200, result);
        }

        if (segments.length === 4 && segments[1] === "offers" && segments[3] === "decline" && request.method === "POST") {
          const result = declineOffer(db, segments[2], participantId);
          if (result.outcome === "notFound") return sendJson(response, 404, { error: "not_found" });
          return sendJson(response, 200, result);
        }

        return sendJson(response, 404, { error: "not_found" });
      }

      if (serveUiApp(response, pathname)) return;
      response.writeHead(404);
      response.end();
    } catch (error) {
      sendJson(response, 500, { error: "internal_error", message: error.message });
    }
  };
}
