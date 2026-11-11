import {buildOverall, buildSurface, SURFACES, MATCHED_SURFACES} from './aggregate-model.js';
import {evidenceURL, validateManifest} from './model.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const number = (value,digits=4) => Number.isFinite(value) ? value.toFixed(digits) : '—';
const scientific = value => Number.isFinite(value) ? value.toExponential(3) : '—';
const unitNames = {research_archive:'Research archive',published_reference:'Published references'};
const unitSources = {research_archive:'Curated research designs',published_reference:'Re-evaluated upstream designs'};
const unitClass = id => id==='research_archive'?'ours':'official';
const shortNames={tokamak:'Tokamak',rotating:'Rot. ellipse',Schuett:'Schuett',W7X:'W7-X'};
const descriptions={QA:'Landreman–Paul · quasi-axisymmetric',QH:'Landreman–Paul · quasi-helical',W7X:'Wendelstein 7-X',MUSE:'MUSE stellarator',CFQS:'Chinese First Quasi-axisymmetric Stellarator',HSX:'Helically Symmetric Experiment',NCSX:'National Compact Stellarator Experiment',tokamak:'Circular tokamak',rotating:'Rotating-ellipse surface',Schuett:'Schuett–Henneberg configuration'};
const cohorts={current:'Current references',legacy:'Historical references'};
const sourceNames={agent_warm_start:'Agent warm-start search',retained_historical_design:'Retained historical design',fixed_search:'Fixed search baseline',public_cached_best_geometry_reevaluated:'Re-evaluated published reference',selected_official_reference:'Selected published reference'};
let data, agentData, cohort='current', mode='matched', agentSurface='QA';

function entryHTML(id, subtitle=unitSources[id]) {
  return `<div class="entry"><i class="entry-dot ${unitClass(id)}"></i><div><span class="entry-name">${unitNames[id]}</span><span class="entry-subtitle">${esc(subtitle)}</span></div></div>`;
}
function rankHTML(value) {return value===null?'<span class="rank">—</span>':`<span class="rank ${value===1?'top':''}">${value}</span>`;}
function hardHTML(status) {return `<span class="badge ${status==='PASS'?'':status==='FAIL'?'failed':'pending'}">${status==='PASS'?'PASS':status==='FAIL'?'FAIL':'Pending'}</span>`;}
function softHTML(record) {return record && Number.isInteger(record.soft_pass)?`<span class="badge ${record.soft_pass===9?'full':''}">${record.soft_pass} / ${record.soft_count??9}</span>`:'<span class="dash">—</span>';}

function renderOverall() {
  const model=buildOverall(data,cohort,mode);
  const included=model.aggregation_surface_ids;
  const matched=mode==='matched';
  $('#overall-mode option[value="matched"]').textContent=`Matched surfaces (${MATCHED_SURFACES[cohort].length})`;
  $('#aggregate-note').innerHTML=matched
    ? model.shared_subset_complete
      ? `<strong>Shared-subset preview.</strong> Both entries are averaged over the same ${included.length} verified surfaces. This is not a complete ten-surface or official overall ranking.`
      : `<strong>Shared-subset data is incomplete.</strong> The fixed denominator remains ${included.length} surfaces. No mean or rank is assigned while a required pair is missing.`
    : model.full_ten_complete
      ? '<strong>Full-suite preview.</strong> Both entries are averaged over ten matched, eligible surface results. This is a proposed community aggregate, not an official upstream overall metric.'
      : '<strong>Full-suite ranking is incomplete.</strong> Both entries require ten matched, eligible results. No full-suite average or rank is assigned while required pairs are missing.';
  $('#overall-head').innerHTML=`<tr><th scope="col">#</th><th scope="col">Submission series</th><th scope="col">Mean composite ↑<span class="under-value">${matched?`${included.length} matched surfaces`:'all 10 surfaces'}</span></th><th scope="col">Eligible<span class="under-value">at grid 128</span></th>${SURFACES.map(s=>`<th scope="col" class="task-column"><a href="#surface-${s.id}">${shortNames[s.id]??s.label}${!included.includes(s.id)?' *':''}</a></th>`).join('')}</tr>`;
  $('#overall-body').innerHTML=model.rows.map(row=>`<tr data-unit="${row.unit_id}"><td>${rankHTML(row.rank)}</td><td>${entryHTML(row.unit_id)}</td><td><span class="numeric aggregate-number">${number(row.mean_score)}</span><span class="under-value">${row.rank===null?'Incomplete':matched?'Provisional subset mean':'Full-suite preview mean'}</span></td><td><span class="coverage">${row.eligible_coverage} / 10</span></td>${model.surfaces.map(s=>{
    const r=s.rows.find(x=>x.unit_id===row.unit_id);const eligible=r.eligible_design;
    const shown=eligible?r.score:null;
    const exclude=!included.includes(s.surface)||!s.ranked;
    const tip=exclude?'Outside the matched aggregate or awaiting a comparable pair':`Composite ${number(shown,10)}`;
    return `<td class="task-score numeric ${exclude?'excluded':r.rank===1?'best':''}" title="${esc(tip)}">${number(shown,3)}${exclude&&shown!==null?'*':''}</td>`;
  }).join('')}</tr>`).join('');
  $('#aggregate-formula').textContent=`Equal-weight arithmetic mean · ${matched?'n = '+included.length:'n = 10 required'} · * Excluded from the matched mean or not yet comparable.`;
  $('#snapshot-date').textContent=new Date(data.generated_at_utc).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
}

function surfaceNote(model) {
  if(model.comparison_status==='no_valid_reference')return 'Reference fails a hard constraint. No paired rank is assigned.';
  if(model.comparison_status==='protocol_mismatch')return '64-grid vacuum result only; no matching 128-grid physical reference.';
  if(!model.ranked)return 'A complete, compatible pair is still required for ranking.';
  if(cohort==='legacy'&&['QA','QH','W7X'].includes(model.surface))return 'Matched historical pair; newer warm-start designs await pairing with this reference.';
  return 'Matched physics and protocol · grid 128 × 128';
}
function renderSurfaceBoards() {
  const query=$('#surface-search').value.toLowerCase().trim();
  const selected=SURFACES.filter(s=>`${s.label} ${s.id} ${descriptions[s.id]}`.toLowerCase().includes(query));
  $('#surface-nav').innerHTML=SURFACES.map(s=>`<a href="#surface-${s.id}">${shortNames[s.id]??s.label}</a>`).join('');
  $('#surface-boards').innerHTML=selected.map(s=>{
    const model=buildSurface(data,cohort,s.id);
    const alternative=model.all_soft_alternative;
    return `<section class="surface-card" id="surface-${s.id}" aria-labelledby="title-${s.id}"><header class="surface-card-header"><div><h3 id="title-${s.id}">${s.label}</h3><p>${descriptions[s.id]}</p></div><span class="tag">${model.ranked?'PAIRED · 128':'UNRANKED'}</span></header><div class="table-shell" style="border:0;border-radius:0"><table class="surface-table"><caption class="sr-only">${s.label} ranking by submission series</caption><thead><tr><th scope="col">#</th><th scope="col">Submission series</th><th scope="col">Composite ↑</th><th scope="col">Field error ↓</th><th scope="col">Hard</th><th scope="col">Soft</th><th scope="col"><span class="sr-only">Evidence</span></th></tr></thead><tbody>${model.rows.map(row=>{
      const record=row.record;
      const raw=record?.hard_status==='PASS'?row.score:null;
      const sub=record?sourceNames[record.source_kind]??unitSources[row.unit_id]:'No compatible result';
      return `<tr data-surface="${s.id}" data-unit="${row.unit_id}"><td>${rankHTML(row.rank)}</td><td>${entryHTML(row.unit_id,sub)}</td><td><span class="numeric score-value">${number(raw,6)}</span>${record&&(!row.eligible_design||!model.ranked)?`<span class="under-value">${record.hard_status==='FAIL'?'Ineligible':`${record.grid} × ${record.grid} · unranked`}</span>`:''}</td><td class="numeric">${scientific(row.bn)}</td><td>${hardHTML(row.hard_status)}</td><td>${softHTML(record)}</td><td>${record?`<button class="icon-button" data-record="${esc(record.id)}" aria-label="View ${esc(unitNames[row.unit_id])} ${s.label} evidence">↗</button>`:'—'}</td></tr>`;
    }).join('')}</tbody></table></div><div class="surface-footnote ${model.ranked?'':'warning'}"><span>${surfaceNote(model)}</span>${alternative?`<a href="#" data-record="${esc(alternative.id)}">All-soft option${alternative.source_kind==='fixed_search'?' · fixed search':''} ↗</a>`:''}</div></section>`;
  }).join('');
  $('#empty-search').hidden=selected.length!==0;
}

function renderEvaluation() {
  $('#evaluation-subsets').innerHTML=Object.entries(MATCHED_SURFACES).map(([c,ids])=>`<div><strong>${cohorts[c]} · ${ids.length} surfaces:</strong> ${ids.map(id=>SURFACES.find(s=>s.id===id).label).join(', ')}.</div>`).join('');
}
function renderBoards(){if(!data)return;renderOverall();renderSurfaceBoards();renderEvaluation();}

function englishRecordNote(record) {
  if(record.source_kind==='fixed_search')return 'This all-soft alternative comes from fixed search, not our agent. Its protocol differs from the primary reference; it is not used to calculate a cross-protocol gain.';
  if(record.surface==='Schuett'&&record.grid===64)return 'Vacuum configuration evaluated at grid 64. This record is not ranked against a virtual-casing reference or included in the grid-128 aggregate.';
  if(record.hard_status==='FAIL')return 'This design fails a hard constraint. Its stored scientific score is retained below, but it is not eligible for ranking.';
  return 'This is the score of one saved geometry. Its source, constraint checks and original-report hashes remain attached.';
}
function showRecord(id) {
  const r=data.records.find(r=>r.id===id);if(!r)return;
  $('#detail-title').textContent=`${SURFACES.find(s=>s.id===r.surface)?.label??r.surface} · Design evidence`;
  $('#detail-cohort').textContent=cohorts[r.cohort]??'Research record';
  const source=sourceNames[r.source_kind]??'Re-evaluated design';
  $('#detail-body').innerHTML=`<div class="detail-intro">${englishRecordNote(r)}</div><article class="detail-record"><h3>${esc(source)}</h3><span class="source-label">Record ${esc(r.id)} · ${r.grid} × ${r.grid} evaluation</span><div class="detail-metrics"><span>Composite <strong class="numeric">${number(r.score,10)}</strong></span><span>Field error <strong class="numeric">${scientific(r.bn)}</strong></span><span>Hard ${hardHTML(r.hard_status)}</span><span>Soft ${softHTML(r)}</span></div><p class="detail-note">${r.soft_failures?.length?`Unmet soft targets: ${r.soft_failures.map(esc).join(', ')}.`:r.soft_pass===9?'All nine soft targets are met.':''}</p><div class="evidence">Protocol SHA256<br><code>${esc(r.protocol_sha256)}</code><br>Geometry SHA256<br><code>${esc(r.geometry_sha256)}</code><br>Physical model: ${r.virtual_casing?'virtual casing':'vacuum'}<br>${(r.evidence??[]).map((e,i)=>{const url=evidenceURL(e.relative_path);return url?`<a href="${url}" target="_blank" rel="noreferrer">Metric report ${i+1} ↗</a><code>SHA256 ${esc(e.sha256)}</code>`:'';}).join('<br>')}</div></article>`;
  $('#detail-dialog').showModal();
}

function renderAgents() {
  if(!agentData)return;
  const rows=agentData.rows.filter(r=>r.surface===agentSurface).sort((a,b)=>(b.best128??-Infinity)-(a.best128??-Infinity));
  $('#agent-body').innerHTML=rows.map(r=>`<tr data-agent="${r.id}"><td><span class="entry-name">${esc(r.label_en)}</span><span class="entry-subtitle">${r.method==='fixed'?'Deterministic baseline':r.method.includes('scienceevolve')?'Fixed runtime condition':'GPT-6-Astra'}</span></td><td class="numeric">${number(r.best128,6)}${r.best128===null?'<span class="under-value">No eligible geometry</span>':''}</td><td class="numeric">${scientific(r.bn)}</td><td class="numeric">${r.best_round??'—'}</td><td>${r.hard_pass} / ${r.solver_attempts}</td><td>${r.soft_all}</td><td class="numeric">${Number.isFinite(r.solver_seconds)?(r.solver_seconds/3600).toFixed(2)+' h':'—'}</td></tr>`).join('');
  drawBudget(rows);
}
function drawBudget(rows) {
  const colors=['#208271','#698bb0','#b49464','#9a7c9e'];
  const w=900,h=265,left=66,right=35,top=20,bottom=42;
  const points=rows.flatMap(r=>r.budget_curve).filter(p=>Number.isFinite(p.best128));
  const max=Math.ceil(Math.max(...points.map(p=>p.best128),1)*5)/5+.2;
  const xs=n=>left+(n-6)/18*(w-left-right),ys=v=>h-bottom-v/max*(h-top-bottom);
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Best eligible composite score at 6, 12 and 24 opportunities for each method. Missing results are omitted."><text x="8" y="12" font-size="10" fill="#85969f">Composite</text>`;
  for(let i=0;i<=4;i++){const v=max*i/4,y=ys(v);svg+=`<line x1="${left}" x2="${w-right}" y1="${y}" y2="${y}" stroke="#e9eef1"/><text x="${left-12}" y="${y+4}" text-anchor="end" font-family="Consolas,monospace" font-size="11" fill="#97a5ad">${v.toFixed(1)}</text>`;}
  for(const n of [6,12,24])svg+=`<text x="${xs(n)}" y="${h-18}" font-size="11" text-anchor="middle" fill="#8a9ba5">${n}</text>`;
  rows.forEach((r,i)=>{
    let segment=[];
    const flush=()=>{if(segment.length>1)svg+=`<polyline points="${segment.join(' ')}" fill="none" stroke="${colors[i]}" stroke-width="2.2"/>`;segment=[];};
    for(const p of r.budget_curve){if(!Number.isFinite(p.best128)){flush();continue;}segment.push(`${xs(p.opportunities)},${ys(p.best128)}`);}
    flush();
    for(const p of r.budget_curve.filter(p=>Number.isFinite(p.best128)))svg+=`<circle cx="${xs(p.opportunities)}" cy="${ys(p.best128)}" r="3.5" fill="white" stroke="${colors[i]}" stroke-width="2"><title>${esc(r.label_en)} · ${p.opportunities} opportunities · ${number(p.best128,6)}</title></circle>`;
  });
  $('#budget-chart').innerHTML=svg+'</svg>';
  $('#chart-legend').innerHTML=rows.map((r,i)=>`<span><i style="background:${colors[i]}"></i>${esc(r.label_en)}${r.best128===null?' · no eligible result':''}</span>`).join('');
}

function route() {
  const hash=location.hash.slice(1);const page=['agents','evaluation','submit'].includes(hash)?hash:'leaderboard';
  document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==`page-${page}`);
  document.querySelectorAll('[data-page]').forEach(el=>{el.classList.toggle('active',el.dataset.page===page);if(el.dataset.page===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  if(hash.startsWith('surface-')&&data){
    if($('#surface-search').value){$('#surface-search').value='';renderSurfaceBoards();}
    requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView({block:'start'}));
  } else window.scrollTo({top:0,behavior:'instant'});
}
function drawCoils() {
  let lines='<ellipse cx="130" cy="129" rx="101" ry="13" fill="#f1f5f3"/>';
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2,pts=[];for(let j=0;j<=64;j++){const t=j/64*Math.PI*2,r=64+17*Math.cos(t),x=r*Math.cos(a),y=r*Math.sin(a),z=24*Math.sin(t);pts.push(`${(130+x*1.2+y*.3).toFixed(2)},${(79+y*.46-z).toFixed(2)}`);}lines+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${Math.sin(a)>0?'#6e9b8a':'#b4c9be'}" stroke-width="1" opacity=".85"/>`;}
  $('#coil-visual').innerHTML=lines+'<text x="94" y="160" font-size="6" fill="#8da79b" letter-spacing="1.8">SCHEMATIC</text>';
}

document.querySelectorAll('[data-cohort]').forEach(b=>b.addEventListener('click',()=>{cohort=b.dataset.cohort;document.querySelectorAll('[data-cohort]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderBoards();}));
document.querySelectorAll('[data-agent-surface]').forEach(b=>b.addEventListener('click',()=>{agentSurface=b.dataset.agentSurface;document.querySelectorAll('[data-agent-surface]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderAgents();}));
$('#overall-mode').addEventListener('change',e=>{mode=e.target.value;if(data)renderOverall();});
$('#surface-search').addEventListener('input',()=>{if(data)renderSurfaceBoards();});
$('#surface-boards').addEventListener('click',event=>{const button=event.target.closest('[data-record]');if(button){event.preventDefault();showRecord(button.dataset.record);}});
$('#close-detail').addEventListener('click',()=>$('#detail-dialog').close());
$('#detail-dialog').addEventListener('click',event=>{if(event.target!==$('#detail-dialog'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();});
$('#manifest-file').addEventListener('change',async event=>{
  const file=event.target.files[0],output=$('#validation-result');if(!file)return;
  try{if(file.size>1048576)throw Error('Manifest size exceeds 1 MB.');const manifest=JSON.parse(await file.text());const errors=validateManifest(manifest,SURFACES.map(s=>s.id));output.className=errors.length?'bad':'ok';output.textContent=errors.length?`Manifest validation failed: ${errors.join(' ')}`:'Manifest structure is valid. This does not verify geometry, actual file hashes or scientific results, and does not submit anything.';}catch(error){output.className='bad';output.textContent=`Manifest validation failed: ${error.message}`;}
});
window.addEventListener('hashchange',route);drawCoils();route();
try{
  [data,agentData]=await Promise.all(['data/designs.json','data/agent-comparison.json'].map(url=>fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json();})));
  if(data.cells.length!==20||data.surfaces.length!==10)throw Error('Expected all ten surfaces in both reference cohorts.');
  renderBoards();renderAgents();route();
}catch(error){$('#load-error').hidden=false;$('#load-error').textContent=`Could not load the verified snapshot: ${error.message}. Serve this directory over HTTP.`;}
