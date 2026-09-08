import styles from "./StatusGlyph.module.css";
import type { Tone } from "../../src/types";

type StatusGlyphProps = {
  tone?: Tone;
  kind?: "bars" | "leaf" | "shield" | "mail" | "alert" | "check";
};

export function StatusGlyph({ tone = "info", kind = "bars" }: StatusGlyphProps) {
  return (
    <span className={styles.glyph} data-tone={tone} aria-hidden="true">
      <span className={styles[kind]} />
    </span>
  );
}
