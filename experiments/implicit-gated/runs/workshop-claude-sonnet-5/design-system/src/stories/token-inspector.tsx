import { cssVariableName } from "../tokens/dtcg";

export function labelFor(tokenPath: string): string {
  return tokenPath.split(".").slice(1).join(" / ");
}

export function ColorSwatch({ tokenPath }: { tokenPath: string }) {
  const varName = cssVariableName(tokenPath);
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="h-8 w-8 shrink-0 rounded-md border border-black/10"
        style={{ background: `var(${varName})` }}
      />
      <div>
        <div className="text-sm font-medium">{labelFor(tokenPath)}</div>
        <code className="text-xs text-black/50">{varName}</code>
      </div>
    </div>
  );
}

export function SpacingSwatch({ tokenPath }: { tokenPath: string }) {
  const varName = cssVariableName(tokenPath);
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-3 rounded-sm bg-blue-500" style={{ width: `var(${varName})` }} />
      <code className="text-xs text-black/50">{varName}</code>
    </div>
  );
}

export function TextSampleSwatch({
  tokenPath,
  kind
}: {
  tokenPath: string;
  kind: "fontSize" | "fontWeight" | "lineHeight" | "fontFamily";
}) {
  const varName = cssVariableName(tokenPath);
  const style =
    kind === "fontSize"
      ? { fontSize: `var(${varName})` }
      : kind === "fontWeight"
        ? { fontWeight: `var(${varName})` }
        : kind === "lineHeight"
          ? { lineHeight: `var(${varName})` }
          : { fontFamily: `var(${varName})` };
  return (
    <div className="flex items-center gap-3 py-1">
      <span style={style}>Workshop registration</span>
      <code className="text-xs text-black/50">{varName}</code>
    </div>
  );
}

export function ShadowSwatch({ tokenPath }: { tokenPath: string }) {
  const varName = cssVariableName(tokenPath);
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="h-10 w-10 rounded-md bg-white" style={{ boxShadow: `var(${varName})` }} />
      <code className="text-xs text-black/50">{varName}</code>
    </div>
  );
}
