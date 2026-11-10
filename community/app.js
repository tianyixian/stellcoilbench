import {comparable, delta, selectedRecord, evidenceURL, validateManifest} from './model.js';

const dict = {
  workspace:['研究工作台','RESEARCH WORKSPACE'], designs:['设计排行榜','Design leaderboard'], agents:['Agent 对照','Agent comparison'], submit:['提交与复评','Submit & evaluate'],
  previewNote:['社区预览 · 待协议共识','Community preview'], previewExplanation:['保留原始评分定义，展示已核验的研究数据。','Original scoring. Traceable research evidence.'], verifiedSnapshot:['核验数据快照','Verified snapshot'], export:['下载数据 ↓','Export data ↓'],
  title:['十种表面，同一套评价原则。','Ten surfaces. One evaluation philosophy.'], subtitle:['查看线圈质量，也看工程约束。新版与旧版参照分别比较，每一项成绩都能追溯到复评证据。','Explore coil quality alongside engineering constraints. Current and historical references stay separate, with evidence behind every result.'],
  basedOn:['基于官方 composite','Official composite scoring'], surfacesLabel:['完整题目','BENCHMARK COVERAGE'], surfacesUnit:['个表面','surfaces'], allSurfaces:['包含全部原始题目','All ten benchmark surfaces'], cohortsLabel:['参照版本','REFERENCE COHORTS'], cohortsUnit:['组独立比较','separate cohorts'], cohortsFoot:['新版参照 / 旧版参照','Current / historical references'],
  coveredLabel:['当前视图 · 128 网格合格方案','THIS COHORT · ELIGIBLE AT 128'], coveredFoot:['完整通过硬约束','Complete hard-constraint checks'], softLabel:['当前视图 · 全软目标方案','THIS COHORT · ALL SOFT TARGETS'], softFoot:['单独记录，不等同于最高分','Recorded separately from top score'], boardTitle:['设计成绩','Design results'], boardDescription:['每题独立比较；综合分越高越好，磁场误差越低越好。','Compare within each surface. Higher score, lower magnetic error.'],
  current:['新版参照','Current references'], legacy:['旧版参照','Historical references'], softOnly:['只选全软目标方案','All-soft candidates only'], surface:['表面 / 题目','SURFACE'], bestDesign:['研究候选 · 最佳分','BEST RESEARCH CANDIDATE'], reference:['选定官方参照','SELECTED REFERENCE'], difference:['综合分变化','SCORE CHANGE'], bn:['磁场误差 Bn ↓','FIELD ERROR Bn ↓'], constraints:['工程约束','CONSTRAINTS'], details:['详情','Details'],
  noResults:['没有匹配的题目。试试 QA、MUSE 或 tokamak。','No matching surface. Try QA, MUSE, or tokamak.'], tableNote:['仅在物理设置、网格与协议匹配时计算差值。','Deltas require matched physics, grid and protocol.'], tableNote2:['缺失结果保留为未验证，不计作零分。','Missing results remain unverified, never zero.'],
  readScores:['怎样读这张表','Reading the results'], readScoresBody:['硬约束决定能否计分。综合分衡量磁场与工程代价的取舍；全软目标通过表示每一项软要求都已满足。两者分别展示。','Hard constraints determine eligibility. Composite score captures field-quality and engineering trade-offs. Meeting every soft target is a separate achievement.'],
  scopeTitle:['这里比较的是保存的设计','A design is not a search strategy'], scopeBody:['历史最好线圈与从头搜索的效率是不同问题。QA、QH、W7-X 的 24 轮搜索轨迹在 Agent 对照中单独展示。','Retained coil quality and search efficiency answer different questions. The 24-opportunity QA, QH and W7-X trajectories have their own comparison.'], seeAgents:['查看 Agent 对照 →','Explore agent comparison →'],
  agentsTitle:['看搜索过程，也看最终成绩。','How well does each system search?'], agentsSubtitle:['QA、QH、W7-X 的固定预算搜索记录，与历史最佳设计榜分开。','A bounded search on QA, QH and W7-X, separate from the retained-design leaderboard.'], agentChartTitle:['各方法保留的最佳合格方案','Best eligible design retained by each method'], agentChartDescription:['同一表面内比较；未获得合格方案时不画分数条。','Within-surface comparison. No eligible geometry means no score bar.'],
  method:['方法','METHOD'], score:['综合分 ↑','SCORE ↑'], bestRound:['最佳轮次','BEST OPPORTUNITY'], hardCount:['合格 / 候选','ELIGIBLE / CANDIDATES'], softCount:['全软目标候选','ALL-SOFT CANDIDATES'], actualSolver:['实际求解','SOLVER TIME'], interpretation:['比较范围','Interpretation'],
  submitTitle:['从一份线圈，到可复核的成绩。','From coil geometry to verifiable results.'], submitSubtitle:['拟议提交流程。当前预览支持本地清单预检，正式提交与远端复评尚未开放。','A proposed workflow. This preview checks manifests locally; remote submissions and re-evaluation are not yet available.'], prepare:['准备产物','Prepare artifacts'], prepareBody:['线圈几何、物理配置、评价器版本和文件哈希。','Coil geometry, physical configuration, evaluator version and file hashes.'], reevaluate:['独立复评','Independent evaluation'], reevaluateBody:['固定环境重算硬约束、九项软指标与综合分。','Recompute hard constraints, nine soft metrics and composite score.'], publish:['展示与追溯','Publish with provenance'], publishBody:['同配置排名，保留原始产物及失败原因。','Compare compatible configurations and retain artifacts and failures.'],
  checkManifest:['检查提交清单','Validate a manifest'], checkBody:['选择 JSON 清单进行结构检查。文件只在当前浏览器读取，不上传，也不运行其中的代码。','Choose a JSON manifest to check its structure. Files stay in your browser; nothing is uploaded or executed.'], chooseManifest:['选择 manifest.json','Choose manifest.json'], downloadExample:['下载清单示例 ↓','Download example ↓'], submissionStatus:['试点的当前范围','What this preview covers'], submissionStatusBody:['覆盖全部十题的新旧参照。公开入口、最终评价协议和维护分工需要与原作者确认；此预览不是上游官方排行榜。','All ten surfaces and both reference cohorts. Public intake, evaluation settings and maintenance remain to be agreed with the author; this is a community preview.'], rule1:['✓ 综合分与各项约束并列','✓ Scores alongside constraint checks'], rule2:['✓ 按参照配置与网格分组','✓ Explicit cohorts and grids'], rule3:['✓ 已有结果的证据摘要','✓ Evidence summaries for each result'], rule4:['○ 远端接收与自动复评待接入','○ Remote intake and evaluation pending'], viewFork:['查看社区 fork ↗','View the community fork ↗'],
  footer:['研究数据预览 · 不代表官方接收或认证排名','Research preview · no official acceptance or ranking claimed'], notComparable:['暂不可比','Not comparable'], noEligible:['暂无合格方案','No eligible design'], noSoft:['暂无全软方案','No all-soft design'], hardPass:['硬约束通过','Hard PASS'], hardFail:['硬约束失败','Hard FAIL'], unknown:['未验证','Unverified'], noReference:['无有效官方对照','No eligible reference'], mismatch:['物理设置未匹配','Physics not matched'], incomplete:['待补充配对复评','Paired evaluation pending'],
  grid:['评价网格','Evaluation grid'], source:['来源','Source'], evidence:['复评证据','Evidence'], protocol:['评价协议 SHA256','Protocol SHA256'], geometry:['线圈几何 SHA256','Geometry SHA256'], fullSoft:['九项软目标全部通过','All nine soft targets met'], scoreLabel:['综合分','Composite'], noComparisonNote:['全软候选可能来自另一搜索方法或评价协议；不满足配对条件时不显示胜负。','An all-soft candidate may come from another method or protocol; a score delta is shown only for a valid pair.'],
  previewValid:['清单结构通过。此检查不读取几何、不核对实际文件哈希，也不代表科学验收或正式提交。','Manifest structure is valid. This does not inspect geometry, verify actual file hashes, certify scientific results, or submit anything.'], previewInvalid:['清单未通过结构检查：','Manifest validation failed:'],
};
let language = 'zh';
try { language = localStorage.getItem('scb-language') === 'en' ? 'en' : 'zh'; } catch {}
let cohort = 'current', agentSurface = 'QA', dataset, agentData;
const $ = selector => document.querySelector(selector);
const t = key => dict[key]?.[language === 'zh' ? 0 : 1] ?? key;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const score = value => Number.isFinite(value) ? value.toFixed(6) : '—';
const bn = value => Number.isFinite(value) ? value.toExponential(3) : '—';
const label = record => {
  if (!record) return '';
  if (record.role === 'official') return language === 'zh' ? '官方参照 · 重新评价' : 'Public reference · re-evaluated';
  const labels = {
    fixed_search:['固定搜索基线','Fixed search'],
    retained_historical_design:['保留的历史设计','Retained historical design'],
    warm_agent_design:['Agent 暖启动','Warm-start agent'],
    agent_warm_start:['Agent 暖启动','Warm-start agent'],
  };
  if (labels[record.source_kind]) return labels[record.source_kind][language === 'zh' ? 0 : 1];
  if (record.label?.includes('warm')) return language === 'zh' ? 'Agent 暖启动' : 'Warm-start agent';
  return language === 'zh' ? '研究候选 · 已复评' : 'Re-evaluated research design';
};
const surfaceInfo = {
  QA:['Landreman–Paul · quasi-axisymmetric','准轴对称'],QH:['Landreman–Paul · quasi-helical','准螺旋对称'],W7X:['Wendelstein 7-X','Wendelstein 7-X'],NCSX:['National Compact Stellarator','紧凑型仿星器'],HSX:['Helically Symmetric Experiment','螺旋对称实验'],CFQS:['Chinese First Quasi-axisymmetric','中国首台准轴对称仿星器'],MUSE:['MUSE stellarator','MUSE 仿星器'],tokamak:['Circular tokamak','圆形托卡马克'],rotating:['Rotating ellipse','旋转椭圆'],Schuett:['Schuett–Henneberg','Schuett–Henneberg']
};
function displaySurface(id) { return ({W7X:'W7-X',tokamak:'Tokamak',rotating:'Rotating ellipse',schuett:'Schuett'})[id] ?? id; }
function surfaceSubtitle(id) { const a=surfaceInfo[id];return a?.[language==='zh'?1:0] ?? id; }
function translate() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
  $('#language-toggle').textContent = language === 'zh' ? 'EN' : '中文';
  $('#surface-search').placeholder = language === 'zh' ? '搜索题目' : 'Find a surface';
  if(dataset) renderDesigns();
  if(agentData) renderAgents();
  route();
}
function route() {
  const page = ['designs','agents','submit'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'designs';
  document.querySelectorAll('.page').forEach(el => el.hidden = el.id !== `page-${page}`);
  document.querySelectorAll('[data-page]').forEach(el => {el.classList.toggle('active',el.dataset.page===page);if(el.dataset.page===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  $('#breadcrumb-page').textContent = t(page);
  document.querySelector('.top-actions a').href = page === 'agents' ? 'data/agent-comparison.json' : page === 'submit' ? 'data/submission-example.json' : 'data/designs.json';
}
function reason(cell) {
  return t(({no_valid_reference:'noReference',protocol_mismatch:'mismatch',incomplete:'incomplete'})[cell.comparison_status] ?? 'notComparable');
}
function constraintHTML(record) {
  if(!record) return `<span class="badge unknown">${t('unknown')}</span>`;
  const hard = record.hard_status;
  return `<span class="badge ${hard==='PASS'?'':hard==='FAIL'?'fail':'unknown'}">${t(hard==='PASS'?'hardPass':hard==='FAIL'?'hardFail':'unknown')}</span><span class="badge ${record.all_soft_pass?'all':'soft'}">${record.soft_pass??'?'}/${record.soft_count??9} ${language==='zh'?'软':'soft'}</span>`;
}
function renderDesigns() {
  const cells = dataset.cells.filter(c=>c.cohort===cohort);
  const allSoft = $('#all-soft-filter').checked;
  const query = $('#surface-search').value.trim().toLowerCase();
  const matches = cells.filter(c => `${c.surface} ${c.label} ${displaySurface(c.surface)} ${surfaceSubtitle(c.surface)}`.toLowerCase().includes(query));
  $('#stat-covered').innerHTML = `${cells.filter(c=>selectedRecord(c,dataset.records)?.hard_status==='PASS').length}<small>/ 10</small>`;
  $('#stat-soft').innerHTML = `${cells.filter(c=>c.best_all_soft_id).length}<small>/ 10</small>`;
  $('#row-count').textContent = `${matches.length} / 10 SURFACES`;
  $('#snapshot-date').textContent = `${language==='zh'?'更新于':'Updated'} ${dataset.generated_at_utc ? new Date(dataset.generated_at_utc).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}) : '2026-11-11'}`;
  $('#design-rows').innerHTML = matches.map((cell,i)=>{
    const r=selectedRecord(cell,dataset.records,allSoft);
    const ref=dataset.records.find(r=>r.id===cell.official_reference_ids?.[0]);
    const gain=delta(r,ref,cell);
    const unpaired = !allSoft && !r ? dataset.records.find(x=>(cell.unpaired_candidate_ids??[]).includes(x.id)) : null;
    const missingLabel = unpaired ? (language==='zh'?'有 64 网格结果，待配对':'64-grid result · pairing pending') : t(allSoft?'noSoft':'noEligible');
    const eligible = r?.hard_status==='PASS' && r.complete;
    const refEligible=ref?.hard_status==='PASS' && ref.complete;
    return `<tr data-cell="${esc(cell.id)}"><td><div class="surface-name"><span class="surface-symbol" aria-hidden="true">${['◉','◎','◌','⊙','◍'][i%5]}</span><div><strong>${esc(displaySurface(cell.surface))}</strong><small>${esc(surfaceSubtitle(cell.surface))}</small></div></div></td><td><span class="numeric score-primary">${eligible?score(r.score):'—'}</span><small class="subvalue">${r?esc(label(r)):missingLabel}</small></td><td><span class="numeric score-reference">${refEligible?score(ref.score):'—'}</span><small class="subvalue">${refEligible?`${ref.grid} × ${ref.grid}`:t('noReference')}</small></td><td><span class="delta ${gain===null?'neutral':gain>=0?'positive':'negative'}">${gain===null?'—':`${gain>0?'+':''}${gain.toFixed(2)}%`}</span>${gain===null?`<small class="subvalue">${esc(allSoft&&r&&!comparable(r,ref)?t('notComparable'):reason(cell))}</small>`:''}</td><td><span class="numeric">${eligible?bn(r.bn):'—'}</span>${r?`<small class="subvalue">${r.grid} × ${r.grid}</small>`:''}</td><td>${constraintHTML(r??unpaired)}${unpaired?'<small class="subvalue">64 × 64</small>':''}</td><td><button class="row-details" data-detail="${esc(cell.id)}" aria-label="${esc(displaySurface(cell.surface)+' '+t('details'))}">↗</button></td></tr>`;
  }).join('');
  $('#empty-search').hidden=matches.length>0;
  document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',()=>showDetail(button.dataset.detail)));
}
function showDetail(id) {
  const cell=dataset.cells.find(c=>c.id===id);
  if(!cell)return;
  $('#detail-title').textContent=displaySurface(cell.surface);
  $('#detail-cohort').textContent=`${t(cell.cohort==='current'?'current':'legacy')} · ${t('details')}`;
  const ids=[cell.best_ours_id,...(cell.official_reference_ids??[]),cell.best_all_soft_id,...(cell.record_ids??[]),...(cell.historical_record_ids??[])].filter(Boolean);
  const records=[...new Set(ids)].map(id=>dataset.records.find(r=>r.id===id)).filter(Boolean);
  $('#detail-body').innerHTML=`<div class="detail-intro">${esc(cell.reason ?? cell.comparison_basis ?? '')}<br>${t('noComparisonNote')}</div>`+records.map(r=>`<article class="detail-record"><h3>${esc(label(r))} <span class="subvalue">${esc(r.label)} · ${r.grid} × ${r.grid}</span></h3><div class="detail-metrics"><span>${t('scoreLabel')} <strong class="numeric">${score(r.score)}</strong></span><span>Bn <strong class="numeric">${bn(r.bn)}</strong></span><span>${constraintHTML(r)}</span></div>${r.note?`<p class="evidence">${esc(r.note)}</p>`:''}<div class="evidence">${t('protocol')}<br><code>${esc(r.protocol_sha256??'—')}</code><br>${t('geometry')}<br><code>${esc(r.geometry_sha256??'—')}</code></div><div class="evidence">${(r.evidence??[]).map((e,i)=>{const url=evidenceURL(e.relative_path);return url?`<a href="${esc(url)}" target="_blank" rel="noreferrer">${t('evidence')} ${i+1} ↗</a><code>SHA256 ${esc(e.sha256)}</code>`:'';}).join('<br>')}</div></article>`).join('');
  $('#detail-dialog').showModal();
}
function renderAgents() {
  const rows=agentData.rows.filter(r=>r.surface===agentSurface);
  const max=Math.max(...rows.map(r=>r.best128??0),1)*1.08;
  const scope=language==='zh'?'每个方法最多 24 次 × 600 秒求解机会。官方策略适配器额外获得完整基线建议；这是一条搜索轨迹，不能推断普遍的框架优越性。':'Up to 24 × 600 solver-seconds per method. The official-policy adapter receives additional baseline advice. One trajectory does not establish general framework superiority.';
  $('#agent-scope').textContent=scope;
  $('#agent-chart').innerHTML=rows.map(r=>`<div class="chart-row"><span class="chart-label">${esc(language==='zh'?r.label:r.label_en)}</span><div class="chart-track">${Number.isFinite(r.best128)?`<div class="chart-bar ${r.method==='ours_astra'?'ours':''}" style="width:${r.best128/max*100}%"></div>`:`<span class="chart-none">${t('noEligible')}</span>`}</div><span class="numeric">${score(r.best128)}</span></div>`).join('');
  $('#agent-rows').innerHTML=rows.map(r=>`<tr><td>${esc(language==='zh'?r.label:r.label_en)}</td><td class="numeric">${score(r.best128)}</td><td class="numeric">${r.best_round??'—'}</td><td>${r.hard_pass} / ${r.solver_attempts}</td><td>${r.soft_all}</td><td class="numeric">${Number.isFinite(r.solver_seconds)?`${(r.solver_seconds/3600).toFixed(2)} h`:'—'}</td></tr>`).join('');
  const notes=language==='zh'?[
    '这里的“官方”是本地官方策略适配器，不是作者公开榜单的全部历史设计。',
    '最多 24 次机会的预算相同，实际求解时长、模型调用、token 与端到端耗时并不相同。',
    '完整论文范围为 240 次机会、218 份候选：151 份硬约束通过，67 份不通过。另有 21 次方法未启动、1 次行政 UNKNOWN，均保留。',
    '我们的控制器在 QH 第 19 次机会首次获得合格解，第 23 次达到自身本批最佳。没有合格几何的条件保持“无合格方案”。',
    'ScienceEvolve 只测试固定运行时替换；这不是其不受限工作流演化能力的完整评估。',
    '唯一全软通过候选来自 QA 固定搜索，分数 1.713696；它不是该方法最高综合分的那份几何。'
  ]:[
    '“Official” denotes a local official-policy adapter, not the full archive of published designs.',
    'The solver-opportunity caps match. Actual solver work, model calls, tokens and wall time do not.',
    'Manuscript scope: 240 opportunities, 218 candidates, 151 hard passes and 67 hard failures. Another 21 method failures and one administrative UNKNOWN are retained.',
    'Our controller first finds an eligible QH design at opportunity 19 and reaches its own best at 23. No eligible geometry is reported as missing, not as a competitive zero.',
    'The ScienceEvolve condition tests a fixed runtime substitution, not unrestricted workflow evolution.',
    'The sole all-soft candidate is a separate fixed-search QA design scoring 1.713696, not its best composite design.'
  ];
  $('#agent-notes').innerHTML=notes.map(n=>`<li>${esc(n)}</li>`).join('');
}
function drawCoils() {
  let paths='';
  for(let ring=0;ring<20;ring++) {
    const angle=ring/20*Math.PI*2;const points=[];
    for(let j=0;j<=64;j++) {
      const t=j/64*Math.PI*2,r=70+19*Math.cos(t),x=r*Math.cos(angle),y=r*Math.sin(angle),z=27*Math.sin(t);
      points.push(`${(150+x*1.38+y*.22).toFixed(2)},${(89+y*.44-z).toFixed(2)}`);
    }
    paths+=`<polyline points="${points.join(' ')}" fill="none" stroke="${Math.sin(angle)>0?'#719381':'#b6cbb9'}" stroke-width="1.05" opacity=".8"/>`;
  }
  $('#coil-visual').innerHTML=`<ellipse cx="150" cy="140" rx="110" ry="13" fill="#e9efe9" opacity=".6"/><path d="M20 149H280 M150 20V158" stroke="#e0e8e1" stroke-dasharray="3 4"/>${paths}<text x="18" y="172" fill="#a1b3a6" font-size="7" letter-spacing="1.8">SCHEMATIC</text><text x="241" y="172" fill="#a1b3a6" font-size="7">φ / θ</text>`;
}
document.querySelectorAll('[data-cohort]').forEach(button=>button.addEventListener('click',()=>{cohort=button.dataset.cohort;document.querySelectorAll('[data-cohort]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(dataset)renderDesigns();}));
document.querySelectorAll('[data-agent-surface]').forEach(button=>button.addEventListener('click',()=>{agentSurface=button.dataset.agentSurface;document.querySelectorAll('[data-agent-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(agentData)renderAgents();}));
$('#surface-search').addEventListener('input',()=>dataset&&renderDesigns());
$('#all-soft-filter').addEventListener('change',()=>dataset&&renderDesigns());
$('#language-toggle').addEventListener('click',()=>{language=language==='zh'?'en':'zh';try{localStorage.setItem('scb-language',language);}catch{}translate();});
$('#close-detail').addEventListener('click',()=>$('#detail-dialog').close());
$('#detail-dialog').addEventListener('click',e=>{if(e.target===$('#detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
window.addEventListener('hashchange',route);
$('#manifest-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  const output=$('#validation-result');output.replaceChildren();
  try {
    if(file.size>1024*1024)throw Error(language==='zh'?'清单不得大于 1 MB。':'Manifest size exceeds 1 MB.');
    const data=JSON.parse(await file.text());
    const errors=validateManifest(data,dataset.surfaces.map(s=>s.id));
    output.className=errors.length?'bad':'ok';
    output.textContent=errors.length?`${t('previewInvalid')} ${errors.join(' ')}`:t('previewValid');
  }catch(error){output.className='bad';output.textContent=`${t('previewInvalid')} ${error.message}`;}
});
drawCoils();translate();
try {
  const responses=await Promise.all(['data/designs.json','data/agent-comparison.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json();})));
  [dataset,agentData]=responses;
  if(dataset.cells.length!==20 || dataset.surfaces.length!==10)throw Error('Expected 20 cohort/surface cells and ten surfaces.');
  renderDesigns();renderAgents();
} catch(error) {
  $('#load-error').hidden=false;$('#load-error').textContent=language==='zh'?`数据未加载：${error.message}。请通过本地 HTTP 预览打开页面。`:`Could not load data: ${error.message}. Open this site through a local HTTP server.`;
}
