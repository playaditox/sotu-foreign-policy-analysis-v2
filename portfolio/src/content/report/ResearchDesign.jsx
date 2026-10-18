import React from "react";
import { RichNarrative } from "../../data-app-public.jsx";
import { ReportDisclosure } from "../shared/ReportDisclosure.jsx";

export function ResearchDesign() {
  return <section id="sotu-nav-research-design" className="sotu-question sotu-section-anchor" tabIndex={-1}>
    <RichNarrative id="research-design:summary" value="## From speeches to measures\n\nThe workflow connects source collection, corpus checks, contextual annotation, model evaluation and word-weighted reporting. The charts describe presidential language. The planned party–Congress–force hypothesis is separate from the descriptive findings." />
    <ReportDisclosure id="research-design:details" label="Read the pipeline, research questions and planned controls">
    <RichNarrative id="research-design:pipeline" value={`### Collection and measurement

The data work connects archival collection, reconciliation, annotation, model evaluation and reproducible reporting. **Corpus** means the collection of texts being analysed; here it includes spoken addresses, written annual messages and separately identified radio summaries. **FP** abbreviates foreign policy throughout the charts.

1. **Collect and reconcile speeches.** The American Presidency Project supplies the source texts. Archive listings and alternate URLs are reconciled so one document is counted once, while genuinely different texts remain separate. Stable identifiers, source dates, text fingerprints (hashes) and collection receipts preserve the link to each source.
2. **Prepare sentence units.** Each retained target sentence has an original location and a consistent count of presidential words. Stage directions and editorial metadata contribute no presidential words. Neighbouring passages help interpret the target but add no words to its count.
3. **Annotate and classify.** Annotation means assigning reference labels from the text and its context. Paired AI-assisted reviewers record evidence and unresolved judgments. The released classifier learns foreign-policy relevance and separate reasons for policy from development labels; issue dictionaries apply transparent subject rules within model-selected foreign-policy text. Separate reserved passages assess predictions after the model is frozen: its fitted parameters and decision rules are fixed before evaluation.
4. **Aggregate the measures.** Foreign-policy attention equals words in sentences classified as foreign policy divided by all counted document words. The whole target sentence contributes its words, including any domestic content in a mixed sentence. Subject and tradition shares use the denominators stated beside their plots; overlapping labels can count the same sentence in several categories. Word pooling sums numerators and denominators before dividing. Equal president-year weighting instead averages the shares after pooling each president’s messages within a year.

[Inspect the collection and counting rules](https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/data_sources.md) · [Reproduce the frozen-model analysis](https://github.com/playaditox/sotu-foreign-policy-analysis-v2/blob/main/docs/reproduce_v2.md)`} />
    <RichNarrative id="research-design:questions" value={`### Questions, outcomes and expectations

An **outcome** is what a comparison measures. A **predictor** is a variable used to explain or compare that outcome. In the descriptive charts below, dates, presidents and historical periods are grouping variables; they are not fitted causal predictors.

**1. How much attention does foreign policy receive?** Outcome: the share of all document words in foreign-policy sentences. Comparisons: speech date, administration, party and historical period. This is a descriptive question; no directional hypothesis is imposed on its timeline. The period comparison asks whether observed attention differs across the selected historical settings, without treating a difference as an effect of the international system.

**2. Which international subjects receive attention?** Outcome: words in sentences tagged with a subject divided by all model-selected foreign-policy words. Comparisons: subject and speech date. This maps the subject mix; no general increase or decrease is hypothesized. Categories overlap and are not a complete partition of foreign policy.

**3. What reasons do presidents give for foreign policy?** Outcomes: separate, potentially overlapping tradition signals, with the selected denominator displayed beside each plot. Comparisons: dated statements and their surrounding arguments. No directional ranking of presidents or traditions is imposed. The timeline and administration toggle show exploratory model detections; curated examples explain interpretations without estimating their frequency.

**4. Do party and control of Congress coincide with different rhetoric about force?** Proposed outcomes: separate shares of foreign-policy words endorsing military action and endorsing restraint, with conditional positions and unresolved cases retained. Proposed predictors: presidential party and whether the president’s party controls both chambers, one chamber or neither on the speech date. The hypothesis expects more advocacy under unified Republican government, more restraint under unified Democratic government, and weaker respective positions under divided government. Competing expectations include confrontation or stronger persuasion under division. **This hypothesis is not yet tested:** institutional metadata exist, but a validated corpus-wide force-posture outcome does not. Tradition labels cannot substitute for it.`} />
    <RichNarrative id="research-design:comparisons" value={`### Controls, sensitivity checks and descriptive comparisons

**Control variables** enter a statistical model to compare observations while accounting for other measured differences. No adjusted regression is fitted in the displayed attention, subject or tradition charts. Historical period, presidential identity and conflict exposure are relevant to a future force analysis; they are not controls already applied here. Party is constant within a president, so a model with a separate intercept for every president cannot also identify a standalone party coefficient.

**Context carried with each address:** presidential party and identity, historical era, dated House/Senate alignment, bounded campaign exposure, months in office, constitutional term year and the regular federal-election calendar. Use of force and restraint is separately under calibration; economy, approval and chamber margins have not been collected. These are available variables, not statistical adjustments already applied.

**Sensitivity checks** change an analytical choice and show how the summary changes: corpus formats, including or excluding the long 1946 message, word pooling versus equal president-year weighting, alternative period boundaries, scoring methods and the opening-years exclusion in the crisis analysis. Identifying selected crisis references is an accounting exercise; the remaining text is not established as crisis-free and no crisis-adjusted era effect is estimated.

**Descriptive comparisons** summarize observed differences between administrations, parties or periods. Those groups contain different speakers, conflicts and document formats. Filters select observations; they do not statistically hold those differences constant. Historical event markers supply context rather than evidence that an event caused a change.`} />
    <RichNarrative id="research-design:evidence-status" value={`### What the evidence supports

**Evaluated released measure:** foreign-policy detection has a frozen-model comparison against an AI-assisted reserved reference. This tests agreement with that reference, not independently human-validated accuracy. The method section defines precision, recall and the unresolved cases.

**Descriptive and exploratory results:** attention summaries depend on the selected classifier. Named-subject rules have coverage checks rather than established issue-classification accuracy. Tradition timelines and administration bars remain diagnostic model detections; paired examples illustrate reasons. Historical-period and selected crisis-reference comparisons describe the observed texts without isolating causal effects.

**Pending hypothesis:** the party–Congress–force relationship needs a separately validated force measure and enough observations in the relevant comparison groups. No estimated force effect or completed hypothesis test is reported.`} />
    </ReportDisclosure>
  </section>;
}
