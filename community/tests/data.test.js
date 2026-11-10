import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {comparable, delta, evidenceURL} from '../model.js';
const base=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,base),'utf8'));
const data=read('data/designs.json');
test('Published snapshot retains every surface and both cohorts with real evidence',()=>{
  assert.equal(data.surfaces.length,10);
  assert.equal(data.cells.length,20);
  assert.equal(new Set(data.cells.map(c=>c.id)).size,20);
  for(const cohort of ['current','legacy'])assert.deepEqual(data.cells.filter(c=>c.cohort===cohort).map(c=>c.surface).sort(),data.surfaces.map(s=>s.id).sort());
  for(const record of data.records)for(const evidence of record.evidence){
    const path=evidenceURL(evidence.relative_path);assert.ok(path);
    assert.equal(createHash('sha256').update(readFileSync(new URL(path,base))).digest('hex'),evidence.sha256);
  }
  for(const cell of data.cells){
    const candidate=data.records.find(r=>r.id===cell.best_ours_id);
    const reference=data.records.find(r=>r.id===cell.official_reference_ids[0]);
    if(cell.comparison_status==='comparable'){
      assert.ok(comparable(candidate,reference),cell.id);
      assert.ok(Math.abs(delta(candidate,reference,cell)-cell.score_delta_percent)<1e-9,cell.id);
    }else assert.equal(delta(candidate,reference,cell),null);
    if(cell.best_all_soft_id){const soft=data.records.find(r=>r.id===cell.best_all_soft_id);assert.equal(soft.soft_pass,9);assert.equal(soft.hard_status,'PASS');}
  }
});
test('Agent experiment has the ten manuscript arms and fully accounted opportunities',()=>{
  const data=read('data/agent-comparison.json');
  assert.equal(data.rows.length,10);
  assert.equal(data.rows.reduce((s,r)=>s+r.attempts,0),240);
  assert.equal(data.rows.reduce((s,r)=>s+r.solver_attempts,0),218);
  for(const r of data.rows){assert.equal(r.solver_attempts,r.hard_pass+r.hard_fail);assert.equal(r.attempts,r.solver_attempts+r.method_failure+r.unstarted_infrastructure_unknown);}
});
