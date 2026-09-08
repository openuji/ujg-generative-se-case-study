/**
 * Documentation surface for the token layer.
 *
 * These are inspection views, not design-system artifacts: nothing here is a
 * UJG Component or Template. Every value on screen is read back through the
 * Theme resolver, so a page can only show what the graph and its DTCG
 * manifests actually resolve to.
 *
 * The pages themselves are styled by the same pipeline as every artifact: one
 * CSS module, token custom properties resolved through the active Theme scope,
 * and the shared breakpoints. The only inline values are the previews, which
 * have to paint the resolved value of the token under inspection.
 */

import type { ReactNode } from "react";
import type { ResolvedToken } from "./dtcg";
import { isColorValue, isDimensionValue, toCssCustomPropertyName, toCssValue } from "./dtcg";
import styles from "./TokenGallery.module.css";
import type { ResolvedTheme } from "./themeTokens";
import {
  foundationTokens,
  leavesInGroup,
  resolveTheme,
  sectionsInGroup,
  semanticTokens,
  sharedSourceIds,
  themes,
  tokensInGroup,
  topLevelGroups
} from "./themeTokens";

export function useResolvedTheme(themeKey: string): ResolvedTheme {
  return resolveTheme(themeKey.length > 0 ? themeKey : themes[0].key);
}

function EvidenceNote({ token }: { token: ResolvedToken }) {
  const evidence = token.evidence;
  if (evidence === undefined) return undefined;
  const direct = evidence.confidence === "direct";
  return (
    <span
      title={evidence.screenPaths.join("\n")}
      className={`${styles.evidence} ${direct ? styles.evidenceDirect : ""}`}
    >
      {evidence.confidence} · {evidence.screenPaths.length}
    </span>
  );
}

function ValuePreview({ token }: { token: ResolvedToken }) {
  const value = token.resolvedValue;
  if (isColorValue(value)) {
    return <span aria-hidden="true" className={styles.swatch} style={{ background: toCssValue("color", value) }} />;
  }
  if (isDimensionValue(value)) {
    return (
      <span
        aria-hidden="true"
        className={styles.measure}
        style={{ width: `${Math.max(2, Math.min(220, value.value))}px` }}
      />
    );
  }
  if (token.resolvedType === "shadow") {
    return <span aria-hidden="true" className={styles.swatch} style={{ boxShadow: toCssValue("shadow", value) }} />;
  }
  if (token.resolvedType === "fontFamily") {
    return <span className={styles.specimen} style={{ fontFamily: toCssValue("fontFamily", value) }}>Aa</span>;
  }
  return <span className={styles.empty}>—</span>;
}

export function TokenTable({ tokens }: { tokens: readonly ResolvedToken[] }) {
  if (tokens.length === 0) {
    return <p className={styles.empty}>This group resolves to no tokens in the selected Theme.</p>;
  }
  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.columnHeading}>Preview</th>
            <th className={styles.columnHeading}>Token</th>
            <th className={styles.columnHeading}>Resolved</th>
            <th className={styles.columnHeading}>Alias</th>
            <th className={styles.columnHeading}>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr className={styles.row} key={token.path}>
              <td className={styles.cell}>
                <ValuePreview token={token} />
              </td>
              <td className={styles.cell}>
                <div className={styles.tokenPath}>{token.path}</div>
                <div className={styles.tokenNote}>{token.description}</div>
                <div className={styles.tokenProperty}>{toCssCustomPropertyName(token.path)}</div>
              </td>
              <td className={`${styles.cell} ${styles.resolved}`}>
                {toCssValue(token.resolvedType, token.resolvedValue)}
                <div className={styles.resolvedType}>{token.resolvedType}</div>
              </td>
              <td className={`${styles.cell} ${styles.alias}`}>
                {token.aliasChain.length === 0 ? "direct value" : token.aliasChain.join(" → ")}
              </td>
              <td className={styles.cell}>
                <EvidenceNote token={token} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {description === undefined ? undefined : <p className={styles.sectionNote}>{description}</p>}
      {children}
    </section>
  );
}

export function TokenPage({
  themeKey,
  title,
  description,
  children
}: {
  themeKey: string;
  title: string;
  description: string;
  children: (theme: ResolvedTheme) => ReactNode;
}) {
  const theme = useResolvedTheme(themeKey);
  const shared = sharedSourceIds();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.pageTitle}>{title}</h2>
        <p className={styles.lede}>{description}</p>
        <div className={styles.chips}>
          <span className={`${styles.chip} ${styles.chipAccent}`}>{theme.descriptor.label}</span>
          {theme.sources.map((source) => (
            <span className={`${styles.chip} ${styles.chipCode}`} key={source.descriptor.id}>
              {shared.has(source.descriptor.id) ? "shared" : "theme"} · {source.descriptor.source} ·{" "}
              {source.tokens.length}
            </span>
          ))}
        </div>
      </header>
      {children(theme)}
    </div>
  );
}

export function GroupPage({
  themeKey,
  layer,
  group,
  title,
  description
}: {
  themeKey: string;
  layer: "foundation" | "semantic";
  group: string;
  title: string;
  description: string;
}) {
  return (
    <TokenPage themeKey={themeKey} title={title} description={description}>
      {(theme) => {
        const pool = layer === "foundation" ? foundationTokens(theme) : semanticTokens(theme);
        const sections = sectionsInGroup(pool, group);
        const direct = leavesInGroup(pool, group);
        return (
          <>
            {direct.length === 0 && sections.length > 0 ? undefined : (
              <Section title={group}>
                <TokenTable tokens={direct} />
              </Section>
            )}
            {sections.map((section) => (
              <Section key={section} title={section}>
                <TokenTable tokens={tokensInGroup(pool, section)} />
              </Section>
            ))}
          </>
        );
      }}
    </TokenPage>
  );
}

export function OverviewPage({ themeKey }: { themeKey: string }) {
  return (
    <TokenPage
      themeKey={themeKey}
      title="Token overview"
      description="Every page below resolves the selected Theme through the graph: the Theme node names its token sources in order, each source is a DTCG manifest, and the manifests are merged and alias-resolved before anything is rendered. The same resolution produces the CSS custom properties this page — and every styled artifact — is painted with."
    >
      {(theme) => {
        const shared = sharedSourceIds();
        const foundation = foundationTokens(theme);
        const semantic = semanticTokens(theme);
        return (
          <>
            <Section
              title="Theme resolution"
              description="Token sources are applied in the order the Theme declares them, so semantic roles layer over the shared foundation."
            >
              <ol className={styles.sourceList}>
                {theme.sources.map((source) => (
                  <li key={source.descriptor.id}>
                    <span className={styles.tokenPath}>{source.descriptor.source}</span>{" "}
                    <span className={styles.empty}>
                      — {shared.has(source.descriptor.id) ? "shared across every Theme" : "unique to this Theme"},{" "}
                      {source.tokens.length} tokens
                    </span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section
              title="Foundation groups"
              description="Raw, theme-independent choices. Semantic roles alias into these rather than repeating values."
            >
              <div className={styles.chips}>
                {topLevelGroups(foundation).map((group) => (
                  <span className={`${styles.chip} ${styles.chipCode}`} key={group}>
                    {group} · {tokensInGroup(foundation, group).length}
                  </span>
                ))}
              </div>
            </Section>

            <Section
              title="Semantic roles"
              description="Theme-resolved roles. These are the only tokens a styled component should ever reach for."
            >
              <div className={styles.chips}>
                {topLevelGroups(semantic).flatMap((group) =>
                  sectionsInGroup(semantic, group).map((section) => (
                    <span className={`${styles.chip} ${styles.chipCode}`} key={section}>
                      {section} · {tokensInGroup(semantic, section).length}
                    </span>
                  ))
                )}
              </div>
            </Section>

            <Section
              title="Visual evidence"
              description="Provenance recorded on the semantic manifests. Dark-theme values carry inferred provenance because the reference set only captures the light theme."
            >
              <TokenTable tokens={semantic.slice(0, 6)} />
            </Section>
          </>
        );
      }}
    </TokenPage>
  );
}

export function ThemeComparisonPage() {
  const resolved = themes.map((descriptor) => resolveTheme(descriptor.key));
  const paths = semanticTokens(resolved[0]).map((token) => token.path);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.pageTitle}>Theme comparison</h2>
        <p className={styles.lede}>
          Semantic roles only, side by side. Each column resolves its own Theme through the graph, so a role that shifts
          between Themes shifts here too. Foundation values are shared and therefore not repeated.
        </p>
      </header>
      <div className={styles.scroller}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.columnHeading}>Role</th>
              {resolved.map((theme) => (
                <th className={styles.columnHeading} key={theme.descriptor.id}>
                  {theme.descriptor.label.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paths.map((path) => {
              const values = resolved.map((theme) => theme.byPath.get(path));
              const serialized = values.map((token) =>
                token === undefined ? "—" : toCssValue(token.resolvedType, token.resolvedValue)
              );
              const differs = new Set(serialized).size > 1;
              return (
                <tr className={styles.row} key={path}>
                  <td className={`${styles.cell} ${styles.tokenPath}`}>
                    {path}
                    {differs ? undefined : <span className={styles.alias}> (identical)</span>}
                  </td>
                  {values.map((token, index) => (
                    <td className={styles.cell} key={resolved[index].descriptor.id}>
                      <span className={styles.comparisonValue}>
                        <span
                          aria-hidden="true"
                          className={`${styles.swatch} ${styles.swatchSmall}`}
                          style={{
                            background:
                              token !== undefined && isColorValue(token.resolvedValue)
                                ? toCssValue("color", token.resolvedValue)
                                : "transparent"
                          }}
                        />
                        <span className={styles.resolved}>{serialized[index]}</span>
                        {token === undefined ? undefined : <EvidenceNote token={token} />}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
