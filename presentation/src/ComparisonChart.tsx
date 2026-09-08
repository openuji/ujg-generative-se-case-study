import { modelResults } from "./modelResults";
import type { ModelResult } from "./types";

function metricLabel(value: number | undefined, status: ModelResult["status"]) {
  if (status === "failed") {
    return "FAILED";
  }

  return value === undefined ? "RUNNING" : `${value}`;
}

function metricWidth(value: number | undefined) {
  return `${Math.max(2, Math.min(100, value ?? 0))}%`;
}

function dimensionValue(
  result: ModelResult,
  key: "ujgFidelity" | "domainIntegrity" | "verification"
) {
  return metricLabel(result[key], result.status);
}

export function ComparisonChart() {
  return (
    <div className="comparison" aria-label="Model realization comparison">
      <div className="score-chart">
        {modelResults.map((result) => (
          <div className="score-row" key={result.model}>
            <div className="model-name">{result.model}</div>
            <div className="bar-track">
              {result.qualityScore === undefined ? (
                <div className="running-pill">{metricLabel(undefined, result.status)}</div>
              ) : (
                <div
                  className="score-bar"
                  style={{ width: metricWidth(result.qualityScore) }}
                >
                  {metricLabel(result.qualityScore, result.status)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dimensions">
        <div className="dimension-card">
          <h3>UJG behavioral fidelity</h3>
          {modelResults.map((result) => (
            <p key={result.model}>
              <span>{result.model}</span>
              <strong>{dimensionValue(result, "ujgFidelity")}</strong>
            </p>
          ))}
        </div>
        <div className="dimension-card">
          <h3>Domain integrity</h3>
          {modelResults.map((result) => (
            <p key={result.model}>
              <span>{result.model}</span>
              <strong>{dimensionValue(result, "domainIntegrity")}</strong>
            </p>
          ))}
        </div>
        <div className="dimension-card">
          <h3>Verification coverage</h3>
          {modelResults.map((result) => (
            <p key={result.model}>
              <span>{result.model}</span>
              <strong>{dimensionValue(result, "verification")}</strong>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
