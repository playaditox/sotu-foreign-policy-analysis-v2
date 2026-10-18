import React from "react";
import "./report-contents.css";

export function ReportContents({ contextual, hasIssueExamples, hasTraditionExamples, has1946 }) {
  const sections = [
    { label:"Executive summary", target:"executive-summary" },
    { label:"Data pipeline and research design", target:"research-design" },
    { label:"1. How much attention does foreign policy receive?", target:"attention-explainer",
      children:[["Timeline & historical events","attention-timeline"]] },
    { label:"2. Which foreign-policy subjects receive attention?", target:"issues",
      children:[["Subject mix","issue-mix"],["Subject timeline","issue-timeline"],
        ...(hasIssueExamples ? [["Passage examples","issue-examples"]] : []),
        ...(contextual ? [["Dictionary comparison","issue-dictionaries"]] : [])] },
    { label:"3. What reasons do presidents give for foreign policy?", target:"traditions",
      children:[["Four-tradition timeline","tradition-timeline"],
        ...(hasTraditionExamples ? [["Traditions in context","tradition-examples"]] : [])] },
    { label:"Presidents and parties", target:"comparison-explainer",
      children:[["Administration comparison","administrations"]] },
    { label:"Historical periods", target:"historical-periods",
      children:[["Period comparison","period-comparison"],["Boundaries & composition","period-boundaries"]] },
    { label:"4. Political and historical context", target:"institutions",
      children:[["Congress alignment","institutional-coverage"],["Context variables and timing","context-timing"],["Use of force and restraint","force-posture"]] },
    { label:"How the text is measured", target:"methods",
      children:[["Corpus formats","corpus-formats"],["Reserved-reference comparison","reserved-comparison"],["Released models and future work","model-status"]] },
    { label:"Data and interpretation", target:"methods-and-limits",
      children:has1946 ? [["Format sensitivity","format-sensitivity"]] : [] },
  ];
  const navigate = (event, target) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = document.getElementById(`sotu-nav-${target}`);
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    window.history.pushState(window.history.state, "", `#sotu-nav-${target}`);
    element.scrollIntoView({ behavior: "instant", block: "start" });
    element.focus({ preventScroll: true });
  };
  return <details className="sotu-contents" open>
    <summary>Contents</summary>
    <nav aria-label="Report contents">
      <ul className="sotu-contents-sections">{sections.map(section => <li key={section.target}>
        <a className="sotu-contents-section" href={`#sotu-nav-${section.target}`} onClick={event => navigate(event, section.target)}>{section.label}</a>
        {section.children?.length>0 && <ul className="sotu-contents-subsections">
          {section.children.map(([label,target]) => <li key={target}><a href={`#sotu-nav-${target}`} onClick={event => navigate(event, target)}>{label}</a></li>)}
        </ul>}
      </li>)}</ul>
    </nav>
  </details>;
}
