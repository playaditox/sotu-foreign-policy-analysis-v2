import { ContextVariables } from "./ContextVariables.jsx";
import { ResearchDesign } from "./ResearchDesign.jsx";
import { ReportContents } from "./ReportContents.jsx";
import { PublicMethodAudit } from "./PublicMethodAudit.jsx";
import { TraditionSignalTrend } from "./TraditionSignalTrend.jsx";
import React, { useMemo, useState } from "react";
import {
  DataComponent, DataTable, Dropdown, EvidenceChart, RangeSlider, ReportSection,
  RichNarrative, SegmentedControl, useDataApp, useSectionFilters,
} from "../../data-app-public.jsx";
import {
  administrationRows, annualize, compactNumber, corpusLabels, dateBounds, eventLabelDate,
  eventRows, fractionalYear, humanize, issueSummary, methodLabels, normalizeEvidence, pct, pooled,
  thresholdLabels, traditions, withinYears, aggregate,
} from "./sotu-data.js";
import { ReportDisclosure } from "../shared/ReportDisclosure.jsx";
import { HistoricalEventsContext, HistoricalTrend } from "./HistoricalTrend.jsx";
import { IssueAnalysis } from "./IssueAnalysis.jsx";
import { ContextualTraditions } from "./ContextualTraditions.jsx";
import { HistoricalPeriods } from "./HistoricalPeriods.jsx";

const allQueries = ["annual", "issues"];
const frameColors = Object.fromEntries(traditions.map(item => [`${item.label}Share`, item.color]));
const frameFields = traditions.map(item => `${item.label}Share`);
const frameLegend = { labels: Object.fromEntries(traditions.map(item => [`${item.label}Share`, item.label])) };
const frameSpec = { type: "line", x: "date", y: "WilsonianShare", fields: frameFields,
  xLabel: "Address date", yLabel: "Share of foreign-policy words",
  colors: frameColors, dashedFields: ["JeffersonianShare"], legend: frameLegend, startAtZero: true, stackable: false, valueDecimals: 1 };

function Prose({ id, queryId = "annual", rows, title, value, className = "" }) {
  const { visible } = useDataApp();
  if (!visible(id)) return null;
  return <div id={`sotu-nav-${id}`} className="sotu-section-anchor" tabIndex={-1}><ReportSection id={id} title={title} queryId={queryId} sourceRows={rows}
    className={className} showHeading={false}>
    <RichNarrative id={`${id}:body`} value={value} label={`Edit ${title}`} />
  </ReportSection></div>;
}
function Empty({ children = "No reviewed observations match this selection." }) {
  return <div className="sotu-empty" role="status">{children}</div>;
}
function Metric({ id, title, value, detail, rows, scopeFilters }) {
  return <DataComponent id={id} title={title} queryId="annual" kind="metric"
    sourceRows={rows} displayRows={[{ metric: title, value, detail }]} scopeFilters={scopeFilters}
    variant="card" padding="spacious">
    <div className="sotu-metric-value" data-reviewed-rows>{value}</div>
    <div className="sotu-metric-detail" data-reviewed-rows>{detail}</div>
  </DataComponent>;
}

function PassageExplorer({ rows, scopeFilters, threshold }) {
  const [tradition, setTradition] = useState("positive");
  const [selectedId, setSelectedId] = useState(null);
  const normalized = useMemo(() => rows.map(normalizeEvidence), [rows]);
  const minimum = threshold === "explicit" ? 2 : 1;
  const hasSignal = row => traditions.some(item => Number(row.labels[item.key]) >= minimum);
  const missingSignal = row => traditions.some(item => row.labels[item.key] == null || (threshold === "explicit" && row.explicitness_availability?.[item.key] === false));
  const filtered = normalized.filter(row => tradition === "all" || (tradition === "positive" ? hasSignal(row)
    : tradition === "none" ? !hasSignal(row) && !missingSignal(row) : tradition === "unavailable" ? missingSignal(row) : Number(row.labels[tradition]) >= minimum)).map(row => ({ ...row,
      labelSummary: traditions.filter(item => Number(row.labels[item.key]) >= minimum).map(item => item.label).join(" + ") || (missingSignal(row) ? "Some signals unavailable" : "No tradition signal"),
    }));
  const selected = filtered.find(row => row.sentence_id === selectedId) ?? filtered[0];
  const ids = new Set(filtered.map(row => row.sentence_id));
  const sourceRows = rows.filter(row => ids.has(row.sentence_id ?? row.id));
  const localScope = [...scopeFilters, ...(tradition === "all" ? [] : [{ field: "tradition", label: "Passage view",
    value: tradition === "positive" ? "Any tradition signal" : tradition === "none" ? "No tradition signal" : tradition === "unavailable" ? "Unavailable task" : humanize(tradition) }])];
  return <div className="sotu-passages">
    <div className="sotu-evidence-scope" data-reviewed-rows>
      A bounded selection of {rows.length} supplied sentences is available for this corpus and date window. This is not a full-corpus search or an accuracy sample. Use the passage selector to inspect detected signals or negative cases.
    </div>
    <DataComponent id="passage-evidence" queryId="evidence" title="Inspect the language behind the labels"
      kind="table" displayRows={filtered} sourceRows={sourceRows} scopeFilters={localScope}
      description="The supplied evidence passages are inspectable examples, not a random accuracy sample. Select a row to read context and matched evidence.">
      <DataTable rows={filtered} rowKey="sentence_id" selectedRowKey={selected?.sentence_id}
        onRowSelect={row => setSelectedId(row.sentence_id)} rowActionLabel={row => `Read evidence from ${row.president}, ${row.year}`}
        label="Sentence evidence" toolbarControls={<Dropdown label="Passages" showLabel
          value={tradition} choices={["positive", "all", "none", "unavailable", ...traditions.map(item => item.key)]}
          choiceLabels={{ positive: "Any tradition signal", all: "All supplied sentences", none: "No tradition signal", unavailable: "Unavailable task", ...Object.fromEntries(traditions.map(item => [item.key, item.label])) }} onChange={setTradition} />}
        columns={[{ field: "year", label: "Year" }, { field: "president", label: "President" },
          { field: "labelSummary", label: "Tradition signals" },
          { field: "text", label: "Sentence", renderCell: value => <span className="sotu-sentence-preview">{value}</span> }]} />
    </DataComponent>
    {selected && <DataComponent id="passage-detail" queryId="evidence" title={`${selected.president} · ${selected.year}`}
      kind="custom" sourceRows={sourceRows.filter(row => (row.sentence_id ?? row.id) === selected.sentence_id)}
      displayRows={[selected]} scopeFilters={localScope} variant="card">
      <div data-reviewed-rows>
        <div className="sotu-passage-meta">{selected.party} · {humanize(selected.document_type)} · {selected.date ?? selected.year} · FP relevance: {selected.fp_relevance ?? (selected.foreign_policy == null ? "unavailable" : selected.foreign_policy ? "yes" : "no")}</div>
        <blockquote className="sotu-passage-quote">“{selected.text}”</blockquote>
        <div className="sotu-labels">{traditions.map(item => <span key={item.key} className="sotu-label"
          style={{ borderColor: item.color, color: item.color }}>{item.label}: {selected.labels[item.key] == null || (threshold === "explicit" && selected.explicitness_availability?.[item.key] === false) ? "unavailable" : Number(selected.labels[item.key]) || 0}</span>)}</div>
        {selected.evidence_status && <p>{selected.evidence_status}</p>}
        {selected.rationale_predictions?.length > 0 && <p><strong>Predicted rationales:</strong> {selected.rationale_predictions.map(humanize).join(", ")}</p>}
        {Object.entries(selected.evidence).length > 0 && <div className="sotu-matched-evidence">
          {Object.entries(selected.evidence).map(([key, evidence]) => <p key={key}><strong>{humanize(key)}:</strong> {typeof evidence === "string" ? evidence : JSON.stringify(evidence)}</p>)}
        </div>}
        {selected.context && <div className="sotu-context"><ReportDisclosure id="passage-detail:context" label="Read neighboring context"><p>{typeof selected.context === "string" ? selected.context : JSON.stringify(selected.context)}</p></ReportDisclosure></div>}
        {selected.source_url && <a className="sotu-source-link" href={selected.source_url} target="_blank" rel="noreferrer">Read the original address ↗</a>}
      </div>
    </DataComponent>}
    {!filtered.length && <Empty>No supplied evidence passages match this selection.</Empty>}
  </div>;
}

export function ReportContent() {
  const [showHistoricalEvents, setShowHistoricalEvents] = useState(true);
  const { queries, appTitle, setAppTitle, canEdit, mode } = useDataApp();
  const rawAnnual = (queries.annual?.rows ?? []).filter(row => row.scoring_method === "contextual_rationale_v2");
  const variants = [...new Set(rawAnnual.map(row => row.corpus_variant).filter(Boolean))];
  const thresholds = [...new Set(rawAnnual.map(row => row.threshold).filter(Boolean))];
  const methods = [...new Set(rawAnnual.map(row => row.scoring_method ?? "contextual_dictionary_v1"))];
  const definitions = [
    ...(variants.length ? [{ id: "corpus", field: "corpus_variant", label: "Corpus", defaultValue: variants.includes("inclusive") ? "inclusive" : variants[0], queryIds: allQueries }] : []),
    { id: "period", field: "date", label: "Address window", mode: "through", defaultValue: "all", queryIds: ["annual"] }];
  const scope = useSectionFilters(definitions, {}, { id: "sotu-analysis", label: "Analysis scope" });
  const contextual = "contextual_rationale_v2" === "contextual_rationale_v2";
  const framingReady=false; // Released tradition detections remain diagnostic.
  const contextualAuditReady = !!queries.v2_method_comparison?.rows?.length;
  const supervised = contextual || "contextual_rationale_v2" === "supervised_tfidf_v1";
  const scoped = scope.componentProps("annual", ["date", "year", "document_id"]);
  const documents = scoped.displayRows;
  const bounds = dateBounds(scope.values.period);
  const availableDates = [...new Set(rawAnnual.map(row => row.date).filter(Boolean))].sort();
  const setYears = ([startYear, endYear]) => {
    if (!availableDates.length) return;
    if (startYear === 1946 && endYear === 2026) { scope.setFilter("period", "all"); return; }
    const from = `${startYear}-01-01` < availableDates[0] ? availableDates[0] : `${startYear}-01-01`;
    const to = `${endYear}-12-31` > availableDates.at(-1) ? availableDates.at(-1) : `${endYear}-12-31`;
    scope.setFilter("period", `${from}..${to}`);
  };
  const history = annualize(documents);
  const documentHistory = [...documents].sort((a, b) => a.date.localeCompare(b.date)).map(row => ({
    ...row, ...pooled([row]), date: row.date,
  }));
  const totals = pooled(documents);
  const without1946 = pooled(documents.filter(row => Number(row.year) !== 1946));
  const administrations = administrationRows(documents);
  const parties = aggregate(documents, "party").map(({ members, ...group }) => ({ ...group, party: group.group }));
  const documentIds = new Set(documents.map(row => row.document_id));
  const issues = withinYears(scope.reviewedRows("issues", ["year", "issue", "document_id"]), bounds)
    .filter(row => row.document_id ? documentIds.has(row.document_id) : true);
  const passages = withinYears(queries.evidence?.rows ?? [], bounds)
    .filter(row => row.document_id ? documentIds.has(row.document_id) : true)
    .filter(row => (row.scoring_method ?? row.method ?? "contextual_dictionary_v1") === "contextual_rationale_v2");
  const events = eventRows(queries.events?.rows ?? []);
  const evaluation = queries.model_evaluation?.rows ?? [];
  const evaluationRows = evaluation.map(row => ({ ...row,
    taskLabel: row.task === "foreign_policy" ? "Foreign-policy relevance" : humanize(row.task), methodLabel: methodLabels[row.scoring_method ?? row.method] ?? humanize(row.scoring_method ?? row.method),
    referenceN: row.reference_n ?? row.n, positiveN: row.positive_n ?? row.reference_positive,
    sampleLabel: String(row.partition).includes("reserved") ? "Reserved documents"
      : /cv|cross|development/i.test(row.partition ?? "") ? "Grouped development CV" : humanize(row.partition ?? "Reserved documents"),
  }));
  const reservedFP = evaluation.filter(row => row.task === "foreign_policy" && String(row.partition).includes("reserved"));
  const baselineFP = reservedFP.find(row => (row.scoring_method ?? row.method) === "contextual_dictionary_v1");
  const classifierFP = reservedFP.find(row => (row.scoring_method ?? row.method) === "supervised_tfidf_v1");
  const contextualFPCheck = (queries.v2_method_comparison?.rows ?? []).find(row => row.task === "foreign_policy" && row.method === "contextual_rationale_v2" && row.sample === "reserved_probability_audit");
  const auditSummary = contextual && contextualFPCheck
    ? `\n- **Frozen-model check:** it detected ${contextualFPCheck.detected} of ${contextualFPCheck.positive} resolved reference-positive passages and raised ${contextualFPCheck.false_alarms} false alarms in the 400-case probability audit. ${400 - contextualFPCheck.reference_known} reference meanings remain unresolved. See the task-level audit below; this is AI-reference agreement.` : "";
  const [comparisonMeasure, setComparisonMeasure] = useState("attention");
  const scopeFilters = scoped.scopeFilters;
  const coveredYears = [...new Set(documents.map(row => Number(row.year)))].sort((a, b) => a - b);
  const coverage = coveredYears.length > 1 ? `${coveredYears[0]}–${coveredYears.at(-1)}` : String(coveredYears[0] ?? "1946–2026");
  const presidentCount = new Set(documents.map(row => String(row.president).replace(/\s*\([^)]*term[^)]*\)/gi, "").trim())).size;
  const highest = history.reduce((best, row) => !best || row.fpShare > best.fpShare ? row : best, null);
  const lowest = history.reduce((best, row) => !best || row.fpShare < best.fpShare ? row : best, null);
  const selectedCorpus = corpusLabels[scope.values.corpus] ?? "Eligible corpus";
  const selectedThreshold = thresholdLabels["supported"] ?? "Supported signals";
  const rangeDescription = history.length > 1
    ? `Annual pooled attention ranges from ${pct(lowest.fpShare)} in ${lowest.year} to ${pct(highest.fpShare)} in ${highest.year}`
    : history.length ? `Calendar-year pooled attention is ${pct(highest.fpShare)} in ${highest.year}` : "No annual estimate is available";
  const comparisonFields = comparisonMeasure === "attention" ? ["fpShare"] : frameFields;
  const comparisons = { type: "horizontalBar", x: "displayLabel", y: comparisonFields[0], fields: comparisonFields,
    startAtZero: true, stackable: false, colors: comparisonMeasure === "attention"
      ? Object.fromEntries(administrations.map(row => [row.displayLabel, row.party === "Democrat" ? "#477fb6" : "#c44e45"]))
      : frameColors,
    legend: comparisonMeasure === "attention" ? { labels: { fpShare: "Foreign-policy attention" } } : frameLegend, valueDecimals: 1 };

  const corpusControl = variants.length > 1 ? <div id="sotu-nav-corpus-formats" className="sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="corpus-formats:description" value="### Corpus formats\n\nThe report uses all eligible formats by default. Choose a narrower set to check sensitivity to written messages or radio summaries. This updates the report’s analysis; the validation tables retain their fixed reference sample." />
    <div className="sotu-control-group" role="group" aria-label="Corpus formats">
      <Dropdown label="Corpus formats" value={scope.values.corpus} choices={variants}
        choiceLabels={corpusLabels} onChange={value => scope.setFilter("corpus", value)} />
    </div>
  </div> : null;

  return <HistoricalEventsContext.Provider value={{ showEvents: showHistoricalEvents, setShowEvents: setShowHistoricalEvents }}><article className="report-content sotu-report" aria-label="State of the Union foreign-policy portfolio report">
    <header className="report-hero sotu-hero">
      <div className="sotu-project-bar">
        <div className="sotu-eyebrow" data-reviewed-rows>STATE OF THE UNION · 1946–2026</div>
        <a className="sotu-repository-link" href="https://github.com/playaditox/sotu-foreign-policy-analysis-v2"
          target="_blank" rel="noopener noreferrer" aria-label="View project on GitHub (opens in a new tab)">
          View on GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>
      <h1 data-data-app-title contentEditable={canEdit && mode === "edit"} suppressContentEditableWarning
        onBlur={canEdit && mode === "edit" ? event => setAppTitle(event.currentTarget.textContent.trim() || appTitle) : undefined}>{appTitle}</h1>
      <RichNarrative id="sotu:deck" className="report-deck" label="Edit project introduction"
        value="A reproducible text analysis of State of the Union messages: measuring attention to foreign affairs, identifying international subjects, and examining the reasons presidents give for America’s role abroad." />
    <div className="sotu-status">{contextual ? "Contextual rationale classifier · v2" : supervised ? "Original AI-assisted text classifier · v1" : "Interpretable dictionary baseline"}
        <span>{!framingReady ? "Word-weighted attention · named subjects · traditions in context" : contextual ? "Contextual reference labels · nested episode evaluation · per-task calibration and rare-case limits"
          : supervised ? "TF-IDF + logistic regression · AI-labelled reference examples · model probabilities are uncalibrated"
          : "AI assisted design and review · contextual rules · no full-corpus LLM coding"}</span></div>
    </header>
    <RichNarrative id="release-status:summary" value="**Released scoring model: v2.** The published v0 and v1 benchmarks remain in the common-reference comparison table. Future models will consider a larger corpus, as data become available, and additional contextual control variables. [See released models and future work](#sotu-nav-model-status)." />
    {documents.length>0 && <ReportContents contextual={contextual}
      hasIssueExamples={contextual && (queries.issue_examples_public_v4?.rows??[]).some(row=>documentIds.has(row.document_id))}
      hasTraditionExamples={(queries.contextual_examples_v4?.rows??[]).some(row=>documentIds.has(row.document_id))}
      has1946={documents.some(row=>Number(row.year)===1946)} />}
    {contextual && !contextualAuditReady && <RichNarrative id="v2-preview-status" value="**Work in progress.** These are frozen v2 model predictions. Reserved reference coding is underway; the new audit and statistical estimates are not yet available. This local preview has not been published." />}
    <div className="sotu-controls" aria-label="Change the analysis scope">
      {framingReady && thresholds.length > 1 && <div className="sotu-control-group"><span className="sotu-control-label">Tradition threshold</span>
        <SegmentedControl value={"supported"} options={thresholds.map(value => ({ value, label: thresholdLabels[value] ?? humanize(value) }))}
          onChange={value => scope.setFilter("threshold", value)} /></div>}
      <div className="sotu-year-control"><RangeSlider id="sotu-year-range" label="Speech years" min={1946} max={2026}
        step={1} value={bounds} onChange={setYears} showBounds formatValue={String} disabled={!rawAnnual.length} /></div>
    </div>
    {documents.length ? <>
      <Prose id="executive-summary" title="Executive Summary" rows={documents} className="sotu-summary"
        value={framingReady ? `## Executive Summary\n\n- **${totals.documents} ${totals.documents === 1 ? "document" : "documents"} across ${coveredYears.length} ${coveredYears.length === 1 ? "year" : "years"}** ${totals.documents === 1 ? "traces" : "trace"} ${presidentCount} ${presidentCount === 1 ? "president" : "presidents"} in the selected ${coverage} window, covering ${compactNumber(totals.total_words)} words.\n- **${pct(totals.fpShare)} of those words appear in sentences identified as foreign policy.** ${rangeDescription} under this ${supervised ? "classifier" : "dictionary baseline"}.\n- The four traditions are **overlapping signals**, not four kinds of president. Their rates use foreign-policy words as the denominator and may sum above 100%.${framingReady ? auditSummary : ""}\n\nThe current view is **${selectedCorpus.toLowerCase()} · ${selectedThreshold.toLowerCase()}**. ${supervised ? "The classifier learns from an AI-assisted reference. Reference agreement does not establish independently human-validated accuracy; rare tasks and unresolved cases need separate checks." : "Classification uncertainty remains; agent calibration measured agreement on development examples, not human-validated accuracy."}` : `## Executive Summary\n\n- **${totals.documents} documents across ${coveredYears.length} years** cover ${compactNumber(totals.total_words)} words in the selected ${coverage} window.\n- **${pct(totals.fpShare)} of those words appear in sentences identified as foreign policy.** ${rangeDescription} under this ${supervised ? "classifier" : "dictionary baseline"}.\n\nExplore named international subjects, compare attention across presidents and historical periods, and read the four traditions in their original context.`} />
      <div className="sotu-metrics">
        <Metric id="corpus-size" title="Documents" value={String(totals.documents)} detail={`${coveredYears.length} covered ${coveredYears.length === 1 ? "year" : "years"} · ${coverage}`} rows={documents} scopeFilters={scopeFilters} />
        <Metric id="text-volume" title="Words analysed" value={compactNumber(totals.total_words)} detail="Original word counts; context is not counted twice" rows={documents} scopeFilters={scopeFilters} />
        <Metric id="fp-share" title="Foreign-policy attention" value={pct(totals.fpShare)} detail="FP sentence words / all document words" rows={documents} scopeFilters={scopeFilters} />
      </div>
      <ResearchDesign />
      <section className="sotu-question">
        <Prose id="attention-explainer" title="How much attention does foreign policy receive?" rows={documents}
          value="## 1. How much attention does foreign policy receive?\n\nA long foreign-policy passage should count more than a short one. Each observation divides words in sentences identified as foreign policy by all words in that document. The horizontal position is its actual delivery or publication date. Compare document formats in [How the text is measured](#sotu-nav-corpus-formats)." />
        {!contextual && classifierFP && baselineFP && <Prose id="fp-validation" queryId="model_evaluation" rows={reservedFP} title="The original detection trade-off"
          value="The original v1 check had **75 usable AI reference sentences: 17 foreign-policy positives and 58 negatives**. The classifier found **16 of the 17 positives**, missed one, and raised **10 false alarms**. The dictionary found five, missed 12, and raised two false alarms. The classifier recovered more positive cases but also made more false detections. These counts describe this small AI reference, not independently human-validated accuracy." />}
        <div id="sotu-nav-attention-timeline" className="sotu-section-anchor" tabIndex={-1}><HistoricalTrend id="fp-attention" events={events} queryId="annual" title="Foreign-policy attention over time"
          spec={{ type: "line", x: "date", y: "fpShare", startAtZero: true, stackable: false,
            xLabel: "Address date", yLabel: "Share of all words",
            colors: { fpShare: "#477fb6" }, legend: { labels: { fpShare: "Share of all words" } }, valueDecimals: 1 }}
          rows={documentHistory} sourceRows={documents} scopeFilters={scopeFilters} height={325}
          description="Document word shares at actual delivery or publication dates. Curves connect observations as visual guides, not fitted trends. Multiple documents in a year remain separate observations; no statistical error band is implied." /></div>
      </section>
      <IssueAnalysis documents={documents} originalIssues={issues} events={events} queries={queries}
        scopeFilters={scopeFilters} contextual={contextual} />
      {queries.contextual_examples_v4?.rows?.length>0 && <ContextualTraditions documents={documents} queries={queries}
        events={events} scopeFilters={scopeFilters} quantitative={false}
        trend={!framingReady ? <TraditionSignalTrend documents={documents} allRows={rawAnnual}
          method={"contextual_rationale_v2"} corpus={scope.values.corpus} events={events} scopeFilters={scopeFilters} /> : null} />}
      <section className="sotu-question">
        <Prose id="comparison-explainer" title="Compare administrations, then parties" rows={documents}
          value="## Compare administrations, then parties\n\nEach row pools words across an administration in the selected window. Nonconsecutive administrations remain separate. Party summaries reflect different historical periods and speakers; they describe the corpus and do not isolate a party effect." />
        <div id="sotu-nav-administrations" className="sotu-section-anchor" tabIndex={-1}>
          <EvidenceChart key={comparisonMeasure} id={comparisonMeasure === "attention" ? "president-comparison" : "president-tradition-comparison"}
            queryId="annual" title={comparisonMeasure === "attention" ? "Foreign-policy share of State of the Union words, by administration (%)" : "Exploratory tradition signals as a share of foreign-policy words, by administration (%)"}
            spec={comparisons} rows={administrations} sourceRows={documents} scopeFilters={scopeFilters}
            height={Math.max(540, administrations.length * (comparisonMeasure === "traditions" ? 104 : 41))}
            headerControls={<div role="group" aria-label="Administration comparison measure"><SegmentedControl value={comparisonMeasure} onChange={setComparisonMeasure}
              options={[{ value: "attention", label: "Foreign-policy attention" }, { value: "traditions", label: "Tradition signals" }]} /></div>}
            description={comparisonMeasure === "attention"
              ? "Word-weighted foreign-policy attention by administration. All document words form the denominator; repeated speeches do not identify a causal party effect."
              : "Exploratory detections from the selected released method. Each tradition's labelled foreign-policy sentence words / all detected foreign-policy words in the selected messages. Four separate, overlapping series; no 100% total or validated prevalence claim."}
            renderPlot={plot => <>
              {comparisonMeasure === "traditions" && <RichNarrative id="president-tradition-comparison:interpretation" label="Edit tradition comparison interpretation"
                value={`**Exploratory model detections · ${methodLabels["contextual_rationale_v2"] ?? humanize("contextual_rationale_v2")}.** **Blue: Wilsonian; amber: Hamiltonian; rose: Jacksonian; green: Jeffersonian.** Each bar divides words in foreign-policy sentences carrying that label by all detected foreign-policy words for the administration. Labels overlap, so the bars need not add to 100%. Weak tradition validation prevents prevalence claims or ideological rankings. A zero means no qualifying detection, not absence of the tradition; unavailable values remain missing. D = Democrat; R = Republican.`} />}
              {plot}
            </>} />
        </div>
        {comparisonMeasure === "attention" && <RichNarrative id="president-comparison:party-key" label="Edit party key"
          value="D = Democrat (blue); R = Republican (red) in the foreign-policy attention view. Each bar shows foreign-policy words divided by all words in the selected messages for that administration. Administrations appear in chronological order. Exact covered years and full names remain in the source data." />}

      </section>
      {!framingReady && <HistoricalPeriods documents={documents} queries={queries} scopeFilters={scopeFilters} />}
      <ContextVariables documents={documents} scopeFilters={scopeFilters} />
    </> : <Empty>The full-corpus results are being prepared. No demonstration values have been substituted.</Empty>}
    <section id="sotu-nav-methods" className="sotu-methods sotu-section-anchor" tabIndex={-1}>
      {contextualAuditReady && <PublicMethodAudit corpusControl={corpusControl} methods={methods} selectedMethod={"contextual_rationale_v2"} onMethodChange={value=>scope.setFilter("method",value)} />}
      <Prose id="methods-and-limits" title="How to read these results" rows={documents}
        value={framingReady ? `## How to read these results\n\n**Why State of the Union messages?** They provide a recurring annual record of how presidents present their priorities to Congress and the public. Usually delivered early in the calendar year, the address reviews the nation’s condition and sets out the administration’s executive and legislative agenda for the year ahead. It brings foreign policy and defense into the same forum as education, healthcare, employment and other domestic concerns. Following the thesis, this repeated setting helps compare the attention given to external affairs and the reasons offered for America’s role abroad across presidents and historical contexts. It captures the president’s public agenda rather than the full range of U.S. foreign-policy activity. [Background: Congressional Research Service](https://www.congress.gov/crs-product/R40132).\n\n**Corpus.** The target window is 1946–2026. All eligible formats retains annual written messages, joint-session addresses, and separately identified radio summaries. Annual messages excludes radio summaries; joint-session addresses restricts the view to spoken SOTU and first-year addresses. Multiple documents in one year are pooled by words.\n\n**Measurement.** ${contextual ? "Separate TF-IDF/logistic tasks predict relevance, traditions, and rationale categories from source text. Contextual agents use dated source context; their explanations, party, president and era labels are excluded from the main model features. Eligible common tasks use a sigmoid mapping learned from grouped out-of-fold probability-sample predictions; rare tasks remain uncalibrated or unavailable. Issues use expanded, scope-guarded rules behind the frozen relevance gate. Broad families are the default; specific issues, general external wording and remaining coverage gaps are disclosed separately. A 164-passage development review retains context and a later domestic-emphasis scope interpretation. Issue coverage is not issue accuracy. Model scores do not measure rhetorical intensity." : supervised ? "TF-IDF and logistic regression predict foreign-policy relevance and each tradition from target sentences plus uncounted neighboring context. Supported and explicit signals use separately trained tasks; explicit predictions also count as supported. Issues and instruments retain transparent dictionary tags, gated by predicted FP relevance. Model probabilities are uncalibrated and are not measures of rhetorical intensity." : "Sentence-level contextual rules identify foreign-policy relevance, issues, and four independent tradition signals. Supported and explicit thresholds describe rule strengths rather than probabilities."} Original target word counts determine weights.\n\n**Validation.** Independent agents reviewed purposive development examples and informed dictionary refinements. ${contextual ? "Nested episode-grouped development checks select the model procedure. The final 400-case probability audit and 200-case stress audit were coded after the model freeze. Same-family AI agreement and the limited owner-calibrated subset leave shared conceptual bias possible. Unknown labels are retained per task, with assignment-sensitivity scenarios; only the probability component supports design-based corpus-share estimates." : supervised ? "The supervised comparison uses an AI-labelled reference with speech-grouped evaluation and reserved documents. These checks assess agreement with that reference, not an independent human truth set; small and rare categories remain uncertain." : "Agreement is not accuracy, and shared model biases remain possible. No independent human benchmark has established classification accuracy."}\n\n**Interpretation.** This is a descriptive analysis of presidential language, not a measure of enacted foreign policy or evidence that events caused a trend. No confidence bands are manufactured from agent confidence or annual variation. Structural topic modelling is retained as a separate exploratory method rather than equated with the four theoretical traditions.` : `## Data and interpretation\n\n**Why State of the Union messages?** They provide a recurring annual record of how presidents present their priorities to Congress and the public. Usually delivered early in the calendar year, the address reviews the nation’s condition and sets out the administration’s executive and legislative agenda for the year ahead. It brings foreign policy and defense into the same forum as education, healthcare, employment and other domestic concerns. Following the thesis, this repeated setting helps compare the attention given to external affairs and the reasons offered for America’s role abroad across presidents and historical contexts. It captures the president’s public agenda rather than the full range of U.S. foreign-policy activity. [Background: Congressional Research Service](https://www.congress.gov/crs-product/R40132).\n\nThe corpus covers 1946–2026 and retains annual written messages, joint-session addresses and radio summaries as distinct formats. Multiple messages in a year are weighted by their original word counts.\n\nOnly named subjects and categorized examples appear in the issue display. Shares use all model-selected foreign-policy words, so issue categories overlap and do not sum to 100%. The charts describe presidential language; they do not establish that an event caused a change or that attention became enacted policy.\n\nThe public repository contains the current report, its reviewed data, source-linked corpus and the frozen v2 inference model. The benchmark table preserves the published v0/v1 comparison. Reproduction instructions distinguish rebuilding the report and rescoring v2 from private model-development work.`} />
      {documents.some(row => Number(row.year) === 1946) && without1946.documents > 0 && <Prose
        id="format-sensitivity" title="A format sensitivity worth checking" rows={documents}
        value={`### A format sensitivity worth checking\n\nThe 1946 record combines the annual and budget messages. Its length gives it extra weight in a pooled word share. For this selection, overall foreign-policy attention is **${pct(totals.fpShare)} with 1946** and **${pct(without1946.fpShare)} excluding it**. The complete corpus is retained; this comparison shows the consequence of that format difference.`} />}
      <RichNarrative id="sotu:project-method" label="Edit project contribution" value="### From archival text to inspectable measures\n\nThe original thesis supplies the theoretical questions. This extension adds archive reconciliation, stable document and sentence identities, consistent word accounting, evidence-linked annotation, grouped model evaluation and an interactive route back to source passages. Saved inputs, versioned code and frozen-model receipts make the results inspectable. Reproducing a calculation does not establish that every reference interpretation is correct." />
    </section>
  </article></HistoricalEventsContext.Provider>;
}
