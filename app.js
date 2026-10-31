'use strict';
/* ===== 저장소 ===== */
const LS = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const $ = id => document.getElementById(id);
const DAY = 86400000;
const INTERVALS = [1, 3, 7, 14, 30]; // 알았다를 누를 때마다 다음 간격(일)

let baseCards = [];                       // data/cards.json
let localCards = LS.get('ma_cards', {});  // 기기에서 추가·수정한 카드 {id: card}
let deleted = LS.get('ma_deleted', []);   // 삭제한 id
let prog = LS.get('ma_prog', {});         // {id: {step, due, wrong}}

function saveAll() { LS.set('ma_cards', localCards); LS.set('ma_deleted', deleted); LS.set('ma_prog', prog); }
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function allCards() {
  const map = {};
  baseCards.forEach(c => map[c.id] = c);
  Object.values(localCards).forEach(c => map[c.id] = c);
  return Object.values(map).filter(c => !deleted.includes(c.id));
}
const confirmed = () => allCards().filter(c => c.status === '확정');

function filterCards(subject, scope) {
  let list = confirmed();
  if (subject && subject !== '*') list = list.filter(c => c.subject === subject);
  const now = Date.now();
  if (scope === 'due') list = list.filter(c => !prog[c.id] || prog[c.id].due <= now);
  if (scope === 'wrong') list = list.filter(c => prog[c.id] && prog[c.id].wrong > 0);
  if (scope === 'today') list = list.filter(c => c.lessonDate === today());
  return list;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function grade(id, known) {
  const p = prog[id] || { step: 0, due: 0, wrong: 0 };
  if (known) { p.due = Date.now() + INTERVALS[Math.min(p.step, INTERVALS.length - 1)] * DAY; p.step++; if (p.wrong > 0) p.wrong--; }
  else { p.step = 0; p.due = Date.now() + 1 * DAY; p.wrong = (p.wrong || 0) + 1; }
  prog[id] = p; saveAll();
}

/* ===== 공통 UI ===== */
function subjects() { return [...new Set(allCards().map(c => c.subject).filter(Boolean))]; }
function fillSubjectSelect(sel) {
  const cur = sel.value;
  sel.innerHTML = '<option value="*">전체 과목</option>' + subjects().map(s => `<option>${esc(s)}</option>`).join('');
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
function refreshCommon() {
  ['fSubject', 'wSubject', 'sSubject'].forEach(id => fillSubjectSelect($(id)));
  fillUnits();
  const pend = allCards().filter(c => c.status !== '확정').length;
  $('pendingBadge').textContent = pend || '';
  $('countInfo').textContent = `확정 ${confirmed().length} · 오늘 복습 ${filterCards('*', 'due').length}`;
}

document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
  $('sheet').classList.toggle('show', b.dataset.tab === 'sheet' && $('sheet').innerHTML !== '');
  if (b.dataset.tab === 'cards') startDeck();
  if (b.dataset.tab === 'review') renderReview();
  refreshCommon();
});

/* ===== 카드 모드 ===== */
let deck = [], di = 0, shown = false;
function startDeck() {
  deck = filterCards($('fSubject').value, $('fScope').value);
  if ($('fShuffle').checked) deck = shuffle(deck);
  di = 0; showCard();
}
function showCard() {
  shown = false;
  $('cA').classList.add('hidden'); $('cHint').classList.remove('hidden');
  if (di >= deck.length) {
    $('cMeta').textContent = ''; $('cQ').textContent = deck.length ? '이번 묶음 끝! 🎉' : '볼 카드가 없어요';
    $('cHint').textContent = deck.length ? '' : '범위를 바꾸거나 검수 탭에서 카드를 확정하세요';
    $('cProgress').textContent = ''; return;
  }
  const c = deck[di];
  $('cMeta').textContent = [c.subject, c.unit, c.lessonDate].filter(Boolean).join(' · ');
  $('cQ').textContent = c.q; $('cA').textContent = c.a; $('cHint').textContent = '탭해서 답 보기';
  $('cProgress').textContent = `${di + 1} / ${deck.length}`;
}
$('cardBox').onclick = () => { if (di < deck.length) { shown = !shown; $('cA').classList.toggle('hidden', !shown); $('cHint').classList.toggle('hidden', shown); } };
function answerCard(k) { if (di >= deck.length) return; grade(deck[di].id, k); di++; showCard(); refreshCommon(); }
$('bRight').onclick = () => answerCard(true);
$('bWrong').onclick = () => answerCard(false);
['fSubject', 'fScope', 'fShuffle'].forEach(id => $(id).onchange = startDeck);

/* ===== 걷기 모드 ===== */
let walking = false, wDeck = [], wi = 0, wResolve = null, wakeLock = null, koVoice = null;
function pickVoice() { const v = speechSynthesis.getVoices(); koVoice = v.find(x => x.lang === 'ko-KR') || v.find(x => x.lang && x.lang.startsWith('ko')) || null; }
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; if (koVoice) u.voice = koVoice; u.rate = parseFloat($('wRate').value);
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}
// 사용자 입력 또는 시간 초과를 기다림: 'know' | 'wrong' | 'timeout' | 'stop'
function waitInput(ms) { return new Promise(res => { wResolve = res; setTimeout(() => { if (wResolve === res) { wResolve = null; res('timeout'); } }, ms); }); }
function userAct(a) { if (wResolve) { const r = wResolve; wResolve = null; speechSynthesis.cancel(); r(a); } }

async function walkLoop() {
  const pause = parseInt($('wPause').value) * 1000;
  while (walking && wi < wDeck.length) {
    const c = wDeck[wi];
    $('wMeta').textContent = `${wi + 1}/${wDeck.length} · ${[c.subject, c.unit].filter(Boolean).join(' · ')}`;
    $('wQ').textContent = c.q; $('wA').textContent = ''; $('wStatus').textContent = '문제';
    const myIdx = wi;
    let act = await Promise.race([speak(c.q).then(() => (walking && wi === myIdx && wResolve) ? waitInput(pause) : new Promise(() => { })), new Promise(r => { wResolve = r; })]);
    if (!walking) return;
    $('wA').textContent = c.a; $('wStatus').textContent = '정답 — 탭: 알았다 / ← 밀기: 몰랐다';
    if (act === 'timeout') { await speak('정답. ' + c.a); if (!walking) return; act = await waitInput(5000); }
    if (!walking) return;
    if (act === 'know') grade(c.id, true);
    else if (act === 'wrong') { grade(c.id, false); await speak('다시 볼게요'); }
    wi++;
  }
  if (walking) { $('wQ').textContent = '끝! 수고했어요 🎉'; $('wA').textContent = ''; $('wStatus').textContent = ''; await speak('끝났어요. 수고했어요.'); }
}
$('wStart').onclick = async () => {
  wDeck = shuffle(filterCards($('wSubject').value, $('wScope').value));
  if (!wDeck.length) { alert('볼 카드가 없어요. 범위를 바꾸거나 검수 탭에서 확정하세요.'); return; }
  wi = 0; walking = true; $('walkScreen').classList.remove('hidden');
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch { }
  speak(' '); // iOS: 첫 탭에서 음성 잠금 해제
  walkLoop();
};
function stopWalk() {
  walking = false; userAct('stop'); speechSynthesis.cancel();
  if (wakeLock) { wakeLock.release().catch(() => { }); wakeLock = null; }
  $('walkScreen').classList.add('hidden'); refreshCommon();
}
$('wStop').onclick = e => { e.stopPropagation(); stopWalk(); };
let tx = 0, ty = 0;
$('walkScreen').addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
$('walkScreen').addEventListener('touchend', e => {
  if (e.target.id === 'wStop') return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (dx < -60 && Math.abs(dx) > Math.abs(dy)) userAct('wrong');
  else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) userAct('know');
  e.preventDefault();
});
$('walkScreen').addEventListener('click', e => { if (e.target.id !== 'wStop' && !('ontouchstart' in window)) userAct('know'); });
document.addEventListener('visibilitychange', async () => { if (walking && document.visibilityState === 'visible' && 'wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen'); } catch { } } });

/* ===== 검수 ===== */
function upsert(c) { localCards[c.id] = c; saveAll(); }
function renderReview() {
  const f = $('rFilter').value;
  const list = allCards().filter(c => f === 'all' || c.status !== '확정');
  $('reviewList').innerHTML = list.length ? list.map(c => `
    <div class="rcard" data-id="${esc(c.id)}">
      <div class="tag">${esc(c.status || '검수대기')} · ${esc(c.subject)} · ${esc(c.unit)} · ${esc(c.lessonDate || '')} · ${esc(c.source || '')}</div>
      <label>문제</label><input type="text" data-k="q" value="${esc(c.q)}">
      <label>답</label><input type="text" data-k="a" value="${esc(c.a)}">
      <label>원문 문장 (빈칸 학습지용)</label><input type="text" data-k="sentence" value="${esc(c.sentence || '')}">
      <label>빈칸 키워드 (쉼표로 구분)</label><input type="text" data-k="blanks" value="${esc((c.blanks || []).join(', '))}">
      <div class="row">
        <button class="btn small good" data-act="ok">확정</button>
        <button class="btn small" data-act="save">수정 저장</button>
        <button class="btn small bad" data-act="del">삭제</button>
      </div>
    </div>`).join('') : '<p class="muted">검수할 카드가 없어요.</p>';
}
function readEdit(box, c) {
  box.querySelectorAll('input[data-k]').forEach(i => {
    c[i.dataset.k] = i.dataset.k === 'blanks' ? i.value.split(',').map(s => s.trim()).filter(Boolean) : i.value.trim();
  });
  return c;
}
$('reviewList').onclick = e => {
  const act = e.target.dataset.act; if (!act) return;
  const box = e.target.closest('.rcard'), id = box.dataset.id;
  const c = { ...allCards().find(x => x.id === id) };
  if (act === 'del') { if (!confirm('이 카드를 삭제할까요?')) return; deleted.push(id); delete localCards[id]; saveAll(); }
  else { readEdit(box, c); if (act === 'ok') c.status = '확정'; upsert(c); }
  renderReview(); refreshCommon();
};
$('rFilter').onchange = renderReview;
$('rConfirmAll').onclick = () => {
  if (!confirm('보이는 카드를 모두 확정할까요? 원본과 비교했는지 확인하세요.')) return;
  document.querySelectorAll('.rcard').forEach(box => { const c = { ...allCards().find(x => x.id === box.dataset.id) }; readEdit(box, c); c.status = '확정'; upsert(c); });
  renderReview(); refreshCommon();
};

/* ===== 카드 추가 ===== */
$('pasteAdd').onclick = () => {
  let txt = $('pasteBox').value.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  let arr;
  try { arr = JSON.parse(txt); if (!Array.isArray(arr)) arr = [arr]; }
  catch { $('pasteMsg').textContent = '❌ JSON 형식이 아니에요. AI에게 "JSON 배열로만 다시 출력해줘"라고 요청하세요.'; return; }
  let n = 0;
  arr.forEach((c, i) => {
    if (!c.q || !c.a) return;
    c.id = c.id || `c-${Date.now()}-${i}`;
    if (allCards().some(x => x.id === c.id)) c.id += '-' + Math.random().toString(36).slice(2, 6);
    c.status = c.status === '확정' ? '확정' : '검수대기';
    c.lessonDate = c.lessonDate || today();
    c.blanks = Array.isArray(c.blanks) ? c.blanks : [];
    deleted = deleted.filter(d => d !== c.id);
    upsert(c); n++;
  });
  $('pasteMsg').textContent = `✅ ${n}개 추가됨 → '검수' 탭에서 확인 후 확정하세요.`;
  $('pasteBox').value = ''; refreshCommon();
};

const PROMPT = `이 사진의 수업 내용만 근거로 암기 카드를 만들어줘.
- 사진에 없는 내용은 절대 추가하지 마. 글씨가 안 보이는 부분은 "판독불가"로 써.
- 과목: 한국사 / 단원: ○○ / 수업일: ${'YYYY-MM-DD'} / 출처: 필기 p.○
- 문제(q)는 걸으면서 들어도 이해되게 짧게, 답(a)은 한 단어~한 문장.
- sentence: 사진 속 핵심 문장 원문 그대로, blanks: 그 문장에서 빈칸으로 뺄 핵심어(문장에 그대로 들어있는 단어).
- 출력은 아래 형식의 JSON 배열로만, 설명 없이:
[{"subject":"","unit":"","lessonDate":"","q":"","a":"","sentence":"","blanks":[""],"source":"","status":"검수대기"}]`;
$('promptBox').value = PROMPT;
$('copyPrompt').onclick = async () => { try { await navigator.clipboard.writeText(PROMPT); alert('복사됨'); } catch { $('promptBox').select(); document.execCommand('copy'); } };

/* ===== 백업 ===== */
function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('exportBtn').onclick = () => download(`암기장-백업-${today()}.json`, { localCards, deleted, prog });
$('exportCards').onclick = () => download('cards.json', confirmed());
$('importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    Object.assign(localCards, d.localCards || {});
    deleted = [...new Set([...deleted, ...(d.deleted || [])])];
    for (const [id, p] of Object.entries(d.prog || {})) if (!prog[id] || (p.due || 0) > (prog[id].due || 0)) prog[id] = p;
    saveAll(); refreshCommon(); alert('가져오기 완료');
  } catch { alert('백업 파일을 읽지 못했어요'); }
  e.target.value = '';
};

/* ===== 학습지 ===== */
function fillUnits() {
  const sel = $('sUnit'), cur = sel.value, s = $('sSubject').value;
  const units = [...new Set(confirmed().filter(c => s === '*' || c.subject === s).map(c => c.unit).filter(Boolean))];
  sel.innerHTML = '<option value="*">전체 단원</option>' + units.map(u => `<option>${esc(u)}</option>`).join('');
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
$('sSubject').onchange = fillUnits;

function sheetCards() {
  const s = $('sSubject').value, u = $('sUnit').value, r = $('sRange').value;
  let list = confirmed();
  if (s !== '*') list = list.filter(c => c.subject === s);
  if (u !== '*') list = list.filter(c => c.unit === u);
  if (r === 'today') list = list.filter(c => c.lessonDate === today());
  if (r === 'week') { const lim = Date.now() - 7 * DAY; list = list.filter(c => c.lessonDate && new Date(c.lessonDate).getTime() >= lim); }
  if (r === 'wrong') list = list.filter(c => prog[c.id] && prog[c.id].wrong > 0);
  return list.sort((a, b) => (a.lessonDate || '').localeCompare(b.lessonDate || '') || (a.unit || '').localeCompare(b.unit || ''));
}
function blankHtml(c) {
  let s = esc(c.sentence || ''), answers = [];
  const keys = (c.blanks || []).filter(k => k && (c.sentence || '').includes(k));
  if (!c.sentence || !keys.length) return { html: `${esc(c.q)} <span class="blank">&nbsp;</span>`, answers: [c.a] };
  keys.sort((a, b) => b.length - a.length).forEach(k => {
    s = s.split(esc(k)).join(`\u0000${answers.length}\u0000`); answers.push(k);
  });
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<span class="blank">${'①②③④⑤⑥⑦⑧⑨⑩'[i] || ''}</span>`);
  return { html: s, answers };
}
function lines(n) { return '<div class="line"></div>'.repeat(n); }

$('sMake').onclick = () => {
  const list = sheetCards(), type = $('sType').value, nl = parseInt($('sLines').value);
  if (!list.length) { alert('조건에 맞는 확정 카드가 없어요.'); return; }
  const title = { blank: '빈칸 채우기', bbak: '빡지', qa: '문답 점검' }[type];
  const subj = $('sSubject').value === '*' ? '전체 과목' : $('sSubject').value;
  const unit = $('sUnit').value === '*' ? '' : ' · ' + $('sUnit').value;
  const head = t => `<div class="ph"><h3>${esc(t)}</h3><div class="info">${esc(subj + unit)} · ${list.length}문항 · 날짜 ____ 점수 ____</div></div>`;
  let body = '', ans = [];
  list.forEach((c, i) => {
    const n = i + 1;
    if (type === 'blank') {
      const b = blankHtml(c);
      body += `<div class="item"><span class="n">${n}.</span>${b.html}</div>`;
      ans.push(`${n}. ${b.answers.map((a, j) => (b.answers.length > 1 ? '①②③④⑤⑥⑦⑧⑨⑩'[j] + ' ' : '') + esc(a)).join('  ')}`);
    } else if (type === 'bbak') {
      body += `<div class="item bbak"><div class="k"><b>${n}.</b> ${esc(c.q)}<br><b>→ ${esc(c.a)}</b></div><div class="w">${lines(nl)}</div></div>`;
      ans.push(`${n}. ${esc(c.a)}`);
    } else {
      body += `<div class="item"><span class="n">${n}.</span>${esc(c.q)}${lines(Math.max(1, nl - 1))}</div>`;
      ans.push(`${n}. ${esc(c.a)}`);
    }
  });
  let html = `<div class="page">${head(title)}${body}</div>`;
  if ($('sAnswer').checked && type !== 'bbak') html += `<div class="page">${head(title + ' — 답지')}${ans.map(a => `<div class="item">${a}</div>`).join('')}</div>`;
  $('sheet').innerHTML = html; $('sheet').classList.add('show');
  $('sheet').scrollIntoView({ behavior: 'smooth' });
};
$('sPrint').onclick = () => { if (!$('sheet').innerHTML) $('sMake').onclick(); if ($('sheet').innerHTML) window.print(); };

/* ===== 시작 ===== */
async function init() {
  try { const r = await fetch('data/cards.json', { cache: 'no-cache' }); baseCards = await r.json(); } catch { baseCards = []; }
  refreshCommon(); startDeck();
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
init();
