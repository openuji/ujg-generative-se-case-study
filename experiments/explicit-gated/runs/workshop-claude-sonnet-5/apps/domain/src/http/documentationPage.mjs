/**
 * The browsable version of the API description.
 *
 * The page is generated here and served from memory alongside the description
 * it reads; the viewer itself is loaded from its published distribution, so the
 * service carries no copy of it.
 */

const viewerVersion = "5.29.4";
const viewerBase = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${viewerVersion}`;

export function documentationPage({ descriptionPath, title = "Workshop registration API" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="stylesheet" href="${viewerBase}/swagger-ui.css">
    <style>
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="api-documentation"></div>
    <script src="${viewerBase}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.addEventListener("load", () => {
        window.SwaggerUIBundle({
          url: ${JSON.stringify(descriptionPath)},
          dom_id: "#api-documentation",
          deepLinking: true,
          docExpansion: "list"
        });
      });
    </script>
  </body>
</html>
`;
}
