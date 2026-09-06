import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "ujg-implementation.yaml");
const manifest = parseYaml(await readFile(manifestPath, "utf8"));
const target = path.resolve(root, manifest.frontend);
const check = process.argv.includes("--check");

if (!target.startsWith(`${path.join(root, "apps")}${path.sep}`)) {
  throw new Error(`Refusing to generate outside the manifest-selected apps directory: ${target}`);
}
if (manifest.frontend_mode !== "generated" || manifest.frontend_framework !== "react" || manifest.frontend_build !== "vite") {
  throw new Error("This generator requires frontend_mode=generated, frontend_framework=react, and frontend_build=vite.");
}

const inputs = {
  ujg: await readFile(path.join(root, manifest.ujg)),
  openapi: await readFile(path.join(root, manifest.backend, "openapi/openapi.json")),
  designSystem: await readFile(path.join(root, manifest.design_system, "generated/ds-bindings.manifest.json"))
};
const ujg = JSON.parse(inputs.ujg);
const openapi = JSON.parse(inputs.openapi);
const designSystemBindings = JSON.parse(inputs.designSystem);
const designSystemPackage = JSON.parse(await readFile(path.join(root, manifest.design_system, "package.json"), "utf8"));
const hashes = Object.fromEntries(Object.entries(inputs).map(([name, bytes]) => [name, createHash("sha256").update(bytes).digest("hex")]));

if (openapi["x-ujg-source-sha256"] !== hashes.ujg) {
  throw new Error("OpenAPI was not generated from the current canonical UJG.");
}
if (designSystemBindings.source !== manifest.ujg) {
  throw new Error("The design-system binding manifest points at a different UJG source.");
}

const nodes = new Map(ujg.nodes.map((node) => [node["@id"], node]));
const artifacts = new Map(designSystemBindings.artifacts.map((artifact) => [artifact.ujgRef, artifact]));
const requiredArtifacts = [
  "urn:ujg:component:action-control",
  "urn:ujg:component:offer-response-summary",
  "urn:ujg:component:registration-form-fields",
  "urn:ujg:component:registration-review-summary",
  "urn:ujg:component:status-message",
  "urn:ujg:component:waitlist-form-fields",
  "urn:ujg:component:waitlist-review-summary",
  "urn:ujg:component:workshop-detail-summary",
  "urn:ujg:component:workshop-teaser-content",
  "urn:ujg:template:detail-with-action",
  "urn:ujg:template:form-with-submit",
  "urn:ujg:template:offered-place-response",
  "urn:ujg:template:review-with-actions",
  "urn:ujg:template:status-with-action",
  "urn:ujg:template:workshop-teaser-card",
  "urn:ujg:template:workshops-overview-list"
];
for (const ref of requiredArtifacts) {
  if (!nodes.has(ref) || !artifacts.has(ref)) throw new Error(`Missing required design-system realization artifact ${ref}`);
}

const surfaceRealizations = ujg.nodes
  .filter((node) => node["@type"] === "SurfaceRealization")
  .map((node) => ({
    id: node["@id"],
    surfaceRef: node.surfaceRef,
    ...(node.templateRef ? { templateRef: node.templateRef } : {}),
    ...(node.componentRef ? { componentRef: node.componentRef } : {}),
    ...(node.slotBindingRefs ? { slotBindingRefs: node.slotBindingRefs } : {})
  }));

for (const realization of surfaceRealizations) {
  if (realization.templateRef && !artifacts.has(realization.templateRef)) {
    throw new Error(`${realization.id} has no implemented template binding.`);
  }
  if (realization.componentRef && !artifacts.has(realization.componentRef)) {
    throw new Error(`${realization.id} has no implemented component binding.`);
  }
  for (const bindingRef of realization.slotBindingRefs ?? []) {
    if (!nodes.has(bindingRef)) throw new Error(`${realization.id} references missing slot binding ${bindingRef}`);
  }
}

const operations = Object.entries(openapi.paths).flatMap(([operationPath, pathItem]) =>
  Object.entries(pathItem).map(([method, operation]) => ({
    operationId: operation.operationId,
    method: method.toUpperCase(),
    path: operationPath,
    auth: Boolean(operation.security),
    entryRef: operation["x-ujg-entry-ref"] ?? null,
    commandRef: operation["x-ujg-command-ref"] ?? null,
    outcomes: operation["x-ujg-outcomes"]
  }))
);
const operationById = new Map(operations.map((operation) => [operation.operationId, operation]));
for (const operationId of ["listWorkshops", "getWorkshop", "confirmRegistration", "joinWaitlist", "getOffer", "acceptOffer", "declineOffer"]) {
  if (!operationById.has(operationId)) throw new Error(`OpenAPI is missing operation ${operationId}`);
}

const backendConditionSetRefs = new Set(
  Object.values(openapi.paths).flatMap((pathItem) =>
    Object.values(pathItem).map((operation) => operation["x-ujg-condition-set-ref"]).filter(Boolean)
  )
);
const localConditionSets = ujg.nodes
  .filter((node) => node["@type"] === "ConditionalTransitionSet" && !backendConditionSetRefs.has(node["@id"]))
  .map((node) => ({
    id: node["@id"],
    transitions: node.conditionTransitionRefs.map((transitionRef) => {
      const transition = nodes.get(transitionRef);
      return {
        id: transitionRef,
        from: transition.from,
        to: transition.to,
        conditionRef: transition.conditionRef,
        commandRef: transition.commandRef
      };
    })
  }));
const expectedLocalConditionSets = [
  "urn:ujg:condition-set:registration-details-validation",
  "urn:ujg:condition-set:corrected-registration-details-validation",
  "urn:ujg:condition-set:waitlist-details-validation",
  "urn:ujg:condition-set:corrected-waitlist-details-validation"
].sort();
if (JSON.stringify(localConditionSets.map(({ id }) => id).sort()) !== JSON.stringify(expectedLocalConditionSets)) {
  throw new Error("The generated browser validation boundary no longer matches the four frontend-owned condition sets.");
}
for (const conditionSet of localConditionSets) {
  if (conditionSet.transitions.length !== 2) throw new Error(`${conditionSet.id} must preserve valid and invalid outcomes.`);
}

const schemaToType = (schema, indent = "") => {
  if (schema.$ref) return schema.$ref.split("/").at(-1);
  if (Object.hasOwn(schema, "const")) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (schema.oneOf) return schema.oneOf.map((item) => schemaToType(item, indent)).join(" | ");
  if (schema.type === "array") return `Array<${schemaToType(schema.items, indent)}>`;
  if (schema.type === "object") {
    const required = new Set(schema.required ?? []);
    const properties = Object.entries(schema.properties ?? {}).map(([name, value]) =>
      `${indent}  ${JSON.stringify(name)}${required.has(name) ? "" : "?"}: ${schemaToType(value, `${indent}  `)};`
    );
    return properties.length ? `{\n${properties.join("\n")}\n${indent}}` : "Record<string, never>";
  }
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  return "string";
};

const contracts = Object.entries(openapi.components.schemas)
  .map(([name, schema]) => `export type ${name} = ${schemaToType(schema)};`)
  .join("\n\n");

const generatedHeader = `// Generated by scripts/generate-reference-frontend.mjs. Do not edit.\n`;
const realization = {
  generatedFrom: {
    manifest: "ujg-implementation.yaml",
    ujg: manifest.ujg,
    openapi: `${manifest.backend}/openapi/openapi.json`,
    designSystemBindings: `${manifest.design_system}/generated/ds-bindings.manifest.json`
  },
  hashes,
  operations,
  localConditionSets,
  surfaceRealizations
};

const packageJson = {
  name: "@openuji/workshop-registration-reference-frontend",
  version: "0.0.0",
  private: true,
  type: "module",
  scripts: {
    dev: "vite",
    typecheck: "tsc -p tsconfig.json --noEmit",
    build: "vite build"
  },
  dependencies: {
    [designSystemPackage.name]: "workspace:*",
    react: designSystemPackage.dependencies.react,
    "react-dom": designSystemPackage.dependencies["react-dom"]
  },
  devDependencies: {
    "@tailwindcss/vite": designSystemPackage.devDependencies["@tailwindcss/vite"],
    "@types/react": designSystemPackage.devDependencies["@types/react"],
    "@types/react-dom": designSystemPackage.devDependencies["@types/react-dom"],
    "@vitejs/plugin-react": designSystemPackage.devDependencies["@vitejs/plugin-react"],
    typescript: designSystemPackage.devDependencies.typescript,
    vite: designSystemPackage.devDependencies.vite
  }
};

const files = new Map([
  ["package.json", `${JSON.stringify(packageJson, null, 2)}\n`],
  ["index.html", `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Workshop registration</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`],
  ["tsconfig.json", `${JSON.stringify({
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      isolatedModules: true,
      jsx: "react-jsx",
      lib: ["DOM", "DOM.Iterable", "ESNext"],
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      noFallthroughCasesInSwitch: true,
      noImplicitReturns: true,
      noUncheckedIndexedAccess: true,
      resolveJsonModule: true,
      skipLibCheck: true,
      strict: true,
      target: "ES2023",
      types: ["vite/client"]
    },
    include: ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
  }, null, 2)}\n`],
  ["vite.config.ts", `import tailwindcss from "@tailwindcss/vite";\nimport react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [tailwindcss(), react()],\n  server: {\n    host: "127.0.0.1",\n    port: 5173,\n    proxy: { "/api": "http://127.0.0.1:3000", "/openapi.json": "http://127.0.0.1:3000" }\n  }\n});\n`],
  ["README.md", `# Generated reference frontend\n\nThis directory is generated from the root realization manifest, canonical UJG, generated OpenAPI, and design-system binding manifest. Do not hand-edit journey behavior here.\n\nRegenerate and check drift from the repository root:\n\n\`\`\`sh\npnpm generate:reference-frontend\npnpm validate:reference-frontend\n\`\`\`\n\nRun the backend and this app in separate terminals:\n\n\`\`\`sh\npnpm dev:backend\npnpm --filter @openuji/workshop-registration-reference-frontend dev\n\`\`\`\n\nThe fake browser identity defaults to \`token-alex\`. Tests or local tools can select another fixture subject with \`localStorage.setItem("referenceAuthToken", "token-blair")\`.\n`],
  ["generation.json", `${JSON.stringify(realization, null, 2)}\n`],
  ["src/generated/contracts.ts", `${generatedHeader}${contracts}\n`],
  ["src/generated/realization.ts", `${generatedHeader}export const realization = ${JSON.stringify(realization, null, 2)} as const;\n`],
  ["src/main.tsx", `${generatedHeader}import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "${designSystemPackage.name}/styles.css";\nimport "./app.css";\nimport { App } from "./App";\n\ncreateRoot(document.getElementById("root")!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n`],
  ["src/api.ts", `${generatedHeader}import type {\n  AcceptOfferOutcomeResponse,\n  DeclineOfferOutcomeResponse,\n  OfferResponse,\n  RegistrationDetailsInput,\n  RegistrationOutcomeResponse,\n  WaitlistDetailsInput,\n  WaitlistOutcomeResponse,\n  WorkshopCollectionResponse,\n  WorkshopDetailResponse\n} from "./generated/contracts";\nimport { realization } from "./generated/realization";\n\nconst byId = new Map(realization.operations.map((operation) => [operation.operationId, operation]));\nconst operation = (id: string) => {\n  const value = byId.get(id as typeof realization.operations[number]["operationId"]);\n  if (!value) throw new Error(\`Missing generated API operation \${id}\`);\n  return value;\n};\nconst pathFor = (id: string, parameters: Record<string, string> = {}) =>\n  operation(id).path.replace(/\\{([^}]+)\\}/g, (_, name: string) => encodeURIComponent(parameters[name] ?? ""));\nconst token = () => localStorage.getItem("referenceAuthToken") ?? "token-alex";\n\nasync function request<T>(id: string, parameters?: Record<string, string>, body?: unknown): Promise<T> {\n  const definition = operation(id);\n  const response = await fetch(pathFor(id, parameters), {\n    method: definition.method,\n    headers: {\n      ...(definition.commandRef || id === "getOffer" ? { authorization: \`Bearer \${token()}\` } : {}),\n      ...(body ? { "content-type": "application/json" } : {})\n    },\n    ...(body ? { body: JSON.stringify(body) } : {})\n  });\n  const payload = await response.json();\n  if (!response.ok) throw new Error(payload.error ?? \`Request failed with status \${response.status}\`);\n  return payload as T;\n}\n\nexport const api = {\n  listWorkshops: () => request<WorkshopCollectionResponse>("listWorkshops"),\n  getWorkshop: (workshopId: string) => request<WorkshopDetailResponse>("getWorkshop", { workshopId }),\n  confirmRegistration: (workshopId: string, body: RegistrationDetailsInput) =>\n    request<RegistrationOutcomeResponse>("confirmRegistration", { workshopId }, body),\n  joinWaitlist: (workshopId: string, body: WaitlistDetailsInput) =>\n    request<WaitlistOutcomeResponse>("joinWaitlist", { workshopId }, body),\n  getOffer: (offerId: string) => request<OfferResponse>("getOffer", { offerId }),\n  acceptOffer: (offerId: string) => request<AcceptOfferOutcomeResponse>("acceptOffer", { offerId }),\n  declineOffer: (offerId: string) => request<DeclineOfferOutcomeResponse>("declineOffer", { offerId })\n};\n`],
  ["src/app.css", `:root { color-scheme: light dark; }\nhtml, body, #root { min-height: 100%; margin: 0; }\n.app-shell { min-height: 100vh; padding: clamp(1rem, 4vw, 3rem); }\n.app-frame { width: min(100%, 80rem); margin: 0 auto; }\n.app-frame--focused { width: min(100%, 56rem); }\n.runtime-message { margin: 0; padding: 1rem; }\n`],
  ["src/App.tsx", `${generatedHeader}import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from "react";\nimport {\n  ActionControl,\n  DetailWithAction,\n  FormWithSubmit,\n  OfferedPlaceResponse,\n  OfferResponseSummary,\n  RegistrationFormFields,\n  RegistrationReviewSummary,\n  ReviewWithActions,\n  StatusMessage,\n  StatusWithAction,\n  WaitlistFormFields,\n  WaitlistReviewSummary,\n  WorkshopDetailSummary,\n  WorkshopTeaserCard,\n  WorkshopTeaserContent,\n  WorkshopsOverviewList,\n  defaultThemeId,\n  themeCssProperties,\n  themeSlug\n} from "${designSystemPackage.name}";\nimport { api } from "./api";\nimport type {\n  OfferResponse,\n  RegistrationDetailsInput,\n  StatusMessageData,\n  WaitlistDetailsInput,\n  WorkshopCollectionData,\n  WorkshopDetailData\n} from "./generated/contracts";\n\ntype Errors = { name?: string; email?: string; accessibilityNotes?: string; notes?: string };\ntype DetailView = { kind: "detail"; workshopId: string; outcome: "registrationOpen" | "waitlistOpen"; data: WorkshopDetailData; afterUnavailable?: boolean };\ntype View =\n  | { kind: "loading" }\n  | { kind: "error"; message: string }\n  | { kind: "overview"; data: WorkshopCollectionData }\n  | DetailView\n  | { kind: "registrationForm"; workshopId: string; workshop: WorkshopDetailData; details: RegistrationDetailsInput; errors: Errors }\n  | { kind: "registrationReview"; workshopId: string; workshop: WorkshopDetailData; details: RegistrationDetailsInput }\n  | { kind: "waitlistForm"; workshopId: string; workshop: WorkshopDetailData; details: WaitlistDetailsInput; errors: Errors }\n  | { kind: "waitlistReview"; workshopId: string; workshop: WorkshopDetailData; details: WaitlistDetailsInput }\n  | { kind: "status"; data: StatusMessageData; alreadyWaitlisted?: boolean }\n  | { kind: "offer"; offerId: string; data: Extract<OfferResponse, { outcome: "open" }>["data"] };\n\nconst emptyRegistration: RegistrationDetailsInput = { name: "", email: "", accessibilityNotes: "" };\nconst emptyWaitlist: WaitlistDetailsInput = { name: "", email: "", notes: "" };\nconst messageFrom = (error: unknown) => error instanceof Error ? error.message : "An unexpected error occurred.";\nconst statusData = (data: StatusMessageData) => <StatusMessage {...data} />;\n\nfunction valuesFrom(event: MouseEvent<HTMLButtonElement>) {\n  event.preventDefault();\n  const form = event.currentTarget.form;\n  return new FormData(form ?? undefined);\n}\n\nfunction validate(form: FormData): Errors {\n  const name = String(form.get("name") ?? "").trim();\n  const email = String(form.get("email") ?? "").trim();\n  return {\n    ...(!name ? { name: "Enter a full name." } : {}),\n    ...(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ? { email: "Enter a valid email address." } : {})\n  };\n}\n\nexport function App() {\n  const [pathname, setPathname] = useState(window.location.pathname);\n  const [view, setView] = useState<View>({ kind: "loading" });\n  const [busy, setBusy] = useState(false);\n\n  const navigate = useCallback((next: string) => {\n    window.history.pushState({}, "", next);\n    setPathname(next);\n  }, []);\n\n  useEffect(() => {\n    const onPopState = () => setPathname(window.location.pathname);\n    window.addEventListener("popstate", onPopState);\n    return () => window.removeEventListener("popstate", onPopState);\n  }, []);\n\n  useEffect(() => {\n    let current = true;\n    setView({ kind: "loading" });\n    const load = async () => {\n      try {\n        const workshopMatch = /^\\/workshops\\/([^/]+)$/.exec(pathname);\n        const offerMatch = /^\\/offers\\/([^/]+)$/.exec(pathname);\n        if (workshopMatch) {\n          const workshopId = decodeURIComponent(workshopMatch[1]!);\n          const result = await api.getWorkshop(workshopId);\n          if (!current) return;\n          setView(result.outcome === "registrationClosed"\n            ? { kind: "status", data: result.data }\n            : { kind: "detail", workshopId, outcome: result.outcome, data: result.data });\n          return;\n        }\n        if (offerMatch) {\n          const offerId = decodeURIComponent(offerMatch[1]!);\n          const result = await api.getOffer(offerId);\n          if (!current) return;\n          setView(result.outcome === "open"\n            ? { kind: "offer", offerId, data: result.data }\n            : { kind: "status", data: result.data });\n          return;\n        }\n        if (pathname !== "/") {\n          window.history.replaceState({}, "", "/");\n          setPathname("/");\n          return;\n        }\n        const result = await api.listWorkshops();\n        if (current) setView({ kind: "overview", data: result.data });\n      } catch (error) {\n        if (current) setView({ kind: "error", message: messageFrom(error) });\n      }\n    };\n    void load();\n    return () => { current = false; };\n  }, [pathname]);\n\n  const confirmRegistration = async (current: Extract<View, { kind: "registrationReview" }>) => {\n    setBusy(true);\n    try {\n      const result = await api.confirmRegistration(current.workshopId, current.details);\n      setView(result.outcome === "waitlistOpen"\n        ? { kind: "detail", workshopId: current.workshopId, outcome: "waitlistOpen", data: result.data, afterUnavailable: true }\n        : { kind: "status", data: result.data });\n    } catch (error) {\n      setView({ kind: "error", message: messageFrom(error) });\n    } finally { setBusy(false); }\n  };\n\n  const joinWaitlist = async (current: Extract<View, { kind: "waitlistReview" }>) => {\n    setBusy(true);\n    try {\n      const result = await api.joinWaitlist(current.workshopId, current.details);\n      setView({ kind: "status", data: result.data, alreadyWaitlisted: result.outcome === "alreadyWaitlisted" });\n    } catch (error) {\n      setView({ kind: "error", message: messageFrom(error) });\n    } finally { setBusy(false); }\n  };\n\n  const resolveOffer = async (current: Extract<View, { kind: "offer" }>, resolution: "accept" | "decline") => {\n    setBusy(true);\n    try {\n      const result = resolution === "accept" ? await api.acceptOffer(current.offerId) : await api.declineOffer(current.offerId);\n      setView({ kind: "status", data: result.data });\n    } catch (error) {\n      setView({ kind: "error", message: messageFrom(error) });\n    } finally { setBusy(false); }\n  };\n\n  let content;\n  if (view.kind === "loading") content = <p className="runtime-message" role="status">Loading…</p>;\n  else if (view.kind === "error") content = <StatusMessage title="Unable to continue" message={view.message} tone="error" />;\n  else if (view.kind === "overview") content = (\n    <WorkshopsOverviewList workshops={view.data.items.map((item) => (\n      <WorkshopTeaserCard\n        key={item.workshopId}\n        content={<WorkshopTeaserContent {...item.data} />}\n        action={<ActionControl label="Open workshop" onAction={() => navigate(\`/workshops/\${item.workshopId}\`)} />}\n      />\n    ))} />\n  );\n  else if (view.kind === "detail") content = (\n    <DetailWithAction\n      summary={<WorkshopDetailSummary {...view.data} />}\n      action={<ActionControl\n        label={view.outcome === "registrationOpen" ? "Register" : view.afterUnavailable ? "Join waitlist instead" : "Join waitlist"}\n        onAction={() => setView(view.outcome === "registrationOpen"\n          ? { kind: "registrationForm", workshopId: view.workshopId, workshop: view.data, details: emptyRegistration, errors: {} }\n          : { kind: "waitlistForm", workshopId: view.workshopId, workshop: view.data, details: emptyWaitlist, errors: {} })}\n      />}\n    />\n  );\n  else if (view.kind === "registrationForm") content = (\n    <FormWithSubmit\n      fields={<RegistrationFormFields {...view.details} errors={view.errors} />}\n      submitAction={<ActionControl label="Continue" onAction={(event) => {\n        const form = valuesFrom(event);\n        const errors = validate(form);\n        const details = {\n          name: String(form.get("name") ?? "").trim(),\n          email: String(form.get("email") ?? "").trim(),\n          accessibilityNotes: String(form.get("accessibilityNotes") ?? "").trim()\n        };\n        setView(Object.keys(errors).length\n          ? { ...view, details, errors }\n          : { kind: "registrationReview", workshopId: view.workshopId, workshop: view.workshop, details });\n      }} />}\n    />\n  );\n  else if (view.kind === "registrationReview") content = (\n    <ReviewWithActions\n      summary={<RegistrationReviewSummary workshopTitle={view.workshop.title} name={view.details.name} email={view.details.email} />}\n      editAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setView({ ...view, kind: "registrationForm", errors: {} })} />}\n      submitAction={<ActionControl disabled={busy} label="Confirm registration" onAction={() => void confirmRegistration(view)} />}\n    />\n  );\n  else if (view.kind === "waitlistForm") content = (\n    <FormWithSubmit\n      fields={<WaitlistFormFields {...view.details} errors={view.errors} />}\n      submitAction={<ActionControl label="Continue" onAction={(event) => {\n        const form = valuesFrom(event);\n        const errors = validate(form);\n        const details = {\n          name: String(form.get("name") ?? "").trim(),\n          email: String(form.get("email") ?? "").trim(),\n          notes: String(form.get("notes") ?? "").trim()\n        };\n        setView(Object.keys(errors).length\n          ? { ...view, details, errors }\n          : { kind: "waitlistReview", workshopId: view.workshopId, workshop: view.workshop, details });\n      }} />}\n    />\n  );\n  else if (view.kind === "waitlistReview") content = (\n    <ReviewWithActions\n      summary={<WaitlistReviewSummary workshopTitle={view.workshop.title} name={view.details.name} email={view.details.email} />}\n      editAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setView({ ...view, kind: "waitlistForm", errors: {} })} />}\n      submitAction={<ActionControl disabled={busy} label="Join waitlist" onAction={() => void joinWaitlist(view)} />}\n    />\n  );\n  else if (view.kind === "offer") content = (\n    <OfferedPlaceResponse\n      summary={<OfferResponseSummary {...view.data} />}\n      acceptAction={<ActionControl disabled={busy} label="Accept place" onAction={() => void resolveOffer(view, "accept")} />}\n      declineAction={<ActionControl disabled={busy} label="Decline place" variant="secondary" onAction={() => void resolveOffer(view, "decline")} />}\n    />\n  );\n  else if (view.alreadyWaitlisted) content = (\n    <StatusWithAction\n      status={statusData(view.data)}\n      action={<ActionControl label="Continue" onAction={() => setView({\n        kind: "status",\n        data: { title: "Waitlisted", message: "You remain on the waitlist for this workshop.", tone: "info", details: view.data.details }\n      })} />}\n    />\n  );\n  else content = statusData(view.data);\n\n  const themeStyle = { ...themeCssProperties(defaultThemeId), minHeight: "100vh" } as CSSProperties;\n  return (\n    <div className="app-shell bg-surface-canvas font-sans text-text-default" data-ujg-theme={themeSlug(defaultThemeId)} style={themeStyle}>\n      <main className={\`app-frame \${view.kind === "overview" ? "" : "app-frame--focused"}\`}>{content}</main>\n    </div>\n  );\n}\n`]
]);

const ignoredDirectories = new Set(["dist", "node_modules"]);
const listFiles = async (directory, prefix = "") => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const result = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(path.join(directory, entry.name), relative));
    else result.push(relative);
  }
  return result.sort();
};

if (check) {
  const actualFiles = await listFiles(target);
  const expectedFiles = [...files.keys()].sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(`Generated frontend file set is stale. Expected ${expectedFiles.length} files, found ${actualFiles.length}.`);
  }
  for (const [relative, content] of files) {
    const actual = await readFile(path.join(target, relative), "utf8");
    if (actual !== content) throw new Error(`Generated frontend is stale: ${relative}`);
  }
  console.log(`Reference frontend is current (${files.size} files, ${operations.length} API operations, ${localConditionSets.length} local condition sets, ${surfaceRealizations.length} surface realizations).`);
} else {
  for (const relative of await listFiles(target)) {
    if (!files.has(relative)) await rm(path.join(target, relative), { force: true });
  }
  for (const [relative, content] of files) {
    const filename = path.join(target, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
  console.log(`Generated ${path.relative(root, target)} (${files.size} files).`);
}
