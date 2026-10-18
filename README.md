# How U.S. presidents talk about the world — v2

A reproducible analysis of 100 State of the Union messages and related presidential addresses, covering 1946–2026, 35,345 sentence units and 676,171 original presidential words.

**[Explore the interactive report](https://playaditox.github.io/sotu-foreign-policy-analysis-v2/)** · [Public release status](docs/release_status.md) · [Reproduce v2](docs/reproduce_v2.md)

This public repository contains the current **v2 model and report**. V0 and v1 appear only as historical benchmark summaries on the same reference sample. The full research history, annotation sessions, unpublished models and archived dashboards are maintained privately.

## What the report shows

- Foreign-policy attention, measured as words in v2-detected foreign-policy sentences divided by original speech words.
- Named international subjects, source-linked examples and overlapping subject shares.
- Contextual illustrations of four traditions, with clearly labelled diagnostic v2 detections over time and by administration.
- Historical-period and crisis-reference comparisons, and dated political and institutional context.

The source corpus covers all 81 years and preserves format, speaker, date and source provenance. These descriptive measures concern presidential language, not enacted policy or causal effects. AI-assisted reference agreement is not independently human-validated accuracy. Tradition detections are not validated prevalence or ideological rankings.

## Common-reference benchmark

All three methods use the same 370 resolved passages from a 400-passage probability reference, including 155 positives; 30 references remain unresolved. A separate 200-passage challenge set is not pooled into prevalence estimates.

| Method | Detected | Missed | False alarms | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| V0 dictionary benchmark | 55 | 100 | 4 | 93.2% | 35.5% |
| V1 classifier benchmark | 131 | 24 | 59 | 68.9% | 84.5% |
| **V2 current classifier** | **132** | **23** | **18** | **88.0%** | **85.2%** |

See [validation and limits](docs/validation_current.md). The v2 model bytes, context feature construction, cutoffs and word totals are preserved. Publication does not refit a model or change the reported scores.

## Public files

| Location | Purpose |
| --- | --- |
| `portfolio/` | Current report source, protected presentation runtime, reviewed data and one compiled release |
| `models/v2/` | Exact released v2 model and public integrity metadata |
| `src/sotu_v2/` | Minimal inference and corpus-scoring code |
| `data/corpus/` | Compressed source documents, paragraphs, sentence units and hashes |
| `docs/` | Current methods, interpretation, reproduction and planned extensions |
| `tests/`, `scripts/`, `.github/` | Focused release, inference and deployment checks |
| `public-release-manifest.json` | Explicit approved public files and reviewed query hashes |

Future models will consider expanding the corpus as data become available and incorporating further contextual control variables. A separate corpus of presidents’ UN General Assembly addresses is planned; it has not been collected or analysed here. See [available versus planned context variables and the UNGA extension](docs/release_status.md).

The original undergraduate thesis supplies the theoretical questions. AI assisted implementation, annotation and presentation; shared model-family agreement does not remove shared error. Original project code uses MIT; source texts and copied runtime components retain their attribution and terms in [NOTICE.md](NOTICE.md).
