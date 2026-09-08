import styles from "./StatusIcon.module.css";

/**
 * Domain-neutral status glyph.
 *
 * Presentation only: it carries no content of its own and is always driven by a
 * tone that a Component already models. The reference screens put a tinted disc
 * in front of an outcome message and a small glyph in front of an inline
 * notice, which are the two sizes offered here.
 */
export type StatusIconTone = "error" | "info" | "success" | "warning";

export interface StatusIconProps {
  tone: StatusIconTone;
  /** `bubble` is the tinted disc; `inline` sits on a line of text. */
  size?: "bubble" | "inline";
}

const glyphs: Record<StatusIconTone, React.ReactNode> = {
  success: <path d="M5 12.5 10 17.5 19 7" />,
  warning: (
    <>
      <path d="M10.3 4.4 2.6 17.9A2 2 0 0 0 4.3 21h15.4a2 2 0 0 0 1.7-3.1L13.7 4.4a2 2 0 0 0-3.4 0Z" />
      <path d="M12 10v4" />
      <path d="M12 17.4h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.2" />
      <path d="M12 16.4h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.2V16.5" />
      <path d="M12 7.7h.01" />
    </>
  )
};

export function StatusIcon({ tone, size = "bubble" }: StatusIconProps) {
  return (
    <span aria-hidden="true" className={`${styles.icon} ${styles[size]} ${styles[tone]}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.glyph}
      >
        {glyphs[tone]}
      </svg>
    </span>
  );
}
