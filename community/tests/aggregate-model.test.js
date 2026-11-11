import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildOverall, buildSurface, MATCHED_SURFACES, SURFACES, UNITS} from '../aggregate-model.js';

const data = JSON.parse(readFileSync(new URL('../data/designs.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(data);
const unit = (model, id) => model.rows.find(row => row.unit_id === id);
const oursId = (d, cohort='current', surface='QA') => d.cells.find(cell => cell.cohort === cohort && cell.surface === surface).best_ours_id;
const mutateOurs = (d, change) => Object.assign(d.records.find(row => row.id === oursId(d)), change);

test('Both overview cohorts retain all ten surfaces and two archive units', () => {
  for (const cohort of ['current', 'legacy']) {
    const result = buildOverall(data, cohort);
    assert.equal(result.surfaces.length, 10);
    assert.deepEqual(result.surfaces.map(row=>row.surface), SURFACES.map(row=>row.id));
    assert.equal(result.rows.length, 2);
    assert.equal(result.unit_kind, 'curated_design_archives');
    assert.equal(result.official_ranking, false);
    assert.equal(result.equal_budget_agent_comparison, false);
    assert.ok(result.rows.every(row => row.full_ten_rank === null && row.full_ten_mean === null));
  }
});

test('Current eight and legacy nine use exactly the same declared denominator for both units', () => {
  for (const cohort of ['current','legacy']) {
    const result = buildOverall(data, cohort);
    assert.equal(result.shared_subset_complete, true);
    for (const row of result.rows) {
      assert.equal(row.shared_required, MATCHED_SURFACES[cohort].length);
      assert.deepEqual(row.compared_surface_ids, MATCHED_SURFACES[cohort]);
      const selected = result.surfaces.filter(s => MATCHED_SURFACES[cohort].includes(s.surface));
      const expected = selected.reduce((sum,s) => sum + unit(s,row.unit_id).score,0) / selected.length;
      assert.equal(row.mean_comparable_composite, expected);
      assert.equal(row.rank_status, 'provisional_shared_subset');
    }
    const research = unit(result,'research_archive');
    assert.equal(research.wins, cohort === 'current' ? 6 : 7);
    assert.equal(research.losses, 2);
  }
});

test('Full-ten mode is unranked without imputing unavailable tasks as zero', () => {
  for (const cohort of ['current','legacy']) {
    const result = buildOverall(data,cohort,'all10');
    assert.equal(result.rank_scope,'unranked');
    assert.equal(result.full_ten_status,'unranked');
    for (const row of result.rows) {
      assert.equal(row.rank,null);
      assert.equal(row.mean_score,null);
      assert.equal(row.full_ten_mean,null);
      assert.ok(row.mean_comparable_composite > 0);
    }
  }
});

test('One missing shared record invalidates both subset means instead of shrinking coverage', () => {
  const d=clone(); d.records=d.records.filter(row=>row.id!==oursId(d));
  const result=buildOverall(d,'current');
  assert.equal(result.shared_subset_complete,false);
  assert.deepEqual(result.unavailable_surface_ids,['QA']);
  for(const row of result.rows) {
    assert.equal(row.shared_required,8);
    assert.equal(row.shared_coverage,7);
    assert.equal(row.mean_score,null);
    assert.equal(row.mean_comparable_composite,null);
    assert.equal(row.rank,null);
    assert.equal(row.wins,null);
  }
});

test('Only complete 128-grid same-protocol same-physics hard-PASS pairs rank', () => {
  for(const change of [{grid:64},{protocol_sha256:'b'.repeat(64)},{virtual_casing:true},
      {hard_status:'FAIL'},{hard_status:'UNKNOWN'},{complete:false},{hard_count:2},
      {hard_pass:2},{soft_count:8},{soft_pass:null},{score:null},{score:NaN},
      {cohort:'legacy'},{surface:'QH'},{protocol_sha256:null}]) {
    const d=clone(); mutateOurs(d,change);
    const result=buildSurface(d,'current','QA');
    assert.equal(result.ranked,false,JSON.stringify(change));
    assert.ok(result.rows.every(row=>row.rank===null && row.eligible_score===null));
  }
});

test('Rotating positive-versus-failed-zero records remain visible and unranked', () => {
  for (const cohort of ['current','legacy']) {
    const result=buildSurface(data,cohort,'rotating');
    assert.equal(result.comparison_status,'no_valid_reference');
    assert.ok(unit(result,'research_archive').score>0);
    assert.equal(unit(result,'published_reference').score,0);
    assert.equal(unit(result,'published_reference').hard_status,'FAIL');
    assert.equal(result.delta_percent,null);
    assert.ok(result.rows.every(row=>row.rank===null));
  }
});

test('Current Schuett retains the 64-only observation without pretending it is a128 ranking', () => {
  const result=buildSurface(data,'current','Schuett');
  assert.equal(result.comparison_status,'protocol_mismatch');
  assert.equal(unit(result,'research_archive').grid,64);
  assert.equal(unit(result,'research_archive').eligible_design,false);
  assert.equal(unit(result,'research_archive').rank,null);
  assert.equal(unit(result,'published_reference').record,null);
});

test('Soft misses do not invalidate hard eligibility; alternative geometry never replaces highest score', () => {
  const result=buildSurface(data,'current','QA');
  assert.equal(result.ranked,true);
  assert.equal(unit(result,'research_archive').soft_pass,8);
  assert.equal(unit(result,'research_archive').score,1.8751395256941918);
  assert.equal(result.all_soft_alternative.source_kind,'fixed_search');
  assert.equal(result.all_soft_alternative.soft_pass,9);
  assert.notEqual(result.all_soft_alternative.id,unit(result,'research_archive').record.id);
  const ncsx=buildSurface(data,'current','NCSX');
  assert.ok(ncsx.all_soft_alternative.score<unit(ncsx,'research_archive').score);
});

test('Duplicate IDs, duplicate cells and ambiguous reference selections fail closed', () => {
  const duplicate=clone(); duplicate.records.push({...duplicate.records.find(row=>row.id===oursId(duplicate))});
  assert.equal(buildSurface(duplicate,'current','QA').ranked,false);
  const cells=clone(); cells.cells.push({...cells.cells.find(row=>row.id==='current_QA')});
  assert.equal(buildSurface(cells,'current','QA').ranked,false);
  const refs=clone(); refs.cells.find(row=>row.id==='current_QA').official_reference_ids.push('unselected');
  assert.equal(buildSurface(refs,'current','QA').ranked,false);
});

test('Exact ties are ties; inputs remain immutable', () => {
  const d=clone(); const cell=d.cells.find(row=>row.id==='current_QA');
  const reference=d.records.find(row=>row.id===cell.official_reference_ids[0]);
  mutateOurs(d,{score:reference.score}); const before=JSON.stringify(d);
  const result=buildSurface(d,'current','QA');
  assert.deepEqual(result.rows.map(row=>row.rank),[1,1]);
  assert.equal(result.delta_percent,0);
  assert.equal(unit(buildOverall(d,'current'),'research_archive').ties,1);
  assert.equal(JSON.stringify(d),before);
});

test('A fully paired ten-task fixture can rank; stale stored outcome/delta never drives arithmetic', () => {
  const d=clone();
  // Synthetic fixture only: do not write these altered values to real evidence.
  for(const surface of ['rotating','Schuett']) {
    const cell=d.cells.find(row=>row.cohort==='current' && row.surface===surface);
    const template=d.records.find(row=>row.id===oursId(d));
    const candidate={...template,id:`fixture_${surface}_ours`,surface,score:1.5};
    const reference={...template,id:`fixture_${surface}_reference`,surface,score:1.4};
    d.records.push(candidate,reference);
    cell.best_ours_id=candidate.id;cell.official_reference_ids=[reference.id];
    cell.comparison_status='comparable';cell.outcome='LOSE';cell.score_delta_percent=-99;
  }
  const result=buildOverall(d,'current','all10');
  assert.equal(result.full_ten_complete,true);
  assert.equal(result.aggregation_surface_ids.length,10);
  assert.ok(result.rows.every(row=>Number.isFinite(row.full_ten_mean) && row.full_ten_rank>0));
  const rotating=buildSurface(d,'current','rotating');
  assert.equal(unit(rotating,'research_archive').rank,1);
  assert.ok(Math.abs(rotating.delta_percent-(1.5/1.4-1)*100)<1e-10);
});

test('Unexpected cohort/mode/surface is rejected; all output labels and explanations are English', () => {
  assert.throws(()=>buildOverall(data,'other'),RangeError);
  assert.throws(()=>buildOverall(data,'current','available'),RangeError);
  assert.throws(()=>buildSurface(data,'current','unknown'),RangeError);
  assert.equal(UNITS.length,2);
  for (const cohort of ['current','legacy']) assert.doesNotMatch(JSON.stringify(buildOverall(data,cohort)),/[\u3400-\u9fff]/);
});

// Optional console-only sample: no extra files, private paths or raw records.
if(process.argv.includes('--sample')) {
  console.log(JSON.stringify(['current','legacy'].map(cohort=>{
    const result=buildOverall(data,cohort);
    return {cohort,rank_scope:result.rank_scope,full_ten_status:result.full_ten_status,
      compared_surface_ids:result.fixed_matched_surface_ids,rows:result.rows};
  }),null,2));
}
