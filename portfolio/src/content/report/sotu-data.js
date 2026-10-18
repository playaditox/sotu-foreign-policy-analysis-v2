export const traditions = [
  { key: "wilsonian", label: "Wilsonian", gloss: "Rights, democracy & shared rules", color: "#477fb6" },
  { key: "hamiltonian", label: "Hamiltonian", gloss: "Commerce & strategic interests", color: "#a86d16" },
  { key: "jacksonian", label: "Jacksonian", gloss: "National priority & conditional engagement", color: "#ac5368" },
  { key: "jeffersonian", label: "Jeffersonian", gloss: "Restraint & limits on commitments", color: "#667d40" },
];

export const corpusLabels = {
  inclusive: "All eligible formats",
  annual_messages: "Annual messages, excluding radio summaries",
  spoken: "Joint-session addresses only",
};

export const thresholdLabels = { supported: "Supported signals", explicit: "Explicit signals only" };
export const methodLabels = { contextual_dictionary_v1: "Contextual dictionary · v0", supervised_tfidf_v1: "Original text classifier · v1", contextual_rationale_v2: "Contextual rationale classifier · v2" };
export const pct = (value, digits = 1) => Number.isFinite(value) ? `${(100 * value).toFixed(digits)}%` : "Unavailable";
export const compactNumber = value => value != null && value !== "" && Number.isFinite(Number(value))
  ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value)).replace(/K$/, "k") : "—";
export const humanize = value => String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
export const sum = (rows, field) => rows.reduce((value, row) => value + (Number(row[field]) || 0), 0);

function numerator(row, key) {
  for (const field of [`${key}_words`, `${key}_supported_words`, `${key}_word_count`]) {
    if (row[field] != null && Number.isFinite(Number(row[field]))) return Number(row[field]);
  }
  // Some reviewed snapshots retain only document rates and their exact denominator.
  // Reconstructing this product preserves the supplied word weighting.
  return row[`${key}_share`] == null || row.fp_words == null || !Number.isFinite(Number(row.fp_words))
    ? null : Number(row[`${key}_share`]) * Number(row.fp_words);
}

export function pooled(rows) {
  const totalWords = rows.some(row => row.total_words == null) ? null : sum(rows, "total_words");
  const fpWords = rows.some(row => row.fp_words == null) ? null : sum(rows, "fp_words");
  const output = { total_words: totalWords, fp_words: fpWords,
    fpShare: totalWords && fpWords != null ? fpWords / totalWords : null,
    documents: new Set(rows.map(row => row.document_id)).size };
  for (const { key, label } of traditions) {
    const values = rows.map(row => numerator(row, key));
    const words = values.some(value => value == null) ? null : values.reduce((a, b) => a + b, 0);
    output[`${key}_words`] = words;
    output[`${label}Share`] = fpWords && words != null ? words / fpWords : null;
    output[`${label}WholeShare`] = totalWords && words != null ? words / totalWords : null;
  }
  return output;
}

export function aggregate(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const group = typeof key === "function" ? key(row) : row[key];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(row);
  }
  return [...groups].map(([group, members]) => ({ group, ...pooled(members), members }));
}

export function annualize(rows) {
  return aggregate(rows, "year").map(({ members, ...group }) => ({ ...group, year: Number(group.group),
    // This is an annual observation anchor, not a claim about when an event occurred.
    annualDate: `${group.group}-01-01`,
    president: [...new Set(members.map(row => row.president))].join(" / "),
    parties: [...new Set(members.map(row => row.party))].join(" / "),
  })).sort((a, b) => a.year - b.year);
}

export function administrationRows(rows) {
  return aggregate(rows, row => row.administration ?? `${row.president} (${row.party})`).map(group => {
    const firstYear = Math.min(...group.members.map(row => Number(row.year)));
    const lastYear = Math.max(...group.members.map(row => Number(row.year)));
    const president = group.members[0].president;
    const party = group.members[0].party;
    const shortName = /Trump/i.test(president) ? (/2nd|Trump II|trump_ii/i.test(`${president} ${group.group}`) ? "Trump II" : "Trump I")
      : /Bush/i.test(president) ? (/George W\./i.test(president) ? "G. W. Bush" : "G. H. W. Bush")
        : president.match(/Truman|Eisenhower|Kennedy|Johnson|Nixon|Ford|Carter|Reagan|Clinton|Obama|Biden/i)?.[0] ?? president;
    const { members, ...metrics } = group;
    return { ...metrics, firstYear, lastYear, president, party,
      administration: String(group.group),
      displayLabel: `${shortName} · ${party === "Democrat" ? "D" : party === "Republican" ? "R" : party}`,
      fullLabel: `${president} · ${party} · ${firstYear}–${lastYear}` };
  }).sort((a, b) => a.firstYear - b.firstYear);
}

export function dateBounds(value) {
  if (!value || value === "all") return [1946, 2026];
  const [start, end] = String(value).split("..");
  return end ? [Number(start.slice(0, 4)), Number(end.slice(0, 4))] : [1946, Number(start.slice(0, 4))];
}

export function withinYears(rows, bounds) {
  return rows.filter(row => Number(row.year) >= bounds[0] && Number(row.year) <= bounds[1]);
}

export function issueSummary(rows, fpWords) {
  return aggregateIssues(rows).map(row => ({ ...row, issueShare: fpWords ? row.words / fpWords : null }))
    .sort((a, b) => b.words - a.words);
}

function aggregateIssues(rows) {
  const groups = new Map();
  for (const row of rows) {
    const issue = row.issue ?? row.label;
    if (!issue) continue;
    groups.set(issue, (groups.get(issue) ?? 0) + Number(row.words ?? row.issue_words ?? 0));
  }
  return [...groups].map(([issue, words]) => ({ issue: humanize(issue), words }));
}

export function normalizeEvidence(row) {
  let labels = row.traditions ?? row.labels ?? {};
  let evidence = row.evidence ?? {};
  if (typeof labels === "string") { try { labels = JSON.parse(labels); } catch { labels = {}; } }
  if (typeof evidence === "string") { try { evidence = JSON.parse(evidence); } catch { evidence = { matched: evidence }; } }
  if (Array.isArray(labels)) labels = Object.fromEntries(labels.map(key => [key, 1]));
  for (const { key } of traditions) {
    if (labels[key] == null && row[`${key}_score`] != null) labels = { ...labels, [key]: Number(row[`${key}_score`]) };
  }
  return { ...row, sentence_id: row.sentence_id ?? row.id, labels, evidence,
    text: row.text ?? row.sentence ?? "", context: row.context ?? row.paragraph_text
      ?? [row.context_before, row.text, row.context_after].filter(Boolean).join(" "),
    labelSummary: traditions.filter(({ key }) => Number(labels[key]) > 0).map(({ label }) => label).join(" + ") || "No tradition signal" };
}

export function fractionalYear(value) {
  if (!value) return null;
  const parts = String(value).split("-").map(Number);
  if (!Number.isFinite(parts[0])) return null;
  if (parts.length === 1) return parts[0] + 0.5;
  if (parts.length === 2) return parts[0] + (parts[1] - 0.5) / 12;
  const start = Date.UTC(parts[0], 0, 1);
  const end = Date.UTC(parts[0] + 1, 0, 1);
  return parts[0] + (Date.UTC(parts[0], parts[1] - 1, parts[2]) - start) / (end - start);
}

export function eventLabelDate(value) {
  if (!value) return "ongoing";
  const parts = String(value).split("-");
  if (parts.length < 2) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return parts.length === 2 ? `${months[Number(parts[1]) - 1]} ${parts[0]}`
    : `${Number(parts[2])} ${months[Number(parts[1]) - 1]} ${parts[0]}`;
}

export function eventRows(rows) {
  return rows.map((row, index) => ({ ...row, reviewedRow: row, id: row.id ?? row.event_id ?? `event-${index}`,
    label: row.label ?? row.title ?? row.name,
    start: row.start ?? row.start_date ?? row.date,
    end: row.end ?? row.end_date ?? null,
    description: row.description ?? row.selection_reason,
    note: row.note ?? row.notes,
    source_url: row.source_url ?? row.url ?? row.sources?.[0]?.url,
  })).filter(row => row.label && row.start);
}
