import React from "react";
import { DataComponent, DataTable, RichNarrative, useDataApp } from "../../data-app-public.jsx";

export function ModelReleaseStatus() {
  const { queries } = useDataApp();
  const statuses = queries.released_models?.rows ?? [];
  if (!statuses.length) return null;
  return <div id="sotu-nav-model-status" className="sotu-section-anchor" tabIndex={-1}>
    <DataComponent id="model-release-status" queryId="released_models" title="V2 model and historical benchmarks"
      kind="table" sourceRows={statuses} displayRows={statuses}
      description="V2 supplies the live analysis. V0 and v1 are published benchmark summaries; their full models and old reports are not part of this release. This fixed reference does not follow the corpus or year filters.">
      <RichNarrative id="model-release-status:explanation" value="**The report uses the released v2 model by default.** The v0 dictionary baseline and v1 text classifier are retained as benchmark summaries in the common-reference table. The four-tradition timeline and administration comparison show diagnostic model detections, while paired contextual examples illustrate interpretations; neither establishes validated tradition prevalence.\n\nFuture models will consider expanding the corpus as additional data become available and incorporating further contextual control variables. Potential extensions include presidential UN General Assembly addresses, with separate source checks and validation before comparison." />
      <DataTable rows={statuses} searchable={false} label="Released model status" columns={[
        { field: "version", label: "Version" }, { field: "method", label: "Approach" },
        { field: "status", label: "Release status" },
      ]} />
      <p><a href="https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/release_status.md" target="_blank" rel="noreferrer">Read the live model and planned extensions ↗</a></p>
    </DataComponent>
  </div>;
}
