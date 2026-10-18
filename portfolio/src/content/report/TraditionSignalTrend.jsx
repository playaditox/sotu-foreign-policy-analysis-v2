import React, { useState } from "react";
import { Dropdown, RichNarrative } from "../../data-app-public.jsx";
import { HistoricalTrend } from "./HistoricalTrend.jsx";
import { methodLabels, pooled, traditions } from "./sotu-data.js";

export function TraditionSignalTrend({ documents, allRows, method, corpus, events, scopeFilters }) {
  const [denominator, setDenominator] = useState("foreign_policy");
  const ids = new Set(documents.map(row => row.document_id));
  // Always use the supported heads: explicit Jeffersonian is unavailable in v2.
  // Re-select from reviewed rows rather than converting that missing head to zero.
  const source = allRows.filter(row => ids.has(row.document_id)
    && row.scoring_method === method && row.corpus_variant === corpus && row.threshold === "supported");
  const rows = [...source].sort((a, b) => a.date.localeCompare(b.date) || a.document_id.localeCompare(b.document_id))
    .map(row => ({ ...row, ...pooled([row]) }));
  const whole = denominator === "all_words";
  const fields = traditions.map(item => `${item.label}${whole ? "WholeShare" : "Share"}`);
  const localScope = [...scopeFilters.filter(item => item.field !== "threshold"),
    { field: "threshold", label: "Evidence", value: "supported" },
    { field: "denominator", label: "Percentage of", value: whole ? "All speech words" : "Foreign-policy words" }];
  if (!rows.length) return null;
  return <div id="sotu-nav-tradition-timeline" className="sotu-tradition-signal-trend sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="tradition-signal-trend:definition"
      value={`Each line shows words in sentences assigned to a tradition by **${methodLabels[method] ?? method}**, divided by **${whole ? "all speech words" : "all model-identified foreign-policy words"}** in that document. The four reasons can overlap, so their percentages do not sum to 100%. Surrounding context adds no counted words.\n\n**Model detections:** classification errors limit interpretation, especially for Jacksonian and Jeffersonian. These lines are a diagnostic view of the released scores, rather than validated estimates of how prevalent each tradition was.`} />
    <HistoricalTrend id="tradition-signal-trend" queryId="annual" events={events}
      title="Four traditions over time · model detections" rows={rows} sourceRows={source}
      scopeFilters={localScope} height={390}
      headerControls={<Dropdown label="Percentage of" showLabel value={denominator}
        choices={["foreign_policy", "all_words"]}
        choiceLabels={{foreign_policy:"Foreign-policy words",all_words:"All speech words"}}
        onChange={setDenominator} />}
      spec={{type:"line", x:"date", y:fields[0], fields, startAtZero:true, stackable:false,
        xLabel:"Address date", yLabel:whole ? "Share of all speech words" : "Share of foreign-policy words", valueDecimals:1,
        colors:Object.fromEntries(traditions.map((item, index) => [fields[index], item.color])),
        legend:{labels:Object.fromEntries(traditions.map((item, index) => [fields[index], item.label]))}}}
      description="Supported automatic tradition detections from the selected released method, with original sentence-word numerators. The denominator control changes only the denominator; all four numerators stay fixed. Each point is a document at its actual date; connecting curves are visual guides, not fitted trends or confidence intervals. Reasons overlap; missing values stay missing. The historical v2 tradition checks do not establish reliable tradition prevalence; newer experimental models and curated example frequencies are not substituted. Event proximity does not establish causation." />
  </div>;
}
