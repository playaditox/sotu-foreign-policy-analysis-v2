import { ModelReleaseStatus } from "./ModelReleaseStatus.jsx";
import React from "react";
import { DataComponent, DataTable, RichNarrative, useDataApp } from "../../data-app-public.jsx";
import { methodLabels } from "./sotu-data.js";

export function PublicMethodAudit({methods,selectedMethod,onMethodChange,corpusControl}) {
  const {queries}=useDataApp();
  const source=(queries.v2_method_comparison?.rows??[]).filter(row=>row.task==="foreign_policy" && row.sample==="reserved_probability_audit");
  const rows=source.map(row=>({...row,methodLabel:methodLabels[row.method]??row.method}));
  return <section className="sotu-methods">
    <RichNarrative id="public-model-methods:body" value="## How the text is measured\n\nForeign-policy attention is the share of speech words in sentences identified as discussing external affairs. Issue dictionaries identify named subjects within those sentences. Surrounding text clarifies references; it is not counted again. These measures describe presidential language rather than enacted policy.\n\nThe comparison below uses the same reserved reference passages for all three methods. **Detected** counts reference-positive passages found; **missed** counts those overlooked; **false alarms** counts reference-negative passages flagged. Precision is the fraction of flagged passages that the reference calls foreign policy; recall is the fraction of reference-positive passages detected. Of 400 probability-sampled passages, 370 have resolved reference labels and 30 remain unresolved. The reserved episodes had historical v1 reference exposure, although they were excluded from v2 fitting. A separate 200-passage challenge set tests difficult cases and is not pooled with the probability sample to estimate corpus prevalence. The reference was coded with AI assistance, so these figures measure agreement with that reference rather than independently human-validated accuracy." />
    {corpusControl}
    <ModelReleaseStatus />
    <div id="sotu-nav-reserved-comparison" className="sotu-section-anchor" tabIndex={-1}><DataComponent id="v2-method-comparison" queryId="v2_method_comparison" title="Foreign-policy detection on the same reserved reference" sourceRows={source} displayRows={rows} kind="table"
      description="Fixed historical v2 audit. All three methods use the same 370 resolved cases from a 400-passage probability sample. Thirty unresolved reference cases remain outside the reported counts. This does not validate the four tradition tasks.">
      <DataTable rows={rows} searchable={false} label="Foreign-policy method comparison" columns={[{field:"methodLabel",label:"Method"},{field:"evaluated",label:"Usable cases"},{field:"positive",label:"Reference positives"},{field:"detected",label:"Detected"},{field:"missed",label:"Missed"},{field:"false_alarms",label:"False alarms"},{field:"precision",label:"Precision",presentation:"percent"},{field:"recall",label:"Recall",presentation:"percent"}]} />
    </DataComponent></div>
    <RichNarrative id="public-model-methods:release-scope" value="The attention charts use the released **v2 classifier**. V0 and v1 appear only as historical benchmarks in the table. Named-subject rules and the paired tradition examples apply the later, stricter distinction between direct international affairs and domestic appeals. The table above evaluates the original v2 construct. Future models will consider additional corpus data and contextual control variables, with separate validation before release." />
    <a href="https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/validation_current.md" target="_blank" rel="noreferrer">Read the released-model validation methods ↗</a>
  </section>;
}
