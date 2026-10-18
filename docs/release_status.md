# Public release status

Updated 18 October 2026. Release notes for the [interactive report](https://playaditox.github.io/sotu-foreign-policy-analysis-v2/).

## Live model

The report uses the **v2 contextual rationale classifier** for foreign-policy attention. The released **v0 dictionary baseline** and **v1 text classifier** remain as historical benchmark summaries. The corpus contains 100 documents covering 1946–2026, with 35,345 retained sentence units and 676,171 original presidential words.

| Version | Approach | Public role |
| --- | --- | --- |
| V0 | Contextual dictionary baseline | Historical dictionary benchmark |
| V1 | TF-IDF text classifier | Historical classifier benchmark |
| V2 | Contextual rationale classifier | Current default attention model |

V0 is the public label for the dictionary baseline; its stable internal identifier remains `contextual_dictionary_v1`. The [released-model validation](validation_current.md) compares all three methods on the same 370 resolved passages from a 400-passage reference. These metrics measure agreement with an AI-assisted reference, not independently human-validated accuracy. The four-tradition timeline and administration comparison remain diagnostic, and contextual examples illustrate interpretations rather than validated prevalence. Attention measures presidential language, not enacted policy.

Future models will consider **further corpus expansion as additional data become available**, alongside **additional contextual control variables**. Proposed extensions will require source checks and separate validation before release.

## Context variables: available versus planned

| Variable or check | Available now | Planned work or limitation |
| --- | --- | --- |
| Presidential party and administration | Dated speaker metadata and administration IDs | Descriptive comparisons or question-specific within-president models; these fields do not assign rhetorical labels. |
| Systemic era | Declared date schemes and alternative boundaries | Periods can coincide with presidents; the 2002–2008 group contains only George W. Bush. |
| Crisis-related rhetoric | Reviewed named references, bounded campaign-date context and opening-years sensitivity | Broader crisis coverage requires additional data. Unmarked text is not necessarily crisis-free. |
| President–Congress alignment | Exact-date assignments for all 100 documents: 26 unified Democratic, 11 unified Republican, 47 opposition-both-chambers and 16 split-chamber | Party/alignment comparisons of force rhetoric require a validated force outcome and adequate historical overlap. |
| Term stage and election timing | Time in office, year within the constitutional term and the regular federal-election calendar | Timing describes the calendar; it does not imply candidacy, future results or an estimated election effect. |
| Format, original length and weighting | Format filters, original word counts, equal president-year and word-pooled summaries | Retain as measurement sensitivities. |
| Force posture | Coding definitions and contextual examples | Validate separate advocacy, conditional-force and restraint indicators before corpus-wide comparisons. No expressed position is not dovishness. |
| Economy, presidential approval and chamber margins | Not collected for this release | Potential additional controls, subject to coverage, timing and source checks. |

The available fields accompany the speeches; they have not all been held constant in the displayed charts. They are not interchangeable regression controls. Force posture is the outcome for the party/alignment question and may serve a different role in a separate tradition analysis. See the [dated-context definitions](context_variables.md).

## Planned extension: presidential UNGA addresses

**Planned; this comparison corpus has not been collected or analysed.** A separate UN General Assembly corpus could compare domestic-facing and international-facing presidential rhetoric. The [UN Library indexes General Debate records from 1946](https://research.un.org/en/docs/ga/generaldebate), and the authors’ current [General Debate Corpus covers 1946–2025](https://doi.org/10.7910/DVN/0TJX8Y). This does not establish annual presidential coverage or 81 matched pairs.

The core would comprise presidents’ own regular-session General Debate addresses, with opening, anniversary and special-session formats flagged separately. Verify each speaker: a U.S. country statement may be delivered by another official. For example, [official 1947 records identify Secretary of State Marshall](https://history.state.gov/historicaldocuments/frus1947v01/introductory). Preserve source, delivery format and exact date.

Match SOTU and UNGA texts by **the same president and year**, recording the elapsed time and intervening crises. Compare issue, rationale and force-posture mixes within foreign-policy text; retain attention shares as a secondary view. Revalidate the measurements on UNGA language before transferring SOTU models, and keep paired president-years together during evaluation. These would be venue-associated differences, not a causal audience effect: genre, timing, circumstances and attendance selection change together. Keep the corpora separate rather than extending the SOTU trend with UNGA observations.
