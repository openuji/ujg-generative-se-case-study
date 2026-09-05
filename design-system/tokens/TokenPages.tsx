import type { CSSProperties, ReactNode } from "react";

import "./tailwind.css";
import {
  defaultThemeId,
  evidenceLabel,
  filterTokens,
  getThemes,
  resolveTheme,
  themeIdFromGlobal,
  themeSlug,
  type ResolvedToken
} from "./token-system";

type TokenPageProps = {
  themeId?: string;
};

type TokenGroupProps = TokenPageProps & {
  title: string;
  description: string;
  prefixes: string[];
  source?: "foundation" | "semantic";
  variant?: "color" | "dimension" | "typography" | "shadow";
};

export function storyThemeId(globals: Record<string, unknown>): string {
  return themeIdFromGlobal(globals.ujgTheme ?? defaultThemeId);
}

function PageShell({ children, themeId, title }: TokenPageProps & { children: ReactNode; title: string }) {
  const theme = resolveTheme(themeId);

  return (
    <main className="min-h-screen bg-surface-canvas p-8 font-sans text-text-default">
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header className="mb-8">
          <div className="mb-2 text-sm font-medium text-text-action">{themeSlug(theme.id)}</div>
          <h1 className="m-0 text-2xl font-bold leading-tight">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section
      className="rounded-md bg-surface-default p-6 shadow-card"
      style={{ border: "var(--ujg-border-width-thin) solid var(--ujg-border-default)" }}
    >
      {children}
    </section>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="m-0 text-lg font-semibold leading-tight">{title}</h2>
      {description ? <p className="m-0 mt-2 text-sm leading-normal text-text-muted">{description}</p> : null}
    </div>
  );
}

function TokenGrid({ tokens, variant }: { tokens: ResolvedToken[]; variant?: TokenGroupProps["variant"] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      {tokens.map((token) => (
        <TokenCard key={token.path} token={token} variant={variant} />
      ))}
    </div>
  );
}

function TokenCard({ token, variant }: { token: ResolvedToken; variant?: TokenGroupProps["variant"] }) {
  return (
    <article
      className="rounded-sm bg-surface-default p-4"
      style={{ border: "var(--ujg-border-width-thin) solid var(--ujg-border-default)" }}
    >
      <TokenPreview token={token} variant={variant} />
      <div className="mt-3 text-sm font-semibold leading-tight">{token.path}</div>
      <div className="mt-1 text-xs leading-normal text-text-muted">{token.type}</div>
      <code className="mt-3 block overflow-hidden text-ellipsis rounded-xs bg-surface-subtle p-2 text-xs text-text-subtle">
        {token.cssValue}
      </code>
      <div className="mt-3 text-xs text-text-muted">{evidenceLabel(token)}</div>
    </article>
  );
}

function TokenPreview({ token, variant }: { token: ResolvedToken; variant?: TokenGroupProps["variant"] }) {
  if (variant === "color" || token.type === "color") {
    return (
      <div
        className="h-16 rounded-sm"
        style={{
          background: `var(${token.cssVariable})`,
          border: "var(--ujg-border-width-thin) solid var(--ujg-border-default)"
        }}
      />
    );
  }

  if (variant === "shadow" || token.type === "shadow") {
    return <div className="h-16 rounded-sm bg-surface-default" style={{ boxShadow: `var(${token.cssVariable})` }} />;
  }

  if (variant === "typography" && token.path.startsWith("font.size.")) {
    return (
      <div className="leading-tight" style={{ fontSize: `var(${token.cssVariable})` }}>
        Aa
      </div>
    );
  }

  if (variant === "typography" && token.path.startsWith("font.weight.")) {
    return (
      <div className="text-xl leading-tight" style={{ fontWeight: `var(${token.cssVariable})` }}>
        Aa
      </div>
    );
  }

  if (variant === "typography" && token.path.startsWith("font.lineHeight.")) {
    return (
      <div className="text-sm" style={{ lineHeight: `var(${token.cssVariable})` }}>
        Workshop registration uses readable compact rhythm.
      </div>
    );
  }

  if (token.type === "dimension") {
    return (
      <div className="h-16 rounded-sm bg-surface-subtle p-3">
        <div className="h-4 rounded-full bg-action-background" style={{ width: `var(${token.cssVariable})` }} />
      </div>
    );
  }

  return <div className="text-xl font-semibold leading-tight">Aa</div>;
}

export function OverviewPage({ themeId }: TokenPageProps) {
  const theme = resolveTheme(themeId);
  const semanticColors = filterTokens(theme.tokens, ["surface", "text", "border", "action", "control", "status"], "semantic").filter(
    (token) => token.type === "color"
  );
  const foundationCount = theme.tokens.filter((token) => token.source.includes("-foundation.")).length;
  const semanticCount = theme.tokens.length - foundationCount;

  return (
    <PageShell themeId={theme.id} title="Tokens Overview">
      <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)" }}>
        <Panel>
          <SectionHeading
            title="Resolved Semantic Color Roles"
            description="Values are resolved from the selected UJG Theme through its ordered TokenSources."
          />
          <TokenGrid tokens={semanticColors.slice(0, 18)} variant="color" />
        </Panel>
        <Panel>
          <SectionHeading title="Trace" description="This page reads the source model and does not use generated token metadata." />
          <dl className="m-0 grid gap-4 text-sm">
            <div>
              <dt className="font-medium text-text-muted">Theme</dt>
              <dd className="m-0 mt-1 font-semibold">{themeSlug(theme.id)}</dd>
            </div>
            <div>
              <dt className="font-medium text-text-muted">Token sources</dt>
              <dd className="m-0 mt-1">
                {theme.tokenSources.map((source) => (
                  <code key={source.id} className="mb-2 block rounded-xs bg-surface-subtle p-2 text-xs text-text-subtle">
                    {source.source}
                  </code>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-muted">Resolved tokens</dt>
              <dd className="m-0 mt-1">
                {foundationCount} foundation, {semanticCount} semantic
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </PageShell>
  );
}

export function TokenGroupPage({ themeId, title, description, prefixes, source, variant }: TokenGroupProps) {
  const theme = resolveTheme(themeId);
  const sections = prefixes
    .map((prefix) => ({
      prefix,
      tokens: filterTokens(theme.tokens, [prefix], source)
    }))
    .filter((section) => section.tokens.length > 0);

  return (
    <PageShell themeId={theme.id} title={title}>
      <div className="grid gap-6">
        {sections.map((section) => (
          <Panel key={section.prefix}>
            <SectionHeading title={section.prefix} description={description} />
            <TokenGrid tokens={section.tokens} variant={variant} />
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}

const comparisonRows = [
  "surface.canvas",
  "surface.default",
  "surface.accent",
  "text.default",
  "text.muted",
  "border.default",
  "action.background",
  "action.secondaryBackground",
  "control.background",
  "status.success.background",
  "status.warning.background",
  "status.error.background",
  "status.info.background"
];

export function ThemesPage({ themeId }: TokenPageProps) {
  const selectedTheme = resolveTheme(themeId);
  const themes = getThemes().map((theme) => resolveTheme(theme.id));

  return (
    <PageShell themeId={selectedTheme.id} title="Themes">
      <Panel>
        <SectionHeading
          title="Resolved Semantic Roles Across Themes"
          description="Each cell is resolved through the UJG Theme and its ordered TokenSources."
        />
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="p-3 font-semibold text-text-muted">Role</th>
                {themes.map((theme) => (
                  <th key={theme.id} className="p-3 font-semibold text-text-muted">
                    {themeSlug(theme.id)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((path) => (
                <tr key={path} style={{ borderTop: "var(--ujg-border-width-thin) solid var(--ujg-border-default)" }}>
                  <td className="p-3 font-medium">{path}</td>
                  {themes.map((theme) => {
                    const token = theme.tokens.find((candidate) => candidate.path === path);

                    return (
                      <td key={theme.id} className="p-3">
                        {token ? (
                          <div className="flex items-center gap-3">
                            <span
                              className="block h-8 w-8 rounded-xs"
                              style={{
                                background: token.cssValue,
                                border: "var(--ujg-border-width-thin) solid var(--ujg-border-default)"
                              }}
                            />
                            <code className="text-xs text-text-subtle">{token.cssValue}</code>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  );
}

export function tokenPageStyle(themeId: string): CSSProperties {
  const theme = resolveTheme(themeId);

  return {
    colorScheme: themeSlug(theme.id).endsWith("-dark") ? "dark" : "light"
  };
}
