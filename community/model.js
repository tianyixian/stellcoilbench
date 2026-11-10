// All scientific values are supplied by the reviewed data snapshot, never inferred here.
export function comparable(candidate, reference) {
  return Boolean(candidate && reference && candidate.complete && reference.complete &&
    candidate.hard_status === 'PASS' && reference.hard_status === 'PASS' &&
    Number.isFinite(candidate.score) && Number.isFinite(reference.score) && reference.score > 0 &&
    candidate.protocol_sha256 && candidate.protocol_sha256 === reference.protocol_sha256 &&
    candidate.grid === reference.grid && candidate.cohort === reference.cohort && candidate.surface === reference.surface);
}
export function delta(candidate, reference, cell) {
  return cell.comparison_status === 'comparable' && comparable(candidate, reference)
    ? (candidate.score / reference.score - 1) * 100 : null;
}
export function selectedRecord(cell, records, allSoft = false) {
  const id = allSoft ? cell.best_all_soft_id : cell.best_ours_id;
  return records.find(record => record.id === id) ?? null;
}
export function evidenceURL(path) {
  // Only packaged evidence; neither remote URLs nor directory traversal are accepted.
  return typeof path === 'string' && /^evidence\/[a-zA-Z0-9_.-]+\.json$/.test(path) ? `data/${path}` : null;
}
export function validateManifest(data, surfaces) {
  const errors = [];
  if (!data || Array.isArray(data) || typeof data !== 'object') return ['The manifest must be a JSON object.'];
  for (const name of ['submission_id', 'surface', 'cohort', 'evaluator_commit', 'geometry_sha256', 'case_sha256', 'protocol_sha256']) {
    if (typeof data[name] !== 'string' || !data[name].trim()) errors.push(`Missing string: ${name}`);
  }
  if (!surfaces.includes(data.surface)) errors.push('surface must identify one of the ten supported surfaces.');
  if (!['current', 'legacy'].includes(data.cohort)) errors.push('cohort must be current or legacy.');
  if (!/^[a-f0-9]{40}$/i.test(data.evaluator_commit ?? '')) errors.push('evaluator_commit must be a 40-character Git commit.');
  for (const name of ['geometry_sha256', 'case_sha256', 'protocol_sha256']) {
    if (!/^[a-f0-9]{64}$/i.test(data[name] ?? '')) errors.push(`${name} must be a 64-character SHA256.`);
  }
  if (!Number.isInteger(data.evaluation_grid) || data.evaluation_grid < 1) errors.push('evaluation_grid must be a positive integer.');
  if (!Array.isArray(data.artifacts) || !data.artifacts.length) errors.push('artifacts must contain at least one artifact.');
  else for (const [index, file] of data.artifacts.entries()) {
    if (!file || typeof file !== 'object' || typeof file.path !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(file.path) || file.path.includes('..') || file.path.includes('//') ||
      !/^[a-f0-9]{64}$/i.test(file.sha256 ?? '')) errors.push(`artifacts[${index}] needs a safe relative path and SHA256.`);
  }
  return errors;
}
