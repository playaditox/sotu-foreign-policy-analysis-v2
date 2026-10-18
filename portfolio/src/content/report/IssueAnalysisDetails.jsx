import React, { useState } from "react";
import { DataComponent, DataTable, Dropdown, EvidenceChart, RichNarrative } from "../../data-app-public.jsx";
import { ReportDisclosure } from "../shared/ReportDisclosure.jsx";
import { HistoricalTrend } from "./HistoricalTrend.jsx";
import { humanize, pct, pooled } from "./sotu-data.js";

const methods = { latest: "Expanded and guarded issue rules", expanded_target: "Earlier expansion · sentence only", original: "Original issue dictionary" };
const shortLabels = { global_security:"Security",trade_finance_energy:"Trade & energy",diplomacy_institutions:"Diplomacy",rights_development_global_challenges:"Global issues",strategy_role_public_diplomacy:"U.S. role",international_outlook:"World politics",security_conflict:"Security",nuclear_arms:"Arms control",trade_economy:"Trade/finance",alliances_diplomacy:"Diplomacy",aid_development:"Foreign aid",rights_democracy:"Rights",international_governance:"Institutions",climate_environment:"Climate",global_health:"Global health",migration_transnational:"Migration/crime",intelligence_cyber:"Intelligence",territorial_sovereignty:"Sovereignty",energy_resources:"Energy",global_role_commitments:"U.S. role",foreign_policy_governance:"FP authority",science_technology_cooperation:"Science ties",public_diplomacy:"Public diplomacy",international_political_conditions:"World politics" };
const fineLabels = { aid_development:"Foreign aid and development", security_conflict:"Security and conflict", trade_economy:"International trade and finance", rights_democracy:"Rights and democracy", alliances_diplomacy:"Alliances and diplomacy", migration_transnational:"Migration and transnational crime", nuclear_arms: "Nuclear weapons and arms control", public_diplomacy: "Public diplomacy and cultural exchange", global_role_commitments: "America’s global role and commitments", foreign_policy_governance: "Conduct of foreign policy", international_political_conditions: "International political conditions" };
const label = key => fineLabels[key] ?? humanize(key);

export function IssueAnalysisDetails({ documents, originalIssues, events, queries, scopeFilters }) {
  const [level, setLevel] = useState("families");
  const [method, setMethod] = useState("latest");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedExample, setSelectedExample] = useState(null);
  const [exampleIssue, setExampleIssue] = useState(null);
  const ids = new Set(documents.map(row => row.document_id));
  const fp = pooled(documents).fp_words;
  const broad = level === "families" && method === "latest";
  const queryId = method === "original" ? "issues" : method === "expanded_target" ? "issues_expanded" : broad ? "issue_families_public_v4" : "issue_scores_public_v4";
  const issues = (method === "original" ? originalIssues : queries[queryId].rows.filter(row => ids.has(row.document_id)))
    .filter(row => row.issue !== "international_affairs_unspecified" && (method !== "expanded_target" || row.coding === "expanded_target"));
  const labels = Object.fromEntries(issues.map(row => [row.issue, broad ? (row.label ?? label(row.issue)) : label(row.issue)]));
  const totals = new Map();
  issues.forEach(row => totals.set(row.issue,(totals.get(row.issue) ?? 0)+Number(row.words)));
  const issueRows = [...totals].map(([key,words])=>({ issue:shortLabels[key] ?? labels[key] ?? label(key),subject:labels[key] ?? label(key),words,issueShare:fp ? words/fp : null })).sort((a,b)=>b.words-a.words);
  const choices = [...new Set(issues.map(row => row.issue))].sort();
  const active = choices.includes(selectedIssue) ? selectedIssue : choices.includes("global_security") ? "global_security" : choices[0];
  const evidence = issues.filter(row => row.issue === active);
  const words = new Map(evidence.map(row => [row.document_id, Number(row.words)]));
  const history = [...documents].sort((a,b) => a.date.localeCompare(b.date)).map(row => ({ date:row.date, president:row.president, document_id:row.document_id,
    issueShare:row.fp_words ? (words.get(row.document_id) ?? 0)/row.fp_words : null }));
  const availableExamples = (queries.issue_examples_public_v4?.rows ?? []).filter(row=>ids.has(row.document_id));
  const exampleChoices = [...new Set(availableExamples.flatMap(row=>row.issues))].sort();
  const activeExampleIssue = exampleChoices.includes(exampleIssue) ? exampleIssue : exampleChoices[0];
  const examples = availableExamples.filter(row=>row.issues.includes(activeExampleIssue));
  const example = examples.find(row=>row.sentence_id===selectedExample) ?? examples[0];
  const localScope = [...scopeFilters,{ field:"issue_method",label:"Issue rules",value:methods[method] },{ field:"issue_level",label:"Topic level",value:broad ? "Broad families" : "Specific issues" }];
  return <section id="sotu-nav-issues" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="issue-explainer:body" value="## 2. Which foreign-policy subjects receive attention?\n\nExplore foreign strategy, global security, international trade, diplomacy and shared challenges. Broad categories collect related issues; specific tags give a closer view. A sentence can address several subjects, so shares overlap.\n\n**The scope is direct international policy and affairs.** Domestic programs stay domestic when their international connection is only indirect. The charts display named issue matches and retain all model-selected foreign-policy words in their denominator. References to the world, regions, continents and seas supply geographic context; they do not automatically identify a specific issue. " />
    <div className="sotu-control-group"><Dropdown label="Topic detail" showLabel value={broad ? "families" : "specific"}
      choices={["families","specific"]} choiceLabels={{ families:"Broad foreign-policy categories",specific:"Specific issues" }}
      onChange={value => { setLevel(value);setMethod("latest");setSelectedIssue(null); }} /></div>
    {method !== "latest" && <p className="sotu-history-caption">Comparison view: {methods[method]}. Return to the latest rules in the method comparison below.</p>}
    <div id="sotu-nav-issue-mix" className="sotu-section-anchor" tabIndex={-1}><EvidenceChart id="issue-mix" queryId={queryId} queryIds={[queryId,"annual"]} title={broad ? "Foreign-policy subjects across the selected window" : "Specific issues across the selected window"}
      spec={{ type:"horizontalBar",x:"issue",y:"issueShare",startAtZero:true,stackable:false,xLabel:"",yLabel:"Share of all model-selected FP words",colors:{issueShare:"#477fb6"},valueDecimals:1 }}
      rows={issueRows} sourceRowsByQuery={{ [queryId]:issues,annual:documents }} scopeFilters={localScope} height={Math.max(340,issueRows.length*40)}
      description="Overlapping tagged sentence words / all words admitted by the frozen v2 foreign-policy gate. Only named issues are displayed. Geographic references and unfinished assignments are excluded from the subject display while their words remain in the FP denominator. The shares therefore overlap and do not form an exhaustive partition." /></div>
    <DataComponent id="issue-category-key" queryId={queryId} title="What the subject labels include" sourceRows={issues} displayRows={issueRows} scopeFilters={localScope} kind="table">
      <ReportDisclosure id="issue-category-definitions" label="Read category names and exact shares">
        <DataTable rows={issueRows.map(row=>({...row,share:pct(row.issueShare)}))} label="Subject definitions and shares" columns={[{field:"issue",label:"Chart label"},{field:"subject",label:"Full category"},{field:"share",label:"Share",align:"right"}]} />
      </ReportDisclosure>
    </DataComponent>
    {choices.length > 0 && <div id="sotu-nav-issue-timeline" className="sotu-section-anchor" tabIndex={-1}><HistoricalTrend id="issue-trend" queryId={queryId} queryIds={[queryId,"annual"]} events={events} title="Follow a subject through time"
      rows={history} sourceRowsByQuery={{ [queryId]:evidence,annual:documents }} scopeFilters={localScope}
      spec={{ type:"line",x:"date",y:"issueShare",startAtZero:true,stackable:false,xLabel:"Address date",yLabel:"Share of model-selected FP words",colors:{issueShare:"#477fb6"},valueDecimals:1 }} height={340}
      headerControls={<Dropdown label="Subject" showLabel value={active} choices={choices} choiceLabels={labels} onChange={setSelectedIssue} />}
      description="Tagged sentence words / frozen FP words at the actual address date. The Show historical events switch controls all event dates and approximate durations together. Context does not establish a causal event effect." /></div>}
    {example && <div id="sotu-nav-issue-examples" className="sotu-section-anchor" tabIndex={-1}><DataComponent id="issue-categorized-examples" queryId="issue_examples_public_v4" title="Examples of categorized foreign-policy passages"
      sourceRows={examples} displayRows={[example]} scopeFilters={scopeFilters} kind="custom"
      headerControls={<Dropdown label="Issue" showLabel value={activeExampleIssue} choices={exampleChoices}
        choiceLabels={Object.fromEntries(exampleChoices.map(key=>[key,label(key)]))} onChange={value=>{setExampleIssue(value);setSelectedExample(null);}} />}
      description="Illustrative passages with a named issue shared by both contextual reviews, retained under direct FP scope, and supported by sentence-wording rules. These are development examples rather than a representative accuracy sample.">
      <Dropdown label="Passage" showLabel value={example.sentence_id} choices={examples.map(row=>row.sentence_id)} onChange={setSelectedExample}
        choiceLabels={Object.fromEntries(examples.map(row=>[row.sentence_id,`${row.date.slice(0,4)} · ${row.president} · ${row.text.slice(0,65)}…`]))} />
      <div className="sotu-issue-example" data-reviewed-rows>
        <p><strong>Subjects:</strong> {example.issues.map(label).join("; ")}</p>
        <p className="sotu-context">Before: {example.context_before || "No preceding context supplied."}</p>
        <blockquote>{example.text}</blockquote>
        <p className="sotu-context">After: {example.context_after || "No following context supplied."}</p>
        <p>{example.date} · {example.president}</p>
        <a href={example.source_url} target="_blank" rel="noreferrer">Read the original address ↗</a>
      </div>
    </DataComponent></div>}
    <div id="sotu-nav-issue-dictionaries" className="sotu-section-anchor" tabIndex={-1}><DataComponent id="issue-method-comparison" queryId={queryId} title="Compare issue dictionaries" kind="custom" sourceRows={issues} displayRows={issueRows} scopeFilters={localScope}
      description="The latest public view uses direct named-issue matches; prior methods retain their original rules. No unclassified review queues are presented as findings. The denominator remains all model-selected FP words.">
      <ReportDisclosure id="issue-dictionary-methods" label="Compare the current and earlier issue rules">
        <Dropdown label="Issue rules used in the charts" showLabel value={method} choices={Object.keys(methods)} choiceLabels={methods}
          onChange={value=>{setMethod(value);setSelectedIssue(null);}} />
        <p className="sotu-history-caption">The current dictionary adds international finance, public diplomacy, U.S. commitments and military capacity. Only named categories appear. Shares retain all model-selected foreign-policy words and can overlap.</p>
        <a href="https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/issues.md" target="_blank" rel="noreferrer">Read the definitions and measurement audit ↗</a>
      </ReportDisclosure>
    </DataComponent></div>
  </section>;
}
