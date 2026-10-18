import React, { useState } from "react";
import { DataComponent, Dropdown, EvidenceChart, RichNarrative } from "../../data-app-public.jsx";
import { ReportDisclosure } from "../shared/ReportDisclosure.jsx";
import { HistoricalTrend } from "./HistoricalTrend.jsx";
import { traditions, pooled, administrationRows, aggregate } from "./sotu-data.js";

function TraditionIntroduction() {
  return <RichNarrative id="contextual-traditions-v4:explanation" value="## 3. What reasons do presidents give for foreign policy?\n\nThe four traditions describe recurring arguments: shared rights and rules (**Wilsonian**), commercial prosperity and strategic order (**Hamiltonian**), priority to the national community (**Jacksonian**), and limits on foreign commitments (**Jeffersonian**). These are approximate analytical correspondences. A president can combine several reasons, and the same tradition can support different policy instruments.\n\nRead each statement as part of its dated argument. The examples below retain the surrounding passage and two independent contextual interpretations. They illustrate the framework; their selection does not measure how common a tradition was." />;
}

export function ContextualTraditions({documents,queries,events,scopeFilters,quantitative=false,trend=null}) {
  const [tradition,setTradition]=useState("jacksonian");
  const [selected,setSelected]=useState(null);
  const [eraWeight,setEraWeight]=useState("words");
  const ids=new Set(documents.map(row=>row.document_id));
  const allExamples=(queries.contextual_examples_v4?.rows??[]).filter(row=>ids.has(row.document_id));
  const available=traditions.filter(item=>allExamples.some(row=>row.traditions.includes(item.key)));
  if (!available.length) return trend ? <section id="sotu-nav-traditions" className="sotu-question sotu-section-anchor" tabIndex={-1}><TraditionIntroduction />{trend}</section> : null;
  const active=available.find(item=>item.key===tradition)??available[0];
  const profile=(queries.tradition_profiles_v3?.rows??[]).find(row=>row.tradition===active.label);
  const examples=allExamples.filter(row=>row.traditions.includes(active.key)).sort((a,b)=>
    Number((b.default_for??[]).includes(active.key))-Number((a.default_for??[]).includes(active.key)) ||
    Number((b.explicit_traditions??[]).includes(active.key))-Number((a.explicit_traditions??[]).includes(active.key)) || a.date.localeCompare(b.date));
  const example=examples.find(row=>row.sentence_id===selected)??examples[0];
  const citedRefs=new Set([...(example.evidence_a[active.key]?.context_refs??[]),...(example.evidence_b[active.key]?.context_refs??[])]);
  const suppliedParagraphs=example.source_section??[];
  const citedParagraphs=suppliedParagraphs.filter(row=>citedRefs.has(row.context_ref)||row.is_target_paragraph);
  const citedHistory=(example.history_facts??[]).filter(fact=>citedRefs.has(fact.context_ref));
  const ready=new Set((queries.contextual_readiness_v4?.rows??[]).filter(row=>row.public_inference_ready).map(row=>row.task));
  const series=traditions.filter(item=>ready.has(`${item.key}_supported`));
  const fields=series.map(item=>`${item.label}Share`);
  const colors=Object.fromEntries(series.map(item=>[`${item.label}Share`,item.color]));
  const history=[...documents].sort((a,b)=>a.date.localeCompare(b.date)).map(row=>({...row,...pooled([row])}));
  const parties=aggregate(documents,"party").map(({members,...row})=>({...row,party:row.group}));
  const administrations=administrationRows(documents);
  const scheme=(queries.v2_era_schemes?.rows??[]).find(row=>row.id==="preponderance_split_2001");
  const eras=(scheme?.periods??[]).map(period=>{
    const members=documents.filter(row=>row.date>=period.start_date&&(!period.end_date_exclusive||row.date<period.end_date_exclusive));
    const points=aggregate(members,row=>`${row.president}:${row.year}`);
    const values=pooled(members);
    if(eraWeight==="president_year") for(const field of fields){
      const known=points.map(row=>row[field]).filter(value=>value!=null);
      values[field]=known.length?known.reduce((sum,value)=>sum+value,0)/known.length:null;
    }
    return {era:period.chart_label??period.label,...values,documents:members.length,presidents:new Set(members.map(row=>row.president)).size};
  }).filter(row=>row.documents>0);
  return <section id="sotu-nav-traditions" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <TraditionIntroduction />
    {trend}
    <div id="sotu-nav-tradition-examples" className="sotu-section-anchor" tabIndex={-1}><DataComponent id="contextual-tradition-examples-v4" queryId="contextual_examples_v4" title="Read a tradition in context" kind="custom"
      queryIds={["contextual_examples_v4","tradition_profiles_v3"]}
      sourceRowsByQuery={{contextual_examples_v4:examples,tradition_profiles_v3:profile?[profile]:[]}} displayRows={[example]} scopeFilters={scopeFilters}
      headerControls={<Dropdown label="Tradition" showLabel value={active.key} choices={available.map(item=>item.key)}
        choiceLabels={Object.fromEntries(available.map(item=>[item.key,item.label]))} onChange={value=>{setTradition(value);setSelected(null);}} />}
      description="Illustrative paired development labels, separate from corpus-wide model predictions. Both reviewers assign the displayed tradition, with exact target evidence and identified context. Agreement is AI-assisted rather than independent human validation.">
      <Dropdown label="Passage" showLabel value={example.sentence_id} choices={examples.map(row=>row.sentence_id)}
        choiceLabels={Object.fromEntries(examples.map(row=>[row.sentence_id,`${row.year} · ${row.president} · ${row.target_text.slice(0,58)}…`]))} onChange={setSelected} />
      <div data-reviewed-rows>
        {profile && <div className="sotu-contextual-profile">
          <p><strong>Narrative goal:</strong> {profile.goal}</p>
          <p><strong>Recurring themes:</strong> {profile.themes}</p>
          <p><strong>Decision boundary:</strong> {profile.boundary}</p>
        </div>}
        <p>{example.date} · {example.president}</p>
        <p className="sotu-history-caption">{(example.explicit_traditions??[]).includes(active.key)?"Both reviewers identify the rationale directly in the target statement.":"The supported rationale is read through the surrounding argument; inspect the context below."}</p>
        <blockquote className="sotu-passage-quote">“{example.target_text}”</blockquote>
        <p><strong>Why {active.label}:</strong> {example.evidence_a[active.key]?.reason}</p>
        <p className="sotu-history-caption">{example.traditions.some(key=>key!==active.key)?`Other illustrated reasons: ${example.traditions.filter(key=>key!==active.key).map(key=>traditions.find(item=>item.key===key)?.label).join(", ")}`:"This example illustrates one reason; the traditions can overlap."}</p>
        {(example.context_required_for??[]).includes(active.key) && <div className="sotu-context">
          <p><strong>Source context for this reading:</strong></p>
          {citedParagraphs.length>0?citedParagraphs.map(row=><p key={row.context_ref}><strong>{row.is_target_paragraph?"Target paragraph:":"Surrounding paragraph:"}</strong> {row.text}</p>):<>
            <p><strong>Before:</strong> {example.context_before || "No preceding passage."}</p>
            <p><strong>After:</strong> {example.context_after || "No following passage."}</p>
          </>}
        </div>}
        <ReportDisclosure id="contextual-tradition-examples-v4:argument" label="Read the surrounding argument and second interpretation">
          {suppliedParagraphs.length>0?suppliedParagraphs.map(row=><p key={row.context_ref}><strong>{row.is_target_paragraph?"Target paragraph:":"Surrounding paragraph:"}</strong> {row.text}</p>):<>
            <p><strong>Before:</strong> {example.context_before || "No preceding passage."}</p>
            <p><strong>After:</strong> {example.context_after || "No following passage."}</p>
          </>}
          <p><strong>Second interpretation:</strong> {example.evidence_b[active.key]?.reason}</p>
          {citedHistory.length>0 && <p><strong>Historical context cited for this reading:</strong> {citedHistory.map(fact=>fact.text.split("; status at address:")[0]).join("; ")}</p>}
        </ReportDisclosure>
        <a href={example.source_url} target="_blank" rel="noreferrer">Read the original address ↗</a>
      </div>
    </DataComponent></div>
    <a href="https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/traditions.md" target="_blank" rel="noreferrer">Read the literature, definitions and contextual coding rules ↗</a>
    {quantitative && series.length>0 && <>
      <RichNarrative id="contextual-traditions-v4:measurement" value={`The successor’s ${series.map(item=>item.label).join(", ")} ${series.length===1?"measure passed":"measures passed"} the reserved AI-assisted reference checks. Each chart share counts words in foreign-policy sentences carrying that reason. Reasons overlap, so the shares can exceed 100% when added. These are rhetorical patterns, rather than a ranking of presidents or a measure of willingness to fight.`} />
      <HistoricalTrend id="contextual-tradition-trend-v4" queryId="annual" title="Tradition patterns through time" events={events}
        rows={history} sourceRows={documents} scopeFilters={scopeFilters} height={360}
        spec={{type:"line",x:"date",y:fields[0],fields,colors,startAtZero:true,stackable:false,xLabel:"Address date",yLabel:"Share of foreign-policy words",valueDecimals:1,
          legend:{labels:Object.fromEntries(series.map(item=>[`${item.label}Share`,item.label]))}}}
        description="Only supported-tradition tasks passing the frozen development and reserved-reference gates are plotted. Original target words supply the weights; context adds no denominator words. Historical proximity is not a causal estimate." />
      <EvidenceChart id="contextual-traditions-president-v4" queryId="annual" title="Reasons across administrations" rows={administrations} sourceRows={documents} scopeFilters={scopeFilters}
        height={Math.max(530,administrations.length*(series.length*16+18))}
        spec={{type:"horizontalBar",x:"displayLabel",y:fields[0],fields,colors,startAtZero:true,stackable:false,valueDecimals:1,xLabel:"",yLabel:"Share of foreign-policy words",
          legend:{labels:Object.fromEntries(series.map(item=>[`${item.label}Share`,item.label]))}}}
        description="Word-pooled descriptive shares, by administration. Party and presidential identity are joined after prediction and never supply reference labels. These reasons are not hawkishness or dovishness." />
      <EvidenceChart id="contextual-traditions-party-v4" queryId="annual" title="Reasons by presidential party" rows={parties} sourceRows={documents} scopeFilters={scopeFilters} height={Math.max(280,series.length*70)}
        spec={{type:"horizontalBar",x:"party",y:fields[0],fields,colors,startAtZero:true,stackable:false,valueDecimals:1,xLabel:"",yLabel:"Share of foreign-policy words",
          legend:{labels:Object.fromEntries(series.map(item=>[`${item.label}Share`,item.label]))}}}
        description="Observed word-weighted corpus differences under the selected measure. Party groups contain different presidents, eras and conflicts. Similarity or difference here does not identify a causal party effect or a willingness-to-fight contrast." />
      {eras.length>0 && <>
        <RichNarrative id="contextual-eras-v4:explanation" value="### Compare historical periods\n\nThe main lens separates **Cold War (1946–1991 messages)**, **post-Cold War leadership (1992–2001)**, **U.S. preponderance under strain (2002–2008)**, and **contested U.S. primacy (2009–2026)**. The internal preponderance split follows 9/11; the later boundary follows the 2008 crisis. These are the project’s interpretive historical groupings. The under-strain period contains only George W. Bush speeches, so its pattern also reflects that presidency." />
        <EvidenceChart id="contextual-traditions-eras-v4" queryId="annual" queryIds={["annual","v2_era_schemes"]} title="Reasons across historical periods" rows={eras}
          sourceRowsByQuery={{annual:documents,v2_era_schemes:[scheme]}} scopeFilters={[...scopeFilters,{field:"era_weighting",label:"Weighting",value:eraWeight}]} height={Math.max(370,eras.length*(series.length*18+25))}
          headerControls={<Dropdown label="Weighting" showLabel value={eraWeight} choices={["words","president_year"]}
            choiceLabels={{words:"Pool original words",president_year:"Each president-year equally"}} onChange={setEraWeight} />}
          spec={{type:"horizontalBar",x:"era",y:fields[0],fields,colors,startAtZero:true,stackable:false,valueDecimals:1,xLabel:"",yLabel:"Share of foreign-policy words",
            legend:{labels:Object.fromEntries(series.map(item=>[`${item.label}Share`,item.label]))}}}
          description="Actual speech dates determine membership. Word pooling gives longer passages greater weight; the alternative first pools each president-year then averages its share. The census comparison does not identify a causal change in the international system." />
      </>}
    </>}
  </section>;
}
