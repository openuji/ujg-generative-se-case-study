import type { SVGProps } from "react";

export type IconSymbolName =
  | "arrow-right"
  | "calendar"
  | "check"
  | "clock"
  | "info"
  | "mail"
  | "map-pin"
  | "user"
  | "warning"
  | "workshop";

export type IconSymbolProps = SVGProps<SVGSVGElement> & {
  name: IconSymbolName;
};

const paths: Record<IconSymbolName, string[]> = {
  "arrow-right": ["M5 12h14", "m13 5 7 7-7 7"],
  calendar: [
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
  ],
  check: ["m5 13 4 4L19 7"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  info: ["M12 17v-6", "M12 7h.01", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
  mail: ["M4 6h16v12H4Z", "m4 7 8 5 8-5"],
  "map-pin": [
    "M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z",
    "M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
  ],
  user: ["M19 21a7 7 0 0 0-14 0", "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"],
  warning: ["M12 9v4", "M12 17h.01", "M10.3 3.7 2.8 0L22 20H2Z"],
  workshop: ["M4 19V9", "M9 19V5", "M14 19v-8", "M19 19V7", "M3 19h18"]
};

export function IconSymbol({ name, ...props }: IconSymbolProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
