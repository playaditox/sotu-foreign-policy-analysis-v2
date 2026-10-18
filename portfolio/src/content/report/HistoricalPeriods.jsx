import React, {useState} from "react";
import {DataComponent,DataTable,Dropdown,EvidenceChart,RichNarrative} from "../../data-app-public.jsx";
import {ReportDisclosure} from "../shared/ReportDisclosure.jsx";
import {aggregate,pooled,pct} from "./sotu-data.js";
import {CrisisComposition,CrisisSensitivity,CrisisComparisonSupport} from "./CrisisAttention.jsx";
import {matchCrisisAttention,presidentPerson} from "./crisis-attention.js";

export function HistoricalPeriods({documents,queries,scopeFilters}) {
  const [weight,setWeight]=useState("president_year");
  const [boundary,setBoundary]=useState("preponderance_split_2001");
  const schemes=(queries.v2_era_schemes?.rows??[]).filter(row=>["preponderance_split_2001","preponderance_split_2003"].includes(row.id));
  const scheme=schemes.find(row=>row.id===boundary)??schemes[0];
  if(!scheme) return null;
  const rows=scheme.periods.map(period=>{
    const members=documents.filter(row=>row.date>=period.start_date&&(!period.end_date_exclusive||row.date<period.end_date_exclusive));
    const grouped=aggregate(members,row=>`${presidentPerson(row.president)}:${row.year}`);
    const pooledShare=pooled(members).fpShare;
    const known=grouped.map(row=>row.fpShare).filter(value=>value!=null);
    return {period:period.chart_label??period.label,label:period.label,
      fpShare:weight==="words"?pooledShare:known.length?known.reduce((sum,value)=>sum+value,0)/known.length:null,
      documents:members.length,years:new Set(members.map(row=>row.year)).size,
      presidents:new Set(members.map(row=>presidentPerson(row.president))).size,
      first:members.map(row=>row.date).sort()[0],last:members.map(row=>row.date).sort().at(-1)};
  }).filter(row=>row.documents>0);
  const ranked=rows.filter(row=>row.fpShare!=null).sort((a,b)=>b.fpShare-a.fpShare);
  const scope=[...scopeFilters,{field:"period_boundary",label:"Historical grouping",value:scheme.label},
    {field:"era_weighting",label:"Weighting",value:weight==="words"?"Pool original words":"Each president-year equally"}];
  const crisis=matchCrisisAttention(documents,queries.crisis_attention_v8?.rows);
  return <section id="sotu-nav-historical-periods" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="historical-periods-v4:explanation" value="## How does attention differ across historical periods?\n\nThe main comparison follows four periods: **Cold War**, **post-Cold War U.S. leadership**, **U.S. preponderance under strain**, and **contested U.S. primacy**. The middle two separate the 1990s from the post-9/11 period and the disputes over the 2003 Iraq invasion. U.S. preponderance means a large advantage in global capabilities and influence; primacy means a leading international position. These labels describe changing leadership conditions within that advantage; they do not imply that the distribution of world power changed overnight.\n\nThe default split is September 11, 2001, followed by the September 2008 financial crisis. With the corpus’s actual speech dates, these groups contain 1946–1991, 1992–2001, 2002–2008 and 2009–2026 messages. The under-strain period contains only George W. Bush speeches, so the pattern also reflects that presidency." />
    <div className="sotu-era-weighting">
      <Dropdown label="Comparison weighting" showLabel value={weight} choices={["words","president_year"]}
        choiceLabels={{words:"Pool original words",president_year:"Each president-year equally"}} onChange={setWeight} />
      <p className="sotu-history-caption">Applies to both charts and the sensitivity comparison. All shares use all speech words as their denominator.</p>
    </div>
    <div className="sotu-era-comparison-grid">
    <div id="sotu-nav-period-comparison" className="sotu-section-anchor" tabIndex={-1}><EvidenceChart id="historical-periods-attention-v4" queryId="annual" queryIds={["annual","v2_era_schemes"]}
      title="Foreign-policy attention across historical periods" rows={rows}
      sourceRowsByQuery={{annual:documents,v2_era_schemes:[scheme]}} scopeFilters={scope}
      height={350} spec={{type:"horizontalBar",x:"period",y:"fpShare",startAtZero:true,stackable:false,
        xLabel:"",yLabel:"Share of all speech words",colors:{fpShare:"#477fb6"},valueDecimals:1}}
      description="Descriptive shares in the selected corpus and date window. Word pooling uses FP sentence words / all speech words. Equal president-year weighting first pools multiple documents within each president-year, then averages those shares. No causal system, party or president effect is identified." /></div>
      <CrisisComposition measurement={crisis} documents={documents} scheme={scheme} weight={weight} scope={scope} />
    </div>
    <div id="sotu-nav-period-boundaries" className="sotu-section-anchor" tabIndex={-1}><DataComponent id="historical-periods-detail-v4" queryId="annual" queryIds={["annual","v2_era_schemes"]}
      title="Check period boundaries and composition" kind="custom" displayRows={rows}
      sourceRowsByQuery={{annual:documents,v2_era_schemes:[scheme]}} scopeFilters={scope}>
      {ranked.length>1 && <p data-reviewed-rows>In this view, <strong>{ranked[0].label}</strong> has the largest foreign-policy attention share, <strong>{pct(ranked[0].fpShare)}</strong>, compared with <strong>{pct(ranked.at(-1).fpShare)}</strong> for {ranked.at(-1).label}. These are descriptive differences under the selected text measure and weighting.</p>}
      <ReportDisclosure id="historical-periods-v4:details" label="Compare a 2003 split and inspect the period counts">
        <Dropdown label="Preponderance split" showLabel value={scheme.id} choices={schemes.map(row=>row.id)}
          choiceLabels={{preponderance_split_2001:"September 11, 2001 (main)",preponderance_split_2003:"March 20, 2003: Iraq invasion"}} onChange={setBoundary} />
        <p>The alternative boundary places the January 2003 address before the invasion. These groupings are the project’s historical interpretation; the source dates govern membership.</p>
        <DataTable rows={rows} label="Historical period composition" searchable={false} columns={[
          {field:"label",label:"Period"},{field:"first",label:"First speech"},{field:"last",label:"Last speech"},
          {field:"documents",label:"Documents"},{field:"years",label:"Years"},{field:"presidents",label:"Presidents"},
          {field:"fpShare",label:"FP attention",presentation:"percent"}]} />
      </ReportDisclosure>
    </DataComponent></div>
    <CrisisSensitivity measurement={crisis} documents={documents} scheme={scheme} weight={weight} scope={scope} />
    <CrisisComparisonSupport measurement={crisis} documents={documents} scheme={scheme} scope={scope} eventRows={queries.events?.rows} />
  </section>;
}
