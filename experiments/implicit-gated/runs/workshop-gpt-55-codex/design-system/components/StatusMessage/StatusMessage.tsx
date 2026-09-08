import type { StatusMessageData } from "../../src/types";
import { StatusGlyph } from "../../primitives/StatusGlyph/StatusGlyph";
import styles from "./StatusMessage.module.css";

export function StatusMessage({ title, message, tone = "info", details = [] }: StatusMessageData) {
  return (
    <section className={styles.status} data-tone={tone}>
      <StatusGlyph tone={tone} kind={tone === "success" ? "check" : tone === "warning" ? "alert" : "shield"} />
      <h1>{title}</h1>
      <p>{message}</p>
      {details.length > 0 ? (
        <dl>
          {details.map((detail) => (
            <div key={`${detail.term}-${detail.value}`}>
              <dt>{detail.term}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <span className={styles.spacer} aria-hidden="true" />
      )}
    </section>
  );
}
