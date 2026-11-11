// Pure presentation model. Scores come from the reviewed design snapshot.
// This module neither evaluates geometry nor establishes an official ranking.
export const UNITS = Object.freeze([
  Object.freeze({id: 'research_archive', label: 'Research design archive',
    description: 'Curated retained designs from agent searches and researcher-guided repairs; not one autonomous method.'}),
  Object.freeze({id: 'published_reference', label: 'Published reference archive',
    description: 'Selected published designs re-evaluated under matched settings; not an equal-budget agent baseline.'})
]);

export const SURFACES = Object.freeze([
  {id: 'QA', label: 'QA'}, {id: 'QH', label: 'QH'}, {id: 'W7X', label: 'W7-X'},
  {id: 'MUSE', label: 'MUSE'}, {id: 'CFQS', label: 'CFQS'}, {id: 'HSX', label: 'HSX'},
  {id: 'NCSX', label: 'NCSX'}, {id: 'tokamak', label: 'Circular tokamak'},
  {id: 'rotating', label: 'Rotating ellipse'}, {id: 'Schuett', label: 'Schuett–Henneberg'}
].map(Object.freeze));

// Frozen shared subsets for this reviewed snapshot. Never recompute them from
// whichever rows happen to be present: that would change the denominator.
export const MATCHED_SURFACES = Object.freeze({
  current: Object.freeze(['QA', 'QH', 'W7X', 'MUSE', 'CFQS', 'HSX', 'NCSX', 'tokamak']),
  legacy: Object.freeze(['QA', 'QH', 'W7X', 'MUSE', 'CFQS', 'HSX', 'NCSX', 'tokamak', 'Schuett'])
});

export const METHODOLOGY = Object.freeze({
  unit: 'One row per curated design archive, not per autonomous agent.',
  matched: 'Provisional shared-subset mean: the unweighted arithmetic mean of grid-128 official composite scores on exactly the same predeclared surfaces for both archives.',
  missing: 'Missing, incomplete, hard-failed, grid-mismatched or protocol-mismatched pairs are never imputed as zero. An incomplete predeclared subset has no mean or rank.',
  full: 'A ten-surface overall mean and rank require all ten matched, complete, hard-passing pairs. Otherwise both archives are unranked for the full benchmark.',
  wins: 'Wins count strictly higher composite scores on matched surfaces; exact numeric ties count as ties. Tiny differences are not evidence of statistical significance.',
  engineering: 'Hard eligibility and nine-soft-target satisfaction are reported separately. Alternative all-soft designs are never combined with the highest-score geometry.',
  interpretation: 'These are curated design archives and selected references. This is neither an official ten-task overall leaderboard nor a controlled equal-budget agent comparison.'
});

function assertCohort(cohort) {
  if (!Object.hasOwn(MATCHED_SURFACES, cohort)) throw new RangeError(`Unknown cohort: ${cohort}`);
}

function indexRecords(data) {
  const records = new Map();
  for (const record of data?.records ?? []) {
    if (!record || typeof record.id !== 'string') continue;
    // An ambiguous ID must not silently select whichever duplicate came last.
    records.set(record.id, records.has(record.id) ? null : record);
  }
  return records;
}

function recordFor(record, cohort, surface) {
  return record?.cohort === cohort && record.surface === surface ? record : null;
}

function complete128(record) {
  return Boolean(record && record.complete === true && record.grid === 128 &&
    record.hard_status === 'PASS' && record.hard_count === 3 && record.hard_pass === 3 &&
    record.soft_count === 9 && Number.isInteger(record.soft_pass) && record.soft_pass >= 0 && record.soft_pass <= 9 &&
    Number.isFinite(record.score) && record.score >= 0 &&
    /^[a-f0-9]{64}$/i.test(record.protocol_sha256 ?? '') && typeof record.virtual_casing === 'boolean');
}

function samePair(left, right) {
  return Boolean(complete128(left) && complete128(right) &&
    left.protocol_sha256 === right.protocol_sha256 && left.virtual_casing === right.virtual_casing &&
    left.cohort === right.cohort && left.surface === right.surface && left.grid === right.grid);
}

function rankPair(rows, scoreKey) {
  const sorted = [...rows].sort((a, b) => b[scoreKey] - a[scoreKey]);
  sorted.forEach((row, index) => {
    row.rank = index && sorted[index - 1][scoreKey] === row[scoreKey] ? sorted[index - 1].rank : index + 1;
  });
  return sorted;
}

function publicRecord(record) {
  if (!record) return null;
  // Only an allowlist; no source labels, internal paths, or opaque raw objects.
  return {
    id: record.id, source_kind: record.source_kind, score: Number.isFinite(record.score) ? record.score : null,
    bn: Number.isFinite(record.bn) ? record.bn : null, grid: record.grid,
    hard_status: ['PASS', 'FAIL', 'UNKNOWN'].includes(record.hard_status) ? record.hard_status : 'UNKNOWN',
    hard_pass: record.hard_pass, hard_count: record.hard_count,
    soft_pass: Number.isInteger(record.soft_pass) ? record.soft_pass : null, soft_count: record.soft_count,
    all_soft_pass: record.all_soft_pass === true, protocol_sha256: record.protocol_sha256,
    virtual_casing: record.virtual_casing, geometry_sha256: record.geometry_sha256,
    evidence: (record.evidence ?? []).map(item => ({relative_path: item.relative_path, sha256: item.sha256, source_report_sha256: item.source_report_sha256}))
  };
}

export function buildSurface(data, cohort, surface) {
  assertCohort(cohort);
  const definition = SURFACES.find(item => item.id === surface);
  if (!definition) throw new RangeError(`Unknown surface: ${surface}`);
  const matches = (data?.cells ?? []).filter(item => item.cohort === cohort && item.surface === surface);
  const cell = matches.length === 1 ? matches[0] : null;
  const records = indexRecords(data);
  const ours = recordFor(records.get(cell?.best_ours_id), cohort, surface);
  const referenceIds = cell?.official_reference_ids ?? [];
  // A single selected reference is required; never silently pick a favorable one.
  const reference = referenceIds.length === 1 ? recordFor(records.get(referenceIds[0]), cohort, surface) : null;
  const unpairedIds = cell?.unpaired_candidate_ids ?? [];
  const observedOurs = ours ?? (unpairedIds.length === 1 ? recordFor(records.get(unpairedIds[0]), cohort, surface) : null);
  let status = 'incomplete';
  let reason = 'A complete matched grid-128 pair is unavailable.';
  if (matches.length > 1) reason = 'Duplicate surface cells make this comparison ambiguous.';
  else if (referenceIds.length > 1) reason = 'Multiple reference selections require explicit disambiguation.';
  else if (reference?.hard_status === 'FAIL' || ours?.hard_status === 'FAIL') {
    status = 'no_valid_reference';
    reason = 'At least one design fails a hard constraint. A positive score against a hard-failed zero is not a ranked win.';
  } else if (cell?.comparison_status === 'protocol_mismatch' ||
    (ours && reference && (ours.protocol_sha256 !== reference.protocol_sha256 || ours.grid !== reference.grid || ours.virtual_casing !== reference.virtual_casing))) {
    status = 'protocol_mismatch';
    reason = 'The designs do not share the same evaluation protocol, grid and physical setting.';
  } else if (cell?.comparison_status === 'comparable' && samePair(ours, reference)) {
    status = 'comparable';
    reason = 'Both selected designs pass all three hard constraints with all nine soft metrics present under the same grid-128 protocol.';
  }
  const eligible = status === 'comparable';
  let rows = UNITS.map((unit, index) => {
    const selected = index === 0 ? ours : reference;
    const observed = index === 0 ? observedOurs : reference;
    return {unit_id: unit.id, unit_label: unit.label, rank: null,
      rank_status: eligible ? 'paired_design_rank' : 'unranked', record: publicRecord(observed),
      eligible_design: complete128(selected), score: Number.isFinite(observed?.score) ? observed.score : null,
      eligible_score: eligible ? selected.score : null,
      bn: Number.isFinite(observed?.bn) ? observed.bn : null,
      hard_status: observed?.hard_status ?? 'UNKNOWN', soft_pass: observed?.soft_pass ?? null,
      soft_count: observed?.soft_count ?? 9, grid: observed?.grid ?? null};
  });
  if (eligible) rows = rankPair(rows, 'eligible_score');
  return {cohort, surface, label: definition.label, comparison_status: status, reason,
    ranked: eligible, grid: 128, rows,
    delta_percent: eligible && reference.score > 0 ? (ours.score / reference.score - 1) * 100 : null,
    all_soft_alternative: publicRecord(recordFor(records.get(cell?.best_all_soft_id), cohort, surface)),
    scope: METHODOLOGY.interpretation};
}

export function buildOverall(data, cohort, mode = 'matched') {
  assertCohort(cohort);
  if (!['matched', 'all10'].includes(mode)) throw new RangeError(`Unknown aggregation mode: ${mode}`);
  const surfaces = SURFACES.map(item => buildSurface(data, cohort, item.id));
  const fixedIds = MATCHED_SURFACES[cohort];
  const matched = fixedIds.map(id => surfaces.find(item => item.surface === id));
  const matchedComplete = matched.every(item => item.ranked);
  const fullComplete = surfaces.every(item => item.ranked);
  const selected = mode === 'matched' ? matched : surfaces;
  const rankable = mode === 'matched' ? matchedComplete : fullComplete;
  const getRow = (surface, unit) => surface.rows.find(row => row.unit_id === unit);
  const mean = (items, unit) => items.reduce((sum, item) => sum + getRow(item, unit).eligible_score, 0) / items.length;
  let rows = UNITS.map(unit => {
    const covered = surfaces.filter(item => getRow(item, unit.id).eligible_design);
    const supplied = surfaces.filter(item => getRow(item, unit.id).record);
    const wins = matched.filter(item => item.ranked && getRow(item, unit.id).rank === 1 && item.rows.some(row => row.rank === 2)).length;
    const ties = matched.filter(item => item.ranked && item.rows.every(row => row.rank === 1)).length;
    return {unit_id: unit.id, unit_label: unit.label, description: unit.description,
      rank: null, rank_status: rankable ? (mode === 'matched' ? 'provisional_shared_subset' : 'complete_ten_surface_preview') : 'unranked',
      mean_comparable_composite: matchedComplete ? mean(matched, unit.id) : null,
      full_ten_mean: fullComplete ? mean(surfaces, unit.id) : null,
      mean_score: rankable ? mean(selected, unit.id) : null,
      full_ten_rank: null,
      shared_coverage: matched.filter(item => item.ranked).length, shared_required: fixedIds.length,
      eligible_coverage: covered.length, supplied_coverage: supplied.length, total_surfaces: SURFACES.length,
      wins: matchedComplete ? wins : null, ties: matchedComplete ? ties : null,
      losses: matchedComplete ? matched.length - wins - ties : null,
      all_soft_selected: matchedComplete ? matched.filter(item => getRow(item, unit.id).record?.soft_pass === 9).length : null,
      compared_surface_ids: [...fixedIds]};
  });
  if (rankable) rows = rankPair(rows, 'mean_score');
  if (fullComplete) {
    const fullOrder = rankPair(rows.map(row => ({...row})), 'full_ten_mean');
    for (const row of rows) row.full_ten_rank = fullOrder.find(item => item.unit_id === row.unit_id).rank;
  }
  return {cohort, mode, label: mode === 'matched' ? 'Provisional shared-subset overview' : 'Ten-surface overall overview',
    unit_kind: 'curated_design_archives', official_ranking: false, equal_budget_agent_comparison: false,
    rank_scope: rankable ? (mode === 'matched' ? 'provisional_shared_subset' : 'complete_ten_surface_preview') : 'unranked',
    total_surfaces: SURFACES.length, aggregation_surface_ids: selected.map(item => item.surface),
    fixed_matched_surface_ids: [...fixedIds], shared_subset_complete: matchedComplete,
    full_ten_complete: fullComplete, full_ten_status: fullComplete ? 'complete_preview' : 'unranked',
    excluded_surface_ids: surfaces.filter(item => !fixedIds.includes(item.surface)).map(item => item.surface),
    unavailable_surface_ids: selected.filter(item => !item.ranked).map(item => item.surface),
    formula: 'sum of official composite scores over the declared shared surface set / number of surfaces in that same set',
    methodology: METHODOLOGY, rows, surfaces};
}
