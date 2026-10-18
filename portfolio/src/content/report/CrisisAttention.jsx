import React from "react";
import {DataComponent, DataTable, EvidenceChart, RichNarrative} from "../../data-app-public.jsx";
import {ReportDisclosure} from "../shared/ReportDisclosure.jsx";
import {crisisPeriodRows, crisisSensitivityRows, crisisSupportRows, crisisEvidenceRows} from "./crisis-attention.js";

const queryId = "crisis_attention_v8";
const queryIds = [queryId, "annual", "v2_era_schemes"];
const percentOne = value => Number.isFinite(value) ? `${(100 * value).toFixed(1)}%` : "Unavailable";
const exposureCampaignIds = new Set([
  "korean_war_hostilities_1950_1953", "vietnam_us_escalation_withdrawal_1964_1973",
  "kuwait_invasion_gulf_war_1990_1991", "afghanistan_us_campaign_2001_2021",
  "iraq_us_invasion_withdrawal_2003_2011", "kosovo_nato_air_campaign_1999",
]);

function sources(documents, rows, scheme) {
  return {annual: documents, [queryId]: rows, v2_era_schemes: [scheme]};
}

export function CrisisComposition({measurement, documents, scheme, weight, scope}) {
  if (!measurement.available) return <div className="sotu-empty" role="status">
    {measurement.reason === "unsupported_selection"
      ? "The reviewed crisis breakdown is unavailable for this scoring method or selection. The original attention comparison remains available."
      : measurement.reason === "missing_query"
        ? "The reviewed crisis breakdown has not been loaded. The original attention comparison remains available."
        : "The crisis breakdown does not reconcile with the selected annual observations, so no breakdown is displayed."}
  </div>;
  const rows = crisisPeriodRows(measurement.rows, scheme, weight).filter(row => row.documents > 0);
  const strain = rows.find(row => row.period_id === "preponderance_under_strain");
  const evidence = crisisEvidenceRows(measurement.rows, scheme, weight);
  if (!rows.length) return <div className="sotu-empty" role="status">No reviewed observations match this selection.</div>;
  return <EvidenceChart id="historical-crisis-composition-v8" queryId={queryId} queryIds={queryIds}
    title="Identified crisis references within that attention" rows={rows}
    sourceRowsByQuery={sources(documents, measurement.rows, scheme)} scopeFilters={scope}
    height={350} spec={{type: "horizontalStackedBar", x: "period", y: "crisisShare",
      fields: ["crisisShare", "remainingShare"], startAtZero: true,
      xLabel: "", yLabel: "Share of all speech words", valueDecimals: 1,
      colors: {crisisShare: "#b6423a", remainingShare: "#7d97ae"},
      legend: {labels: {crisisShare: "Identified crisis references", remainingShare: "Remaining foreign-policy text"}}}}
    description="Both components use all speech words as their denominator and add to the original foreign-policy share. Identification is conservative and nonexhaustive: it can miss indirect references. Identified references use explicit wording or a recoverable local argument. The remaining text has not been established as crisis-free. The same weighting applies to both charts.">
    {strain && <p data-reviewed-rows>In the under-strain period, identified crisis passages account for <strong>{percentOne(strain.crisisShare)}</strong> of all speech words; remaining foreign-policy passages account for <strong>{percentOne(strain.remainingShare)}</strong>.</p>}
    <RichNarrative id="historical-crisis-composition-v8:coverage"
      value="Identification is **conservative and nonexhaustive**: it may miss indirect crisis references. The remaining foreign-policy text is **not a crisis-free comparison**." />
    {evidence.available && <ReportDisclosure id="historical-crisis-composition-v8:evidence" label="Inspect target-wording and adjacent-context references">
      <DataTable rows={evidence.rows} searchable={false} label="Crisis references by retrieval route" columns={[
        {field: "label", label: "Period"},
        {field: "explicitShare", label: "Target wording · context reviewed", presentation: "percent", renderCell: percentOne},
        {field: "contextualShare", label: "Added through adjacent context", presentation: "percent", renderCell: percentOne},
        {field: "crisisShare", label: "Combined references", presentation: "percent", renderCell: percentOne},
      ]} />
      <p className="sotu-history-caption">Both routes receive source-context review; this is not a test of context-free versus contextual accuracy. Each column uses all speech words and the selected weighting. Displayed percentages are rounded; totals use unrounded shares. Adjacent-context additions require an accepted anchor and recorded argument connection. The full word-accounting fields remain available through source inspection.</p>
    </ReportDisclosure>}
  </EvidenceChart>;
}

export function CrisisSensitivity({measurement, documents, scheme, weight, scope}) {
  if (!measurement.available || !measurement.rows.length) return null;
  const rows = crisisSensitivityRows(measurement.rows, scheme, weight);
  const strain = rows.find(row => row.period_id === "preponderance_under_strain");
  const excludedRows = measurement.rows.filter(row => row.date < "2002-01-01" || row.date >= "2005-01-01");
  const removed = measurement.rows.length - excludedRows.length;
  const localScope = [...scope, {field: "sensitivity_window", label: "Sensitivity check", value: "Full window versus excluding 2002–2004 speech dates"}];
  return <DataComponent id="historical-crisis-sensitivity-v8" queryId={queryId} queryIds={queryIds}
    title="Does the comparison depend on the opening crisis years?" kind="table"
    sourceRowsByQuery={sources(documents, measurement.rows, scheme)} displayRows={rows} scopeFilters={localScope}
    description="Prespecified sensitivity: remove speeches dated 1 January 2002 through 31 December 2004, then recompute each period using the same corpus, boundaries, text measure and weighting. Every retained share uses all words in the retained speeches as its denominator. The baseline remains unchanged.">
    <RichNarrative id="historical-crisis-sensitivity-v8:explanation"
      value="This check excludes **2002–2004**, the immediate post-9/11 and Iraq-war opening years. The remaining under-strain years still include ongoing warfare, so this is a sensitivity comparison rather than an estimate of peacetime rhetoric." />
    {strain && <p data-reviewed-rows><strong>Under strain:</strong> {percentOne(strain.fullShare)} in the full period; {percentOne(strain.sensitivityShare)} after exclusion, with {strain.remaining_documents} speeches retained.</p>}
    {!removed && <p className="sotu-history-caption" data-reviewed-rows>No speeches in the selected date window fall in 2002–2004; this exclusion does not change the selected observations.</p>}
    <DataTable rows={rows} searchable={false} label="Historical attention with and without 2002–2004" columns={[
      {field: "period", label: "Period"},
      {field: "fullShare", label: "Full period", presentation: "percent", renderCell: percentOne},
      {field: "sensitivityShare", label: "Excluding 2002–2004", presentation: "percent", renderCell: percentOne},
      {field: "difference_pp", label: "Change (pp)", renderCell: value => Number.isFinite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(1)}` : "Unavailable"},
      {field: "excluded_documents", label: "Removed speeches"},
      {field: "remaining_documents", label: "Retained speeches"},
    ]} />
    <ReportDisclosure id="historical-crisis-sensitivity-v8:counts" label="Inspect retained dates and president-years">
      <DataTable rows={rows} searchable={false} label="Sensitivity comparison coverage" columns={[
        {field: "period", label: "Period"},
        {field: "remaining_first", label: "First retained speech"},
        {field: "remaining_last", label: "Last retained speech"},
        {field: "remaining_president_years", label: "President-years"},
        {field: "remaining_presidents", label: "Presidents"},
      ]} />
    </ReportDisclosure>
  </DataComponent>;
}

export function CrisisComparisonSupport({measurement, documents, scheme, scope, eventRows}) {
  if (!measurement.available || !measurement.rows.length) return null;
  const support = crisisSupportRows(measurement.rows, scheme);
  const strain = support.rows.find(row => row.period_id === "preponderance_under_strain");
  const earlier = support.rows.find(row => row.period_id === "post_cold_war_leadership");
  const campaigns = (eventRows ?? []).filter(row => exposureCampaignIds.has(row.event_id));
  const campaignSources = campaigns.length === exposureCampaignIds.size;
  const concentrated = strain && earlier && strain.presidents === 1
    && strain.listed_campaign_exposed_documents === strain.documents
    && earlier.listed_campaign_exposed_documents === 0;
  return <DataComponent id="historical-crisis-adjustment-support-v8" queryId={queryId} queryIds={campaignSources ? [...queryIds,"events"] : queryIds}
    title="What can an adjusted comparison tell us?" kind="custom"
    sourceRowsByQuery={{...sources(documents, measurement.rows, scheme), ...(campaignSources ? {events:campaigns} : {})}} displayRows={support.rows} scopeFilters={scope}
    description="Campaign exposure uses actual speech dates and the six listed U.S.-campaign intervals. Being outside these selected intervals does not mean there was no international crisis. Counts are unchanged by word versus president-year weighting.">
    <RichNarrative id="historical-crisis-adjustment-support-v8:explanation"
      value="**An adjusted era effect is not estimated.** Presidency, historical period and campaign exposure overlap. Statistical adjustment cannot create a comparable peacetime observation where the data do not provide one. The crisis-reference breakdown is an accounting decomposition; it does not estimate what the speeches would have said without a crisis." />
    {concentrated && <p className="sotu-history-caption" data-reviewed-rows>In this selection, all {strain.documents} under-strain {strain.documents === 1 ? "speech is" : "speeches are"} by {strain.president_names[0]} and fall within the listed U.S. campaign intervals; none of the {earlier.documents} earlier comparison {earlier.documents === 1 ? "speech does" : "speeches do"}.</p>}
    {support.available ? <ReportDisclosure id="historical-crisis-adjustment-support-v8:counts" label="Inspect the support for comparable historical settings">
      <DataTable rows={support.rows} searchable={false} label="Presidential composition and listed campaign intervals" columns={[
        {field: "label", label: "Period"},
        {field: "documents", label: "Speeches"},
        {field: "president_years", label: "President-years"},
        {field: "presidents", label: "Presidents"},
        {field: "listed_campaign_exposed_documents", label: "Within listed campaign intervals"},
        {field: "outside_listed_campaign_documents", label: "Outside listed intervals"},
      ]} />
      {campaignSources ? <DataTable rows={campaigns} searchable={false} label="Six source-backed campaign intervals used for date exposure" columns={[
        {field: "label", label: "Listed campaign scope"},
        {field: "start_date", label: "Interval begins"},
        {field: "end_date", label: "Interval ends"},
      ]} /> : <p className="sotu-history-caption" role="status">The six reviewed campaign definitions have not been loaded, so their interval table is unavailable.</p>}
      <p className="sotu-history-caption">The listed start and end dates are included. These intervals are a selected U.S.-campaign register, not an exhaustive list of crises. Date overlap does not establish that a speech discussed that campaign; the text-based breakdown above uses separate evidence.</p>
    </ReportDisclosure> : <p className="sotu-history-caption" role="status">Reviewed campaign-date coverage is unavailable for the selected observations, so no overlap counts are shown.</p>}
  </DataComponent>;
}
