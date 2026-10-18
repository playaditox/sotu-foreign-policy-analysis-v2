# Data sources and public release scope

The report contains 100 presidential messages covering 1946–2026, 35,345 sentence units and 676,171 original presidential words. Source URLs, exact dates, document formats and original text hashes remain in `data/corpus/documents.jsonl.gz`. Paragraphs and sentence units retain exact frozen-model context; editorial directions have zero counted words. The original source is the [American Presidency Project](https://www.presidency.ucsb.edu/).

`portfolio/src/data.json` is the reviewed public report snapshot. Its queries contain only the rows needed by visible v2 report components, the source-linked contextual illustrations and the published v0/v1 benchmark table. Corpus, year and format controls use the same original word denominators as the preceding report. No model is refitted and no scores are relabelled during publication.

Public source metadata identifies this reviewed publication export. Development sessions, private annotation receipts and intermediate computational records are not part of the public checkout. Their omission is not a new accuracy claim. `public-release-manifest.json` binds the exact public files and reviewed query rows. The original model hash and unchanged inference functions bind v2 scoring separately.

The 32 tradition examples and two force-posture illustrations already shown in the report remain source-linked examples, not population or accuracy estimates. Named-subject rules overlap and do not exhaust foreign-policy text. Context metadata support descriptive comparisons; no causal or adjusted force effect is claimed.

The public report is at [this address](https://playaditox.github.io/sotu-foreign-policy-analysis-v2/); the corresponding code is [here](https://github.com/playaditox/sotu-foreign-policy-analysis-v2).
