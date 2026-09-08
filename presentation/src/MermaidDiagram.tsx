import { useEffect, useId, useMemo, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  flowchart: {
    curve: "basis",
    nodeSpacing: 64,
    rankSpacing: 70,
    htmlLabels: true
  },
  themeVariables: {
    background: "#fbfbf8",
    primaryColor: "#f8fbff",
    primaryTextColor: "#172033",
    primaryBorderColor: "#315c9e",
    lineColor: "#315c9e",
    secondaryColor: "#f6f5ee",
    secondaryTextColor: "#172033",
    tertiaryColor: "#ffffff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    fontSize: "24px",
    clusterBkg: "#ffffff",
    clusterBorder: "#d34935",
    edgeLabelBackground: "#fbfbf8"
  }
});

type MermaidDiagramProps = {
  chart: string;
  label: string;
  className?: string;
};

export function MermaidDiagram({
  chart,
  label,
  className
}: MermaidDiagramProps) {
  const rawId = useId();
  const diagramId = useMemo(
    () => `diagram-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [rawId]
  );
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    mermaid
      .render(diagramId, chart)
      .then(({ svg: renderedSvg }) => {
        if (!isMounted) {
          return;
        }

        setSvg(renderedSvg);
        setError(null);
      })
      .catch((renderError: unknown) => {
        if (!isMounted) {
          return;
        }

        setSvg("");
        setError(
          renderError instanceof Error
            ? renderError.message
            : "Mermaid diagram failed to render."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [chart, diagramId]);

  return (
    <figure
      className={["mermaid-frame", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      {error ? (
        <pre className="diagram-error">{error}</pre>
      ) : (
        <div
          className="mermaid-output"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </figure>
  );
}
