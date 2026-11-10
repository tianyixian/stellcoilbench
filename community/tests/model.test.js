import test from 'node:test';
import assert from 'node:assert/strict';
import {comparable,delta,evidenceURL,validateManifest} from '../model.js';

const reference={complete:true,hard_status:'PASS',score:1,protocol_sha256:'a'.repeat(64),grid:128,cohort:'current',surface:'QA'};
const candidate={...reference,score:1.1};
test('A delta requires complete hard-passing matched scientific settings',()=>{
  assert.ok(comparable(candidate,reference));
  assert.ok(Math.abs(delta(candidate,reference,{comparison_status:'comparable'})-10)<1e-10);
  for(const change of [{grid:64},{protocol_sha256:'b'.repeat(64)},{hard_status:'FAIL'},{hard_status:'UNKNOWN'},{score:null},{complete:false},{cohort:'legacy'},{surface:'QH'}])assert.equal(comparable({...candidate,...change},reference),false);
  assert.equal(delta(candidate,reference,{comparison_status:'protocol_mismatch'}),null);
  assert.equal(delta(null,reference,{comparison_status:'comparable'}),null);
  assert.equal(comparable(candidate,{...reference,score:0}),false);
});
test('Evidence links cannot escape the packaged data or execute URLs',()=>{
  assert.equal(evidenceURL('evidence/report_a.json'),'data/evidence/report_a.json');
  for(const path of ['../report.json','evidence/../../report.json','https://example.com/a.json','javascript:alert(1)','evidence/a.json?redirect=/'])assert.equal(evidenceURL(path),null);
});
test('Manifest validation rejects traversal and incomplete provenance',()=>{
  const good={submission_id:'demo',surface:'QA',cohort:'current',evaluator_commit:'a'.repeat(40),geometry_sha256:'b'.repeat(64),case_sha256:'c'.repeat(64),protocol_sha256:'d'.repeat(64),evaluation_grid:128,artifacts:[{path:'coils.json',sha256:'b'.repeat(64)}]};
  assert.deepEqual(validateManifest(good,['QA']),[]);
  assert.ok(validateManifest({...good,protocol_sha256:null},['QA']).length);
  assert.ok(validateManifest({...good,artifacts:[{path:'../coils.json',sha256:'b'.repeat(64)}]},['QA']).length);
  assert.ok(validateManifest({...good,surface:'not-real'},['QA']).length);
});
