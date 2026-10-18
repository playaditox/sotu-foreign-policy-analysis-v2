const dimensions = ["document_id", "corpus_variant", "scoring_method", "threshold"];
const countFields = ["total_words", "fp_words", "crisis_linked_fp_words", "remaining_fp_words"];
const evidenceFields = ["explicit_crisis_fp_words", "contextual_crisis_fp_words", "unresolved_fp_words", "reviewed_other_fp_words"];

export function presidentPerson(value) {
  return String(value).replace(/\s*\([^)]*term[^)]*\)/gi, "").trim();
}

function measurementKey(row) {
  return dimensions.every(field => row[field] != null && row[field] !== "")
    ? JSON.stringify(dimensions.map(field => row[field])) : null;
}

// Match the reviewed decomposition to the exact selected annual observations.
// Missing methods, duplicate keys or different denominators are unavailable,
// rather than zero-filled or borrowed from a different model/corpus variant.
export function matchCrisisAttention(documents, reviewedRows) {
  if (!Array.isArray(reviewedRows)) return { available: false, reason: "missing_query", rows: [] };
  const byKey = new Map();
  for (const row of reviewedRows) {
    const key = measurementKey(row);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }
  const rows = [];
  const selectedKeys = new Set();
  for (const document of documents) {
    const key = measurementKey(document);
    if (key && selectedKeys.has(key)) return { available: false, reason: "duplicate_measurement", rows: [] };
    if (key) selectedKeys.add(key);
    const matches = key ? byKey.get(key) : null;
    if (!matches?.length) return { available: false, reason: "unsupported_selection", rows: [] };
    if (matches.length !== 1) return { available: false, reason: "duplicate_measurement", rows: [] };
    const row = matches[0];
    if (countFields.some(field => !Number.isInteger(row[field]) || row[field] < 0)
      || row.total_words <= 0 || row.fp_words > row.total_words
      || row.crisis_linked_fp_words + row.remaining_fp_words !== row.fp_words
      || row.total_words !== document.total_words || row.fp_words !== document.fp_words
      || row.date !== document.date || Number(row.year) !== Number(document.year)
      || row.president !== document.president) {
      return { available: false, reason: "inconsistent_measurement", rows: [] };
    }
    rows.push(row);
  }
  return { available: true, reason: null, rows };
}

function summary(rows, weighting) {
  const totalWords = rows.reduce((value, row) => value + row.total_words, 0);
  const availableFields = [...countFields, ...evidenceFields.filter(field => rows.every(row => Number.isInteger(row[field]) && row[field] >= 0))];
  const totals = Object.fromEntries(availableFields.map(field => [field, rows.reduce((value, row) => value + row[field], 0)]));
  const groups = new Map();
  for (const row of rows) {
    const key = JSON.stringify([presidentPerson(row.president), Number(row.year)]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const rate = field => {
    if (!rows.length || totalWords <= 0) return null;
    if (weighting === "words") return totals[field] / totalWords;
    const shares = [...groups.values()].map(members => {
      const denominator = members.reduce((value, row) => value + row.total_words, 0);
      return denominator > 0 ? members.reduce((value, row) => value + row[field], 0) / denominator : null;
    });
    return shares.length && shares.every(Number.isFinite)
      ? shares.reduce((value, share) => value + share, 0) / shares.length : null;
  };
  return {
    ...totals,
    fpShare: rate("fp_words"),
    crisisShare: rate("crisis_linked_fp_words"),
    remainingShare: rate("remaining_fp_words"),
    explicitShare: availableFields.includes("explicit_crisis_fp_words") ? rate("explicit_crisis_fp_words") : null,
    contextualShare: availableFields.includes("contextual_crisis_fp_words") ? rate("contextual_crisis_fp_words") : null,
    unresolvedShare: availableFields.includes("unresolved_fp_words") ? rate("unresolved_fp_words") : null,
    reviewedOtherShare: availableFields.includes("reviewed_other_fp_words") ? rate("reviewed_other_fp_words") : null,
    documents: rows.length,
    president_years: groups.size,
    presidents: new Set(rows.map(row => presidentPerson(row.president))).size,
    first: rows.map(row => row.date).sort()[0] ?? null,
    last: rows.map(row => row.date).sort().at(-1) ?? null,
  };
}

export function crisisPeriodRows(rows, scheme, weighting = "words", excludeInitialYears = false) {
  if (!["words", "president_year"].includes(weighting)) throw new Error("Unsupported crisis-attention weighting");
  return scheme.periods.map(period => {
    const members = rows.filter(row => row.date >= period.start_date
      && (!period.end_date_exclusive || row.date < period.end_date_exclusive)
      && (!excludeInitialYears || row.date < "2002-01-01" || row.date >= "2005-01-01"));
    return {
      period_id: period.period_id,
      period: period.chart_label ?? period.label,
      label: period.label,
      ...summary(members, weighting),
      weighting,
      window: excludeInitialYears ? "exclude_2002_2004" : "all_speech_dates",
    };
  });
}

export function crisisSensitivityRows(rows, scheme, weighting = "words") {
  const full = crisisPeriodRows(rows, scheme, weighting);
  const excluded = crisisPeriodRows(rows, scheme, weighting, true);
  return full.map((row, index) => {
    const sensitivity = excluded[index];
    return {
      period_id: row.period_id, period: row.period, label: row.label,
      fullShare: row.fpShare,
      sensitivityShare: sensitivity.fpShare,
      difference_pp: row.fpShare != null && sensitivity.fpShare != null
        ? 100 * (sensitivity.fpShare - row.fpShare) : null,
      full_documents: row.documents,
      excluded_documents: row.documents - sensitivity.documents,
      remaining_documents: sensitivity.documents,
      remaining_president_years: sensitivity.president_years,
      remaining_presidents: sensitivity.presidents,
      remaining_first: sensitivity.first,
      remaining_last: sensitivity.last,
      weighting,
    };
  }).filter(row => row.full_documents > 0);
}

export function crisisSupportRows(rows, scheme) {
  if (rows.some(row => typeof row.listed_campaign_exposed !== "boolean"
    || !Array.isArray(row.listed_campaign_ids)
    || row.listed_campaign_ids.some(id => typeof id !== "string" || !id)
    || row.listed_campaign_exposed !== (row.listed_campaign_ids.length > 0))) {
    return {available: false, rows: []};
  }
  return {available: true, rows: scheme.periods.map(period => {
    const members = rows.filter(row => row.date >= period.start_date
      && (!period.end_date_exclusive || row.date < period.end_date_exclusive));
    const counts = summary(members, "words");
    const exposed = members.filter(row => row.listed_campaign_exposed).length;
    return {
      period_id: period.period_id, label: period.label,
      documents: counts.documents, president_years: counts.president_years,
      presidents: counts.presidents,
      president_names: [...new Set(members.map(row => row.president))],
      listed_campaign_exposed_documents: exposed,
      outside_listed_campaign_documents: counts.documents - exposed,
      listed_campaign_ids: [...new Set(members.flatMap(row => row.listed_campaign_ids))],
    };
  }).filter(row => row.documents > 0)};
}

export function crisisEvidenceRows(rows, scheme, weighting = "words") {
  if (rows.some(row => evidenceFields.some(field => !Number.isInteger(row[field]) || row[field] < 0)
    || row.explicit_crisis_fp_words + row.contextual_crisis_fp_words !== row.crisis_linked_fp_words
    || row.unresolved_fp_words + row.reviewed_other_fp_words !== row.remaining_fp_words)) {
    return {available: false, rows: []};
  }
  return {available: true, rows: crisisPeriodRows(rows, scheme, weighting).filter(row => row.documents > 0)};
}
