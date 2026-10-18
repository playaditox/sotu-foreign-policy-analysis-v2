import React, {useState} from "react";
import {DataComponent, DataTable, Dropdown, EvidenceChart, RichNarrative, useDataApp} from "../../data-app-public.jsx";
import {ReportDisclosure} from "../shared/ReportDisclosure.jsx";

const alignmentLabels = {
  unified_democratic: "Unified Democratic",
  unified_republican: "Unified Republican",
  opposition_both_chambers: "Opposition controls both",
  split_chambers: "Split chambers",
};
const forceLabels = {advocacy: "Force advocacy", conditional: "Conditional force", restraint: "Restraint"};

export function ContextVariables({documents, scopeFilters}) {
  const {queries} = useDataApp();
  const [selectedExample, setSelectedExample] = useState(null);
  const ids = new Set(documents.map(row => row.document_id));
  const allContext = queries.context_variables_v9?.rows ?? [];
  const context = allContext.filter(row => ids.has(row.document_id));
  const congress = (queries.congress_control?.rows ?? []).filter(row => ids.has(row.document_id));
  const definitions = queries.context_variable_definitions_v9?.rows ?? [];
  const forceDefinitions = queries.force_posture_definitions_v9?.rows ?? [];
  const examples = (queries.force_posture_examples_v9?.rows ?? []).filter(row => ids.has(row.document_id));
  const selected = examples.find(row => row.sentence_id === selectedExample)
    ?? examples.find(row => row.all_dimensions_assessed) ?? examples[0];
  const counts = Object.entries(alignmentLabels).map(([alignment, group]) => ({group,
    documents: congress.filter(row => row.government_alignment === alignment).length}));
  const contextRows = context.map(row => ({...row, alignmentLabel: alignmentLabels[row.alignment]}));
  const sourceRowsByQuery = {congress_control: congress, context_variables_v9: context, annual: documents};
  if (!context.length) return <section id="sotu-nav-institutions" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="context-v9:unavailable" value="## 4. Political and historical context\n\nThe dated context layer is unavailable for this selection. No contextual assignments have been substituted." />
  </section>;
  return <section id="sotu-nav-institutions" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="context-v9:introduction" value="## 4. What political and historical context accompanies each address?\n\nPresidential language belongs to a setting: the president and party, international era, external crises, Congress, and the stage of the presidency. Each address now carries those dated fields alongside its format. House and Senate alignment follows the organizing parties on the actual speech date, including outgoing presidents and tied Senates.\n\nThese fields support descriptive comparisons and later, question-specific statistical adjustment. The charts do not already hold them constant. Use of force and restraint is a separate rhetorical dimension, with the calibrated examples below." />
    <div id="sotu-nav-institutional-coverage" className="sotu-section-anchor" tabIndex={-1}>
      <EvidenceChart id="congress-coverage" queryId="congress_control" queryIds={["congress_control", "context_variables_v9", "annual"]}
        title="Messages available in each institutional setting" rows={counts} sourceRowsByQuery={sourceRowsByQuery} scopeFilters={scopeFilters}
        spec={{type:"horizontalBar", x:"group", y:"documents", startAtZero:true, stackable:false,
          colors:{documents:"#477fb6"}, valueDecimals:0}} height={290}
        description="Document counts in the selected corpus and date window. Repeated messages from one president-year remain separate documents in these counts; they are not independent regimes or estimated force effects." />
    </div>
    <div id="sotu-nav-context-timing" className="sotu-section-anchor" tabIndex={-1}>
      <DataComponent id="context-variable-availability" queryId="context_variable_definitions_v9" title="Which contextual variables are available?"
        kind="table" sourceRows={definitions} displayRows={definitions}
        description="Research-design definitions and availability across this release. This fixed reference is not a fitted model or a filter-dependent sample count.">
        <ReportDisclosure id="context-variable-availability:details" label="Read the context variables and their roles">
          <DataTable rows={definitions} searchable={false} label="Context variables and availability" columns={[
            {field:"variable", label:"Variable"}, {field:"status", label:"Availability"}, {field:"use", label:"Definition and use"},
          ]} />
        </ReportDisclosure>
      </DataComponent>
    </div>
    <div id="sotu-nav-institutional-assignments" className="sotu-section-anchor" tabIndex={-1}>
      <DataComponent id="congress-documents" queryId="context_variables_v9" queryIds={["context_variables_v9", "congress_control", "annual"]}
        title="Inspect the dated context of an address" kind="table" displayRows={contextRows} sourceRowsByQuery={sourceRowsByQuery} scopeFilters={scopeFilters}>
        <ReportDisclosure id="congress-documents:details" label="Explore Congress, era, term stage and election timing">
          <p className="sotu-history-caption">Term year follows the January 20 constitutional cycle; months in office start with the actual administration, including succession. An inherited term is not a term won in an election. Election timing uses the regular federal calendar, without inferring candidacy or electoral results. The source rows also retain the bounded campaign-date context.</p>
          <DataTable rows={contextRows} rowKey="document_id" label="Dated political and historical context" columns={[
            {field:"date", label:"Speech date"}, {field:"president", label:"President"}, {field:"party", label:"Party"},
            {field:"house_party", label:"House"}, {field:"senate_party", label:"Senate"},
            {field:"alignmentLabel", label:"Alignment"}, {field:"era", label:"Era"},
            {field:"term_year", label:"Term year"}, {field:"administration_months", label:"Months in office"},
            {field:"election_year_type", label:"Election cycle"},
            {field:"next_regular_federal_election", label:"Next regular election"},
            {field:"days_to_next_regular_election", label:"Days to election"},
          ]} />
        </ReportDisclosure>
      </DataComponent>
    </div>
    <div id="sotu-nav-force-posture" className="sotu-question sotu-section-anchor" tabIndex={-1}>
      <RichNarrative id="force-posture-v9:explanation" value="### Use of force and restraint\n\nForce advocacy, conditional force and restraint can coexist. They describe a military position; the four traditions describe the justification offered for policy. A Wilsonian argument can support intervention, and national-priority language can support selective engagement or withdrawal.\n\nFor the party–Congress hypothesis, force posture is the **outcome**. For tradition analysis, it can support comparisons among passages taking a similar position, once validated. Conditioning on it changes the question; it is not automatically a causal correction.\n\nThe force measure is under calibration, so corpus-wide force scores and adjusted effects are not reported. These source-linked examples implement the owner’s distinctions. They are illustrations, not frequency or accuracy estimates." />
      <DataComponent id="force-posture-codebook-v9" queryId="force_posture_definitions_v9" kind="table" title="How force positions are distinguished"
        sourceRows={forceDefinitions} displayRows={forceDefinitions}>
        <ReportDisclosure id="force-posture-codebook-v9:details" label="Read advocacy, conditionality, restraint and uncertainty rules">
          <DataTable rows={forceDefinitions} searchable={false} label="Force-posture coding definitions" columns={[
            {field:"label", label:"Position"}, {field:"meaning", label:"Evidence required"}, {field:"boundary", label:"Boundary"},
          ]} />
        </ReportDisclosure>
      </DataComponent>
      <DataComponent id="force-posture-examples-v9" queryId="force_posture_examples_v9" title="Read a calibrated force position in context" kind="custom"
        sourceRows={selected ? [selected] : []} displayRows={selected ? [selected] : []} scopeFilters={scopeFilters}
        description="Two source-linked, owner-calibrated development illustrations. Only cases in the selected corpus and date window appear. Partial positive judgments do not create negative labels for unassessed dimensions; these are not corpus predictions."
        headerControls={selected ? <Dropdown label="Calibrated example" showLabel value={selected.sentence_id}
          choices={examples.map(row => row.sentence_id)} onChange={setSelectedExample}
          choiceLabels={Object.fromEntries(examples.map(row => [row.sentence_id, `${row.date.slice(0,4)} · ${row.president}`]))} /> : null}>
        {selected ? <div data-reviewed-rows>
          <p className="sotu-history-caption">{selected.date} · {selected.president}</p>
          <p><strong>Before:</strong> {selected.context_before}</p>
          <blockquote className="sotu-passage-quote">{selected.target}</blockquote>
          <p><strong>After:</strong> {selected.context_after}</p>
          <p><strong>Owner calibration:</strong> {selected.owner_decision}.</p>
          <p>{selected.explanation}</p>
          <ReportDisclosure id="force-posture-examples-v9:evidence" label="Inspect the evidence for each dimension">
            {Object.entries(forceLabels).map(([key, label]) => <div key={key}>
              <p><strong>{label}:</strong> {selected.labels[key] === null ? "Not separately assessed" : selected.labels[key] ? "Supported" : "Not assigned in this owner decision"}</p>
              {(selected.evidence[key] ?? []).map((span, index) => <p key={index}><strong>{span.location === "target" ? "Target wording" : "Surrounding argument"}:</strong> “{span.text}”</p>)}
            </div>)}
          </ReportDisclosure>
          <a href={selected.source_url} target="_blank" rel="noreferrer">Read the original address ↗</a>
        </div> : <p className="sotu-empty">No owner-calibrated force example falls in this corpus and date window. The coding definitions remain available.</p>}
      </DataComponent>
      <RichNarrative id="force-posture-v9:next-checks" value="**Planned comparison:** examine force advocacy, conditionality and restraint across presidential party and congressional alignment, with historical context and within-president changes where the data support them. No stated position is not dovishness; unresolved labels remain missing. [Read the context-variable design and validation requirements](https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/context_variables.md)." />
    </div>
  </section>;
}
