import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  formatTokenValue,
  resolveTokenValue,
  sourceTokenGroups,
  themeOptions,
  tokensForTheme,
  type TokenEntry
} from "../src/theme";
import styles from "./TokenFoundations.module.css";

function TokenTable({ title, tokens }: { title: string; tokens: TokenEntry[] }) {
  const resolved = useMemo(
    () => tokens.map((token) => ({ ...token, resolved: resolveTokenValue(token, tokens) })),
    [tokens]
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Path</th>
            <th>Type</th>
            <th>Resolved value</th>
          </tr>
        </thead>
        <tbody>
          {resolved.map((token) => (
            <tr key={token.path}>
              <td>{token.path}</td>
              <td>{token.type}</td>
              <td>{formatTokenValue(token.resolved)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TokenExplorer() {
  const [selectedTheme, setSelectedTheme] = useState(themeOptions[0]?.name ?? "");
  const selectedTokens = tokensForTheme(selectedTheme);
  const semanticTokens = selectedTokens.filter((token) => token.path.startsWith("semantic."));

  return (
    <main className={styles.root}>
      <h1>Tokens</h1>
      <label className={styles.toolbar}>
        <span>Theme</span>
        <select
          className={styles.select}
          value={selectedTheme}
          onChange={(event) => setSelectedTheme(event.currentTarget.value)}
        >
          {themeOptions.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.label}
            </option>
          ))}
        </select>
      </label>
      <TokenTable title="Theme semantic roles" tokens={semanticTokens} />
      {sourceTokenGroups().map(({ source, tokens }) => (
        <TokenTable key={source} title={source} tokens={tokens} />
      ))}
    </main>
  );
}

const meta = {
  title: "Tokens/Foundations",
  component: TokenExplorer
} satisfies Meta<typeof TokenExplorer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Explorer: Story = {};
