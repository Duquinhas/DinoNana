const TODAY    = new Date();
const DAY_KEY  = `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`;
const DAY_IDX  = Math.floor(TODAY.getTime() / 86400000);
const ANSWER   = DINOS[DAY_IDX % DINOS.length];
 
const P_ORDER  = { "Triássico": 0, "Jurássico": 1, "Cretáceo": 2 };
 
let guesses = [], gameOver = false;
 
// ── Feedback ──────────────────────────────────────────────
function periodCell(g, a) {
  if (g === a) return {cls:'g', icon:'=',  val: g};
  if (Math.abs(P_ORDER[g] - P_ORDER[a]) === 1) return {cls:'y', icon:'~', val: g};
  return {cls:'r', icon:'✕', val: g};
}
 
function boolCell(g, a, label) {
  return {cls: g===a?'g':'r', icon: g===a?'=':'✕', val: label||g};
}
 
function sizeCell(g, a) {
  if (Math.abs(g-a)/a <= 0.1) return {cls:'g', icon:'=', val:g+'m'};
  return {cls:'r', icon: g<a?'↑':'↓', val:g+'m'};
}
 
function taxCells(gp, ap) {
  let ok=true;
  return gp.map((v,i)=>{ 
    if(ok && v===ap[i]) return {v,c:'g'}; 
    ok=false; 
    return {v,c:'r'}; 
  });
}
 
function mkCell(f) {
  return `<div class="cell ${f.cls}">
    <span class="ci">${f.icon}</span>
    <span class="cv">${f.val}</span>
  </div>`;
}
 
function makeRow(dino) {
  const pF = periodCell(dino.period, ANSWER.period);
  const dF = boolCell(dino.diet, ANSWER.diet, dino.diet);
  const sF = sizeCell(dino.size, ANSWER.size);
  const lF = boolCell(dino.loco, ANSWER.loco, dino.loco);
  const rF = boolCell(
    dino.region,
    ANSWER.region,
    dino.region
      .replace('América do Norte','Am. Norte')
      .replace('América do Sul','Am. Sul')
  );
 
  const tax = taxCells(dino.path, ANSWER.path);
  const taxHtml = tax.map(t=>`
    <span class="tm ${t.c}">
      ${t.v.length>13 ? t.v.slice(0,12)+'…' : t.v}
    </span>
  `).join('');
 
  const tr = document.createElement('tr');
  tr.className = 'guess-row';
  tr.innerHTML = `
    <td>
      <div class="dino-name">${dino.common}</div>
      <div class="dino-sci">${dino.name}</div>
    </td>
    <td>${mkCell(pF)}</td>
    <td>${mkCell(dF)}</td>
    <td>${mkCell(sF)}</td>
    <td>${mkCell(lF)}</td>
    <td>${mkCell(rF)}</td>
    <td><div class="tax-row">${taxHtml}</div></td>
  `;
  return tr;
}
 
// ── Stats ─────────────────────────────────────────────────
function loadStats(){
  try { return JSON.parse(localStorage.getItem('dz2_stats')||'{}'); }
  catch { return {}; }
}
 
function saveStats(s){
  try { localStorage.setItem('dz2_stats', JSON.stringify(s)); }
  catch {}
}
 
function updateStats(won,n){
  const s = loadStats();
  s.played = (s.played||0)+1;
 
  if(won){
    s.wins = (s.wins||0)+1;
    s.streak = (s.streak||0)+1;
    s.best = s.best ? Math.min(s.best,n) : n;
  } else {
    s.streak = 0;
  }
 
  s.lastDay = DAY_KEY;
  saveStats(s);
  renderStats(s);
}
 
function renderStats(s){
  s = s || loadStats();
 
  document.getElementById('s-played').textContent = s.played||0;
  document.getElementById('s-wins').textContent   = s.wins||0;
  document.getElementById('s-streak').textContent = s.streak||0;
  document.getElementById('s-best').textContent   = s.best||'—';
}
 
// ── Submit ────────────────────────────────────────────────
function submit(){
  if(gameOver) return;
 
  const inp = document.getElementById('dino-input');
  const val = inp.value.trim();
  const err = document.getElementById('err-msg');
 
  if(!val) return;
 
  const found = DINOS.find(d =>
    d.name.toLowerCase() === val.toLowerCase() ||
    d.common.toLowerCase() === val.toLowerCase()
  );
 
  if(!found){
    err.textContent = `"${val}" não está na lista.`;
    return;
  }
 
  if(guesses.find(g=>g.name===found.name)){
    err.textContent = 'Já tentado!';
    return;
  }
 
  err.textContent = '';
  guesses.push(found);
  inp.value = '';
 
  document.getElementById('ac-list').style.display='none';
 
  const n = guesses.length;
 
  document.getElementById('count-num').textContent = n;
  document.getElementById('progress').style.width = (n/20*100)+'%';
 
  const tbody = document.getElementById('guess-body');
  tbody.insertBefore(makeRow(found), tbody.firstChild);
 
  const win = found.name === ANSWER.name;
 
  if(win || n >= 20){
    gameOver = true;
    document.getElementById('input-area').style.display='none';
    updateStats(win,n);
    // wait for all 7 cell animations to finish before showing result
    setTimeout(() => showResult(win, n), 1150);
  }
}
 
// ── Result ────────────────────────────────────────────────
function showResult(won,n){
  const banner = document.getElementById('result-banner');
 
  banner.style.display='block';
  banner.scrollIntoView({behavior:'smooth',block:'start'});
 
  document.getElementById('result-title').textContent =
    won ? 'Parabéns! 🦕' : 'Fim de jogo!';
 
  document.getElementById('result-sub').innerHTML = won
    ? `Você descobriu o <strong style="color:var(--amber-l)">${ANSWER.common}</strong> em ${n} tentativa${n>1?'s':''}!`
    : `Era o <strong style="color:var(--amber-l)">${ANSWER.common}</strong> <em style="color:var(--muted)">(${ANSWER.name})</em> — ${ANSWER.period} · ${ANSWER.size}m · ${ANSWER.diet}`;
 
  if(ANSWER.img){
    const w = document.getElementById('result-img-wrap');
    w.style.display='flex';
 
    const img = document.createElement('img');
    img.src = ANSWER.img;
    img.alt = ANSWER.common;
    img.className = 'result-img';
 
    img.onerror = ()=>{ w.style.display='none'; };
 
    w.appendChild(img);
  }
 
  document.getElementById('share-btn')
    .addEventListener('click', shareResult);
}
 
// ── Share ─────────────────────────────────────────────────
function shareResult(){
  const E = {g:'🟩',y:'🟨',r:'🟥'};
 
  const lines = guesses.map(d=>{
    const p  = E[periodCell(d.period,ANSWER.period).cls];
    const di = E[boolCell(d.diet,ANSWER.diet).cls];
    const s  = E[sizeCell(d.size,ANSWER.size).cls];
    const l  = E[boolCell(d.loco,ANSWER.loco).cls];
    const r  = E[boolCell(d.region,ANSWER.region).cls];
 
    const tx = taxCells(d.path,ANSWER.path);
    const t  = tx.every(x=>x.c==='g') ? '🟩'
             : tx.some(x=>x.c==='g') ? '🟨'
             : '🟥';
 
    return `${d.common} ${p}${di}${s}${l}${r}${t}`;
  });
 
  const won = guesses[guesses.length-1]?.name === ANSWER.name;
 
  const txt =
`🦕 Dinozooa — ${TODAY.toLocaleDateString('pt-BR')}
${won ? guesses.length : 'X'}/20
 
${lines.join('\n')}`;
 
  navigator.clipboard.writeText(txt).then(()=>{
    document.getElementById('share-copied').textContent = 'Resultado copiado!';
    setTimeout(()=> {
      document.getElementById('share-copied').textContent = '';
    }, 2500);
  });
}
 
// ── Autocomplete ──────────────────────────────────────────
const inp = document.getElementById('dino-input');
const acList = document.getElementById('ac-list');
 
inp.addEventListener('input',()=>{
  const v = inp.value.trim().toLowerCase();
 
  if(!v){
    acList.style.display='none';
    return;
  }
 
  const m = DINOS.filter(d =>
    (d.common.toLowerCase().includes(v) ||
     d.name.toLowerCase().includes(v)) &&
    !guesses.find(g=>g.name===d.name)
  );
 
  if(!m.length){
    acList.style.display='none';
    return;
  }
 
  acList.innerHTML = m.slice(0,9).map(d=>`
    <div class="ac-item" data-name="${d.name}">
      <span>${d.common} <span class="ac-sci">${d.name}</span></span>
      <span class="ac-tag">${d.period} · ${d.size}m</span>
    </div>
  `).join('');
 
  acList.style.display='block';
});
 
acList.addEventListener('click',e=>{
  const item = e.target.closest('.ac-item');
  if(!item) return;
 
  const d = DINOS.find(x=>x.name===item.dataset.name);
  inp.value = d ? d.common : item.dataset.name;
 
  acList.style.display='none';
  inp.focus();
});
 
inp.addEventListener('keydown',e=>{
  if(e.key==='Enter') submit();
  if(e.key==='Escape') acList.style.display='none';
});
 
document.getElementById('guess-btn')
  .addEventListener('click', submit);
 
document.addEventListener('click',e=>{
  if(!acList.contains(e.target) && e.target!==inp){
    acList.style.display='none';
  }
});
 
// init
renderStats();