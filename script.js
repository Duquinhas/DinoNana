/* ═══════════════════════════════════════════════════════════
   GLOBALS
═══════════════════════════════════════════════════════════ */
const TODAY   = new Date();
const DAY_KEY = `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`;
const DAY_IDX = Math.floor(TODAY.getTime() / 86400000);
 
// Classic answer
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;  // ← era 0xffffffff, troque por 0x100000000
  };
}

function pickDaily(seed) {
  const rand = seededRand(seed);
  const pool = [...DINOS];
  for(let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool[DAY_IDX % pool.length];
}
console.log('DINOS:', DINOS);
const ANSWER      = pickDaily(DAY_IDX * 7 + 1);
const FOTO_ANSWER = pickDaily(DAY_IDX * 7 + 2);
 
const P_ORDER = { "Triássico": 0, "Jurássico": 1, "Cretáceo": 2 };
 
// Blur levels: index = number of wrong guesses (0–10)
const BLUR_LEVELS = [18,14,13,12, 11, 10, 8,5, 3, 1, 0];
const BLUR_LABELS = [
  "Máximo desfoque — boa sorte!",
  "Quase nada ainda...",
  "Uma silhueta?",
  "Algo está aparecendo",
  "Ficando um pouco mais claro",
  "Você consegue adivinhar?",
  "Metade do caminho",
  "Está ficando nítido",
  "Quase revelado!",
  "Última chance!",
  "Revelado!"
];
 
/* ═══════════════════════════════════════════════════════════
   TAB SWITCHER
═══════════════════════════════════════════════════════════ */
function switchTab(tab) {
  document.getElementById('game-classic').style.display = tab === 'classic' ? '' : 'none';
  document.getElementById('game-foto').style.display    = tab === 'foto'    ? '' : 'none';
  document.getElementById('tab-classic').classList.toggle('active', tab === 'classic');
  document.getElementById('tab-foto').classList.toggle('active', tab === 'foto');
}
 
/* ═══════════════════════════════════════════════════════════
   CLASSIC GAME
═══════════════════════════════════════════════════════════ */
let guesses = [], gameOver = false;
 
// ── Feedback helpers ──────────────────────────────────────
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
    dino.region, ANSWER.region,
    dino.region
      .replace('América do Norte','Am. Norte')
      .replace('América do Sul','Am. Sul')
  );
  const tax = taxCells(dino.path, ANSWER.path);
  const taxHtml = tax.map(t=>`
    <span class="tm ${t.c}">${t.v.length>13 ? t.v.slice(0,12)+'…' : t.v}</span>
  `).join('');

  const thumbHtml = dino.imgClassic
    ? `<img class="dino-thumb" src="${dino.imgClassic}" alt="" onerror="this.style.display='none'"/>`
    : '';

  // ── Linha de tabela (desktop) ─────────────────────────────
  const tr = document.createElement('tr');
  tr.className = 'guess-row';
  tr.innerHTML = `
    <td>
      ${thumbHtml}
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

  // ── Card (mobile) ─────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'guess-card';
  card.innerHTML = `
    <div class="gc-header">
      ${thumbHtml ? `<div class="gc-thumb">${thumbHtml}</div>` : ''}
      <div class="gc-names">
        <div class="dino-name">${dino.common}</div>
        <div class="dino-sci">${dino.name}</div>
      </div>
    </div>
    <div class="gc-grid">
      <div class="gc-row"><span class="gc-label">Período</span>${mkCell(pF)}</div>
      <div class="gc-row"><span class="gc-label">Dieta</span>${mkCell(dF)}</div>
      <div class="gc-row"><span class="gc-label">Tamanho</span>${mkCell(sF)}</div>
      <div class="gc-row"><span class="gc-label">Locomoção</span>${mkCell(lF)}</div>
      <div class="gc-row"><span class="gc-label">Região</span>${mkCell(rF)}</div>
      <div class="gc-row"><span class="gc-label">Família</span><div class="tax-row">${taxHtml}</div></div>
    </div>
  `;

  // Retorna os dois — CSS decide qual mostrar
  return { tr, card };
}
 
// ── Stats ─────────────────────────────────────────────────
function loadStats() {
  try { return JSON.parse(localStorage.getItem('dz2_stats')||'{}'); } catch { return {}; }
}
function saveStats(s) {
  try { localStorage.setItem('dz2_stats', JSON.stringify(s)); } catch {}
}
function updateStats(won,n) {
  const s = loadStats();
  s.played = (s.played||0)+1;
  if(won) {
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
function renderStats(s) {
  s = s || loadStats();
  document.getElementById('s-played').textContent = s.played||0;
  document.getElementById('s-wins').textContent   = s.wins||0;
  document.getElementById('s-streak').textContent = s.streak||0;
  document.getElementById('s-best').textContent   = s.best||'—';
}
// ── Persistência do estado do jogo clássico ───────────────
function classicSaveState(won) {
  try {
    localStorage.setItem('dz2_state', JSON.stringify({
      day: DAY_KEY,
      guesses: guesses.map(g => g.name),
      gameOver,
      won
    }));
  } catch {}
}

function classicRestoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem('dz2_state') || 'null');
    if (!saved || saved.day !== DAY_KEY) return; // dia diferente, jogo novo

    saved.guesses.forEach(name => {
      const dino = DINOS.find(d => d.name === name);
      if (!dino) return;
      guesses.push(dino);
      const { tr, card } = makeRow(dino);
      tr.querySelectorAll('td').forEach(td => td.style.animation = 'none');
      document.getElementById('guess-body').insertBefore(tr, document.getElementById('guess-body').firstChild);
      card.style.animation = 'none';
      document.getElementById('cards-body').insertBefore(card, document.getElementById('cards-body').firstChild);
    });

    const n = guesses.length;
    document.getElementById('count-num').textContent = n;
    document.getElementById('progress').style.width = (n / 20 * 100) + '%';

    if (saved.gameOver) {
      gameOver = true;
      document.getElementById('input-area').style.display = 'none';
      showResult(saved.won, n);
    }
  } catch {}
}
 
// ── Submit ────────────────────────────────────────────────
function submit() {
  if(gameOver) return;
  const inp = document.getElementById('dino-input');
  const val = inp.value.trim();
  const err = document.getElementById('err-msg');
  if(!val) return;
 
  const found = DINOS.find(d =>
    d.name.toLowerCase() === val.toLowerCase() ||
    d.common.toLowerCase() === val.toLowerCase()
  );
  if(!found) { err.textContent = `"${val}" não está na lista.`; return; }
  if(guesses.find(g=>g.name===found.name)) { err.textContent = 'Já tentado!'; return; }
 
  err.textContent = '';
  guesses.push(found);
  inp.value = '';
  document.getElementById('ac-list').style.display='none';
 
  const n = guesses.length;
  document.getElementById('count-num').textContent = n;
  document.getElementById('progress').style.width = (n/20*100)+'%';

  const { tr, card } = makeRow(found);
  document.getElementById('guess-body').insertBefore(tr, document.getElementById('guess-body').firstChild);
  document.getElementById('cards-body').insertBefore(card, document.getElementById('cards-body').firstChild);
 
  const win = found.name === ANSWER.name;
  if(win || n >= 20) {
    gameOver = true;
    document.getElementById('input-area').style.display='none';
    updateStats(win,n);
     classicSaveState(win);
    setTimeout(() => showResult(win, n), 2000);
  }
}
 
// ── Result ────────────────────────────────────────────────
function showResult(won,n) {
  const banner = document.getElementById('result-banner');
  banner.style.display='block';
  banner.scrollIntoView({behavior:'smooth',block:'start'});
  document.getElementById('result-title').textContent = won ? 'Parabéns! 🦕' : 'Fim de jogo!';
  document.getElementById('result-sub').innerHTML = won
    ? `Você descobriu o <strong style="color:var(--amber-l)">${ANSWER.common}</strong> em ${n} tentativa${n>1?'s':''}!`
    : `Era o <strong style="color:var(--amber-l)">${ANSWER.common}</strong> <em style="color:var(--muted)">(${ANSWER.name})</em> — ${ANSWER.period} · ${ANSWER.size}m · ${ANSWER.diet}`;
 
  const w = document.getElementById('result-img-wrap');
  w.innerHTML = '<span style="color:var(--muted);font-size:12px">Carregando imagem…</span>';
  w.style.display = 'flex';
 
 w.innerHTML = '';
  const img = document.createElement('img');
  img.src = ANSWER.imgClassic;
  img.alt = ANSWER.common;
  img.className = 'result-img';
  img.onerror = () => { w.style.display = 'none'; };
  w.appendChild(img);
  document.getElementById('share-btn').addEventListener('click', shareResult);
}
 
// ── Share ─────────────────────────────────────────────────
function shareResult() {
  const E = {g:'🟩',y:'🟨',r:'🟥'};
  const lines = guesses.map(d=>{
    const p  = E[periodCell(d.period,ANSWER.period).cls];
    const di = E[boolCell(d.diet,ANSWER.diet).cls];
    const s  = E[sizeCell(d.size,ANSWER.size).cls];
    const l  = E[boolCell(d.loco,ANSWER.loco).cls];
    const r  = E[boolCell(d.region,ANSWER.region).cls];
    const tx = taxCells(d.path,ANSWER.path);
    const t  = tx.every(x=>x.c==='g') ? '🟩' : tx.some(x=>x.c==='g') ? '🟨' : '🟥';
    return `${d.common} ${p}${di}${s}${l}${r}${t}`;
  });
  const won = guesses[guesses.length-1]?.name === ANSWER.name;
  const txt =
`🦕 DinoNana Clássico — ${TODAY.toLocaleDateString('pt-BR')}
${won ? guesses.length : 'X'}/20
 
${lines.join('\n')}`;
  navigator.clipboard.writeText(txt).then(()=>{
    document.getElementById('share-copied').textContent = 'Resultado copiado!';
    setTimeout(()=>{ document.getElementById('share-copied').textContent=''; }, 2500);
  });
}
 
// ── Autocomplete (classic) ────────────────────────────────
const inp = document.getElementById('dino-input');
const acList = document.getElementById('ac-list');
 
inp.addEventListener('input',()=>{
  const v = inp.value.trim().toLowerCase();
  if(!v) { acList.style.display='none'; return; }
  const m = DINOS.filter(d =>
    (d.common.toLowerCase().includes(v) || d.name.toLowerCase().includes(v)) &&
    !guesses.find(g=>g.name===d.name)
  );
  if(!m.length) { acList.style.display='none'; return; }
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
 
document.getElementById('guess-btn').addEventListener('click', submit);
 
document.addEventListener('click',e=>{
  if(!acList.contains(e.target) && e.target!==inp) acList.style.display='none';
});
 
 

 
/* ═══════════════════════════════════════════════════════════
   FOTO GAME
═══════════════════════════════════════════════════════════ */
let fotoGuesses   = [];
let fotoWrongCount = 0;   // only wrong guesses advance the blur
let fotoGameOver  = false;
const FOTO_MAX    = 10;
 
// ── Setup image ───────────────────────────────────────────
function fotoInit() {
  const img = document.getElementById('foto-img');
  const wrap = document.getElementById('foto-blur-wrap');
 
  // Apply blur immediately so there's no flash of unblurred image
  img.style.filter = `blur(${BLUR_LEVELS[0]}px)`;
  img.style.transition = 'filter 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
 
  // Show loading state
  wrap.style.background = 'var(--surface2)';
 
 img.src = FOTO_ANSWER.imgPhoto;
 img.alt = FOTO_ANSWER.common;
 img.onerror = () => { wrap.style.background = 'var(--surface2)'; };
 
  applyBlur(0);
 
  // restore state from localStorage if same day
  const saved = fotoLoadState();
  if(saved && saved.day === DAY_KEY) {
    fotoGuesses    = saved.guesses;
    fotoWrongCount = saved.wrongCount;
    fotoGameOver   = saved.gameOver;
    rebuildFotoUI();
       if(fotoGameOver) {
      document.getElementById('foto-input-area').style.display='none';
      document.getElementById('foto-img').style.filter = 'blur(0px)';  // ← adicionar
      document.getElementById('foto-blur-text').textContent = 'Revelado!'; // ← adicionar
      showFotoResult(saved.won, fotoGuesses.length);
    }
  }
 
  renderFotoStats();
}
 
function applyBlur(wrongCount) {
  const blur = BLUR_LEVELS[Math.min(wrongCount, BLUR_LEVELS.length-1)];
  document.getElementById('foto-img').style.filter = `blur(${blur}px)`;
  document.getElementById('foto-blur-text').textContent = BLUR_LABELS[Math.min(wrongCount, BLUR_LABELS.length-1)];
  document.getElementById('foto-att-num').textContent = fotoGuesses.length;
 
  // update pips
  for(let i=0; i<FOTO_MAX; i++) {
    const pip = document.getElementById(`pip-${i}`);
    if(!pip) continue;
    pip.className = 'pip';
    if(i < fotoGuesses.length) {
      pip.classList.add(fotoGuesses[i].correct ? 'used-right' : 'used-wrong');
    } else if(i === fotoGuesses.length && !fotoGameOver) {
      pip.classList.add('active');
    }
  }
}
 
function rebuildFotoUI() {
  const container = document.getElementById('foto-guesses');
  container.innerHTML = '';
  fotoGuesses.forEach((g,i) => addFotoGuessItem(g, i, false));
  applyBlur(fotoWrongCount);
}
 
// ── Submit foto ───────────────────────────────────────────
function fotoSubmit() {
  if(fotoGameOver) return;
 
  const inp = document.getElementById('foto-dino-input');
  const val = inp.value.trim();
  const err = document.getElementById('foto-err-msg');
  if(!val) return;
 
  const found = DINOS.find(d =>
    d.name.toLowerCase() === val.toLowerCase() ||
    d.common.toLowerCase() === val.toLowerCase()
  );
  if(!found) { err.textContent = `"${val}" não está na lista.`; return; }
  if(fotoGuesses.find(g=>g.name===found.name)) { err.textContent = 'Já tentado!'; return; }
 
  err.textContent = '';
  inp.value = '';
  document.getElementById('foto-ac-list').style.display='none';
 
  const correct = found.name === FOTO_ANSWER.name;
  const entry   = { name: found.name, common: found.common, sci: found.name, correct };
 
  fotoGuesses.push(entry);
  if(!correct) fotoWrongCount++;
 
  addFotoGuessItem(entry, fotoGuesses.length-1, true);
  applyBlur(fotoWrongCount);
 
  const over = correct || fotoGuesses.length >= FOTO_MAX;
 
  if(over) {
    fotoGameOver = true;
    // reveal image fully
    document.getElementById('foto-img').style.filter = 'blur(0px)';
    document.getElementById('foto-blur-text').textContent = 'Revelado!';
    document.getElementById('foto-input-area').style.display='none';
 
    fotoUpdateStats(correct, fotoGuesses.length);
    fotoSaveState(correct);
 
    setTimeout(()=> showFotoResult(correct, fotoGuesses.length), 600);
  } else {
    fotoSaveState(false);
  }
}
 
// ── Skip ──────────────────────────────────────────────────
function fotoSkip() {
  if(fotoGameOver) return;
 
  // counts as a wrong guess with label "Pulei"
  const entry = { name: '__skip__', common: 'Pulei', sci: '', correct: false, skipped: true };
  fotoGuesses.push(entry);
  fotoWrongCount++;
 
  addFotoGuessItem(entry, fotoGuesses.length-1, true);
  applyBlur(fotoWrongCount);
 
  if(fotoGuesses.length >= FOTO_MAX) {
    fotoGameOver = true;
    document.getElementById('foto-img').style.filter='blur(0px)';
    document.getElementById('foto-blur-text').textContent = 'Revelado!';
    document.getElementById('foto-input-area').style.display='none';
    fotoUpdateStats(false, fotoGuesses.length);
    fotoSaveState(false);
    setTimeout(()=> showFotoResult(false, fotoGuesses.length), 600);
  } else {
    fotoSaveState(false);
  }
}
 
// ── Render guess item ─────────────────────────────────────
function addFotoGuessItem(entry, idx, animate) {
  const container = document.getElementById('foto-guesses');
  const div = document.createElement('div');
  div.className = 'foto-guess-item';
  if(!animate) div.style.animation = 'none';
 
  const icon   = entry.skipped ? '⏭' : entry.correct ? '✅' : '❌';
  const cls    = entry.correct ? 'correct' : 'wrong';
 
  div.innerHTML = `
    <span class="foto-guess-num">${idx+1}</span>
    <span class="foto-guess-icon">${icon}</span>
    <span>
      <span class="foto-guess-name ${cls}">${entry.common}</span>
      ${entry.sci && !entry.skipped ? `<br><span class="foto-guess-sci">${entry.sci}</span>` : ''}
    </span>
  `;
  container.appendChild(div);
}
 
// ── Result ────────────────────────────────────────────────
function showFotoResult(won, n) {
  const banner = document.getElementById('foto-result-banner');
  banner.style.display='block';
  banner.scrollIntoView({behavior:'smooth',block:'nearest'});
  document.getElementById('foto-result-title').textContent = won ? 'Acertou! 🎉' : 'Fim de jogo!';
  document.getElementById('foto-result-sub').innerHTML = won
    ? `Você identificou o <strong style="color:var(--amber-l)">${FOTO_ANSWER.common}</strong> em ${n} tentativa${n>1?'s':''}!`
    : `Era o <strong style="color:var(--amber-l)">${FOTO_ANSWER.common}</strong> <em style="color:var(--muted)">(${FOTO_ANSWER.name})</em>`;
  document.getElementById('foto-share-btn').addEventListener('click', shareFotoResult);
}
 
// ── Share foto ────────────────────────────────────────────
function shareFotoResult() {
  const icons = fotoGuesses.map(g => g.skipped ? '⏭' : g.correct ? '🟩' : '🟥');
  const blurSteps = fotoGuesses.map((_,i)=> {
    const b = BLUR_LEVELS[Math.min(i, BLUR_LEVELS.length-1)];
    return `${b}px`;
  }).join(' → ');
  const won = fotoGuesses.some(g=>g.correct);
  const txt =
`📸 DinoNana Foto — ${TODAY.toLocaleDateString('pt-BR')}
${won ? fotoGuesses.findIndex(g=>g.correct)+1 : 'X'}/${FOTO_MAX}
 
${icons.join('')}
`;
  navigator.clipboard.writeText(txt).then(()=>{
    document.getElementById('foto-share-copied').textContent = 'Resultado copiado!';
    setTimeout(()=>{ document.getElementById('foto-share-copied').textContent=''; }, 2500);
  });
}
 
// ── Stats foto ────────────────────────────────────────────
function fotoLoadStats() {
  try { return JSON.parse(localStorage.getItem('dinofoto_stats')||'{}'); } catch { return {}; }
}
function fotoSaveStatsLS(s) {
  try { localStorage.setItem('dinofoto_stats', JSON.stringify(s)); } catch {}
}
function fotoUpdateStats(won, n) {
  const s = fotoLoadStats();
  s.played = (s.played||0)+1;
  if(won) {
    s.wins   = (s.wins||0)+1;
    s.streak = (s.streak||0)+1;
    s.best   = s.best ? Math.min(s.best,n) : n;
  } else {
    s.streak = 0;
  }
  s.lastDay = DAY_KEY;
  fotoSaveStatsLS(s);
  renderFotoStats(s);
}
function renderFotoStats(s) {
  s = s || fotoLoadStats();
  document.getElementById('f-played').textContent = s.played||0;
  document.getElementById('f-wins').textContent   = s.wins||0;
  document.getElementById('f-streak').textContent = s.streak||0;
  document.getElementById('f-best').textContent   = s.best||'—';
}
 
// ── Persist state ─────────────────────────────────────────
function fotoSaveState(won) {
  try {
    localStorage.setItem('dinofoto_state', JSON.stringify({
      day: DAY_KEY, guesses: fotoGuesses, wrongCount: fotoWrongCount,
      gameOver: fotoGameOver, won
    }));
  } catch {}
}
function fotoLoadState() {
  try { return JSON.parse(localStorage.getItem('dinofoto_state')||'null'); } catch { return null; }
}
 
// ── Autocomplete foto ─────────────────────────────────────
const fotoInp    = document.getElementById('foto-dino-input');
const fotoAcList = document.getElementById('foto-ac-list');
 
fotoInp.addEventListener('input',()=>{
  const v = fotoInp.value.trim().toLowerCase();
  if(!v) { fotoAcList.style.display='none'; return; }
  const m = DINOS.filter(d =>
    (d.common.toLowerCase().includes(v) || d.name.toLowerCase().includes(v)) &&
    !fotoGuesses.find(g=>g.name===d.name)
  );
  if(!m.length) { fotoAcList.style.display='none'; return; }
  fotoAcList.innerHTML = m.slice(0,9).map(d=>`
    <div class="ac-item" data-name="${d.name}">
      <span>${d.common} <span class="ac-sci">${d.name}</span></span>
      <span class="ac-tag">${d.period} · ${d.size}m</span>
    </div>
  `).join('');
  fotoAcList.style.display='block';
});
 
fotoAcList.addEventListener('click',e=>{
  const item = e.target.closest('.ac-item');
  if(!item) return;
  const d = DINOS.find(x=>x.name===item.dataset.name);
  fotoInp.value = d ? d.common : item.dataset.name;
  fotoAcList.style.display='none';
  fotoInp.focus();
});
 
fotoInp.addEventListener('keydown',e=>{
  if(e.key==='Enter') fotoSubmit();
  if(e.key==='Escape') fotoAcList.style.display='none';
});
 
document.getElementById('foto-guess-btn').addEventListener('click', fotoSubmit);
 
document.addEventListener('click',e=>{
  if(!fotoAcList.contains(e.target) && e.target!==fotoInp) fotoAcList.style.display='none';
});
 
/* ── Add skip button dynamically ─────────────────────────── */
(function addSkipBtn(){
  const area = document.getElementById('foto-input-area');
  const row  = document.createElement('div');
  row.className = 'foto-action-row';
  const skipBtn = document.createElement('button');
  skipBtn.className = 'foto-skip-btn';
  skipBtn.textContent = '⏭ Pular (revelar um pouco mais)';
  skipBtn.addEventListener('click', fotoSkip);
  row.appendChild(skipBtn);
  area.appendChild(row);
})();
 
/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
renderStats();
classicRestoreState();
fotoInit();