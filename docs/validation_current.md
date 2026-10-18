# Validation: released v2 and historical v1

The live report defaults to the frozen **contextual rationale classifier v2**. The v0 dictionary baseline and v1 classifier remain as benchmark summaries. The [project overview](../README.md) separates deployed results, diagnostic displays and planned hypotheses. Passing implementation checks does not establish independently human-validated classification accuracy.

## Released v2 reference comparison

V2 uses 1,100 paired development targets. Its frozen-model audit retains a separate **400-passage probability sample** and **200-passage challenge set**. The probability comparison below uses the same **370 resolved cases**, including 155 positives, for all three methods; the remaining 30 targets remain unresolved.

| Method | Detected | Missed | False alarms | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dictionary v0 | 55 | 100 | 4 | 93.2% | 35.5% |
| Original classifier v1 | 131 | 24 | 59 | 68.9% | 84.5% |
| Contextual rationale classifier v2 | 132 | 23 | 18 | 88.0% | 85.2% |

These are agreement metrics against an **AI-assisted reference**. Reserved episodes had historical v1 reference exposure, although they were excluded from v2 fitting. The challenge set cannot be pooled with the probability sample to estimate prevalence. This comparison applies to the released methods and the recorded reference scope. See the [reproduction guide](reproduce_v2.md) for the supported public inference and report checks.

The v2 tradition heads do not qualify for prevalence claims. Their public timeline is labelled as diagnostic model detections; curated examples illustrate interpretations. Named-subject coverage does not establish issue-classification accuracy, and the planned force-posture hypothesis still needs a validated outcome. Crisis-reference accounting uses unchanged v2 scores.

