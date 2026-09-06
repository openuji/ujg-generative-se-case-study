import { DescriptionList, type DescriptionTerm } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol, type IconSymbolName } from "../../primitives/IconSymbol/IconSymbol";
import type { StatusBadgeTone } from "../../primitives/StatusBadge/StatusBadge";
import styles from "./StatusMessage.module.css";

export type StatusMessageProps = {
  details?: DescriptionTerm[];
  message: string;
  tone?: StatusBadgeTone;
  title: string;
};

function statusIcon(tone: StatusBadgeTone): IconSymbolName {
  if (tone === "success") {
    return "check";
  }

  if (tone === "warning") {
    return "warning";
  }

  if (tone === "error") {
    return "warning";
  }

  return "info";
}

export function StatusMessage({ details = [], message, title, tone = "info" }: StatusMessageProps) {
  return (
    <section className={styles.root}>
      <div className={`${styles.iconWell} ${styles[tone]}`}>
        <IconSymbol className={styles.icon} name={statusIcon(tone)} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {details.length > 0 ? (
        <div className={styles.details}>
          <DescriptionList terms={details} />
        </div>
      ) : null}
    </section>
  );
}
