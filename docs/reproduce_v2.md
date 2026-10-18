# Reproduce the public v2 release

## Inspect or rebuild the report

The complete reviewed snapshot is `portfolio/src/data.json`; the current compiled report and its single referenced sidecar are in `portfolio/release/`. No private annotation records are needed to view or rebuild it. Follow [the build instructions](../portfolio/BUILD.md). The report identity, v2 scores and original word counts are preserved.

## Rescore the frozen v2 model

Use Python 3.12+ and the pinned `requirements.txt`. From the repository root:

```sh
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 -m unittest discover -s tests -v
PYTHONPATH=src python3 -m sotu_v2.score_corpus /absolute/new-output-directory
```

The destination must not already exist. The scorer writes sentence decisions and document word totals. It uses the exact released `models/v2/model.pkl`, verifies its SHA-256 before deserializing, and applies the original target/context features, sigmoid mappings, cutoffs and relevance/explicitness rules. The five prediction functions are copied verbatim from the frozen implementation; tests check a source-linked sample against the historical v2 outputs. The compressed source corpus preserves the original target text and uncounted surrounding context. Pickles should be loaded only from trusted project artifacts.

Rebuilding the report and rescoring the frozen model are supported here. Training-label reconstruction, model selection, refitting, annotation sessions and new evaluations remain in the private research workspace; this release does not claim to reproduce those private stages. V0 and v1 remain published benchmark summaries rather than runnable historical model releases.

## Release boundaries

The explicit `public-release-manifest.json` lists every approved public file and hashes the reviewed query rows. `scripts/verify_public_release.py` rejects missing, changed or additional tracked release files, excluded research directories and invalid model/data bindings. Public CI runs these checks and inference tests; a test pass verifies implementation and integrity, not independent human accuracy.
