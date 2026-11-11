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
let stars = LS.get('ma_stars', []);       // ★ 표시한 카드 id
let baseSums = [];                        // data/summaries.json
let localSums = LS.get('ma_sums', {});    // 기기에서 추가한 요약 {id: summary}
let delSums = LS.get('ma_delsums', []);
const MANAGE = new URLSearchParams(location.search).has('manage');   // 검수·추가 화면 (manage.html 로 들어옴)
let curSubject = MANAGE ? '*' : LS.get('ma_subject', null); // 처음 화면에서 고른 과목 (null = 아직 안 고름, '*' = 전체)
let bWrong = LS.get('ma_bwrong', {});        // 빈칸 추론에서 틀린 빈칸 {카드id: [빈칸 번호...]}

function saveAll() { LS.set('ma_bwrong', bWrong); LS.set('ma_cards', localCards); LS.set('ma_deleted', deleted); LS.set('ma_prog', prog); LS.set('ma_stars', stars); LS.set('ma_sums', localSums); LS.set('ma_delsums', delSums); }
function allSums() { const m = {}; baseSums.forEach(s => m[s.id] = s); Object.values(localSums).forEach(s => m[s.id] = s); return Object.values(m).filter(s => !delSums.includes(s.id)).sort((a, b) => (b.lessonDate || '').localeCompare(a.lessonDate || '')); }
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
  if (scope === 'star') list = list.filter(c => stars.includes(c.id));
  return list;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// known: true(알았다) / 'mid'(애매: 내일 다시, 단계 유지) / false(몰랐다)
function grade(id, known) {
  const p = prog[id] || { step: 0, due: 0, wrong: 0 };
  if (known === 'mid') { p.due = Date.now() + 1 * DAY; p.step = Math.max(0, p.step - 1); }
  else if (known) { p.due = Date.now() + INTERVALS[Math.min(p.step, INTERVALS.length - 1)] * DAY; p.step++; if (p.wrong > 0) p.wrong--; }
  else { p.step = 0; p.due = Date.now() + 1 * DAY; p.wrong = (p.wrong || 0) + 1; }
  prog[id] = p; saveAll();
}

/* ===== 공통 UI ===== */
function subjects() { return [...new Set([...allCards(), ...allSums()].map(c => c.subject).filter(Boolean))]; }
function fillSubjectSelect(sel) {
  // 과목을 골랐으면 모든 탭이 그 과목만 보여 줌 (선택 상자는 숨김)
  if (curSubject && curSubject !== '*') { sel.innerHTML = `<option>${esc(curSubject)}</option>`; sel.value = curSubject; sel.classList.add('hidden'); return; }
  sel.classList.remove('hidden');
  const cur = sel.value;
  sel.innerHTML = '<option value="*">전체 과목</option>' + subjects().map(s => `<option>${esc(s)}</option>`).join('');
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
// 파트(큰 단원)·단원별로 나눠 보기. 값: '*' | 'P:03' (03-1~03-5 묶음) | 'U:03-1 4·19 혁명'
function unitPart(u) { const code = String(u || '기타').split(' ')[0]; const i = code.lastIndexOf('-'); return i > 0 ? code.slice(0, i) : code; }
function inPart(c, v) { return !v || v === '*' || (v.startsWith('P:') ? unitPart(c.unit) === v.slice(2) : (c.unit || '기타') === v.slice(2)); }
function fillPartSelect(sel, subjSel) {
  const s = $(subjSel).value, list = confirmed().filter(c => s === '*' || c.subject === s);
  const units = [...new Set(list.slice().sort(byOrder).map(c => c.unit || '기타'))];
  const parts = [...new Set(units.map(unitPart))];
  const n = f => list.filter(f).length;
  const cur = sel.value || LS.get('ma_' + sel.id, '*');
  sel.innerHTML = `<option value="*">전체 단원 (${list.length})</option>` + parts.map(p => {
    const us = units.filter(u => unitPart(u) === p);
    return `<optgroup label="${esc(p)} 단원">` + (us.length > 1 ? `<option value="P:${esc(p)}">${esc(p)} 단원 전체 (${n(c => unitPart(c.unit) === p)})</option>` : '') +
      us.map(u => `<option value="U:${esc(u)}">${esc(u)} (${n(c => (c.unit || '기타') === u)})</option>`).join('') + '</optgroup>';
  }).join('');
  sel.value = [...sel.options].some(o => o.value === cur) ? cur : '*';
}
function refreshCommon() {
  ['fSubject', 'wSubject', 'mSubject'].forEach(id => fillSubjectSelect($(id)));
  fillPartSelect($('fPart'), 'fSubject'); fillPartSelect($('wPart'), 'wSubject');
  const pend = allCards().filter(c => c.status !== '확정').length;
  $('pendingBadge').textContent = pend || '';
  const sj = curSubject && curSubject !== '*' ? curSubject : '*';
  $('txtTab').classList.toggle('hidden', MANAGE || !baseTxts.some(t => sj === '*' || t.subject === sj)); // 원문이 있는 과목만 원문 탭
  $('srcTab').classList.toggle('hidden', MANAGE || !baseSrcs.some(s => sj === '*' || s.subject === sj)); // 사료가 있는 과목만 사료 탭
  $('subjTitle').textContent = MANAGE ? '관리 · 검수와 추가' : sj === '*' ? '암기장' : sj;
  $('countInfo').textContent = MANAGE ? `검수대기 ${pend}` : `카드 ${filterCards(sj, 'all').length} · 오늘 복습 ${filterCards(sj, 'due').length}`;
}

/* ===== 처음 화면: 과목 고르기 ===== */
function showPicker() {
  const list = subjects();
  $('pickList').innerHTML = list.map(s => {
    const n = confirmed().filter(c => c.subject === s).length;
    const units = new Set(confirmed().filter(c => c.subject === s).map(c => c.unit)).size;
    const due = filterCards(s, 'due').length;
    return `<button class="ptile" data-s="${esc(s)}"><span class="ic">${SUBJ_ICON[s] || '📚'}</span><b>${esc(s)}</b><small>단원 ${units} · 카드 ${n}</small>${due ? `<span class="due">오늘 복습 ${due}</span>` : '<span class="due done">복습 완료</span>'}</button>`;
  }).join('') || '<p class="muted">아직 과목이 없어요.</p>';
  $('pickList').querySelectorAll('.ptile').forEach(b => b.onclick = () => pickSubject(b.dataset.s));
  $('picker').classList.remove('hidden');
  ['topBar'].forEach(id => $(id).classList.add('hidden'));
  document.querySelector('main').classList.add('hidden'); document.querySelector('.tabs').classList.add('hidden');
}
const SUBJ_ICON = { '한국사': '🏛️', '수학': '📐', '통합과학': '🔬', '통합사회': '🌏', '국어': '📖', '영어': '🔤' };
function pickSubject(s) {
  curSubject = s; LS.set('ma_subject', s);
  $('picker').classList.add('hidden'); $('topBar').classList.remove('hidden');
  document.querySelector('main').classList.remove('hidden'); document.querySelector('.tabs').classList.remove('hidden');
  bUnit = null; refreshCommon();
  goTab('blank');
}
$('pickBtn').onclick = showPicker;
function goTab(t) { document.querySelector(`.tabs button[data-tab="${t}"]`).click(); }

document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
  $('sheet').classList.remove('show');
  if (b.dataset.tab === 'cards') startDeck();
  if (b.dataset.tab === 'blank') renderBlank();
  window.scrollTo(0, 0);
  if (b.dataset.tab === 'review') renderReview();
  if (b.dataset.tab === 'sum') renderSums();
  if (b.dataset.tab === 'src') { srcOrder = null; renderSrc(); }
  if (b.dataset.tab === 'txt') renderTxt();
  if (b.dataset.tab === 'walk') $('wShowA').checked = LS.get('ma_wshowa', null) ?? curSubject === '국어'; // 국어는 기본으로 답을 같이 보여 줌
  refreshCommon();
});

// 카드에 붙은 작품 구절 [[원문, 해석], ...] (국어)
function refHtml(c) { return (c.ref || []).map(([o, t]) => `<div class="rl"><div class="ro">${esc(o)}</div>${t ? `<div class="rt">${esc(t)}</div>` : ''}</div>`).join(''); }

/* ===== 카드 모드 ===== */
let deck = [], di = 0, shown = false;
function startDeck() {
  deck = filterCards($('fSubject').value, $('fScope').value).filter(c => inPart(c, $('fPart').value)).sort(byOrder);
  if ($('fShuffle').checked) deck = shuffle(deck);
  di = 0; showCard();
}
function showCard() {
  shown = false;
  $('cA').classList.add('hidden'); $('cExp').classList.add('hidden'); $('cRef').classList.add('hidden'); $('cRef').innerHTML = ''; $('cHint').classList.remove('hidden');
  $('cStar').classList.toggle('hidden', di >= deck.length);
  if (di >= deck.length) {
    $('cMeta').textContent = ''; $('cQ').textContent = deck.length ? '이번 묶음 끝! 🎉' : '볼 카드가 없어요';
    $('cHint').textContent = deck.length ? '' : '범위를 바꿔 보세요';
    $('cProgress').textContent = ''; return;
  }
  const c = deck[di];
  $('cMeta').textContent = [c.subject, c.unit, c.lessonDate].filter(Boolean).join(' · ');
  const rev = $('fReverse').checked;
  $('cQ').textContent = rev ? c.a : c.q; $('cA').textContent = rev ? c.q : c.a; $('cHint').textContent = '탭해서 답 보기';
  $('cExp').textContent = c.exp ? '💡 ' + c.exp : '';
  $('cRef').innerHTML = refHtml(c);
  $('cStar').textContent = stars.includes(c.id) ? '★' : '☆';
  $('cProgress').textContent = `${di + 1} / ${deck.length}`;
}
$('cardBox').onclick = e => { if (e.target.id === 'cStar') return; if (di < deck.length) { shown = !shown; $('cA').classList.toggle('hidden', !shown); $('cExp').classList.toggle('hidden', !shown || !deck[di].exp); $('cRef').classList.toggle('hidden', !shown || !(deck[di].ref || []).length); $('cHint').classList.toggle('hidden', shown); } };
$('cStar').onclick = e => { e.stopPropagation(); const id = deck[di]?.id; if (!id) return; stars = stars.includes(id) ? stars.filter(x => x !== id) : [...stars, id]; saveAll(); $('cStar').textContent = stars.includes(id) ? '★' : '☆'; };
function answerCard(k) { if (di >= deck.length) return; grade(deck[di].id, k); di++; showCard(); refreshCommon(); }
$('bRight').onclick = () => answerCard(true);
$('bWrong').onclick = () => answerCard(false);
$('bMid').onclick = () => answerCard('mid');
['fSubject', 'fScope', 'fShuffle', 'fReverse'].forEach(id => $(id).onchange = startDeck);
$('fSubject').addEventListener('change', () => { fillPartSelect($('fPart'), 'fSubject'); startDeck(); });
$('fPart').onchange = () => { LS.set('ma_fPart', $('fPart').value); startDeck(); };
$('wSubject').addEventListener('change', () => fillPartSelect($('wPart'), 'wSubject'));
$('wPart').onchange = () => LS.set('ma_wPart', $('wPart').value);

/* ===== 빈칸 추론 ===== */
// 문장을 [글자, 빈칸, 글자 ...] 조각으로 나눔. 빈칸끼리 겹치면 긴 것을 우선.
function segments(c) {
  const s = c.sentence || '', taken = [];
  (c.blanks || []).filter(Boolean).slice().sort((a, b) => b.length - a.length).forEach(k => {
    let from = 0, i;
    while ((i = s.indexOf(k, from)) >= 0) {
      if (!taken.some(t => i < t.e && i + k.length > t.s)) { taken.push({ s: i, e: i + k.length, k }); break; }
      from = i + 1;
    }
  });
  taken.sort((a, b) => a.s - b.s);
  const out = []; let pos = 0;
  taken.forEach(t => { if (t.s > pos) out.push({ t: s.slice(pos, t.s) }); out.push({ b: t.k }); pos = t.e; });
  if (pos < s.length) out.push({ t: s.slice(pos) });
  return out;
}
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function chosung(w) { return [...w].map(ch => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; }).join(''); }
const normAns = s => String(s).replace(/[\s·.,'"‘’“”()~-]/g, '').toLowerCase();
const byOrder = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || (a.lessonDate || '').localeCompare(b.lessonDate || '') || (a.unit || '').localeCompare(b.unit || '') || String(a.id).localeCompare(String(b.id));

let bUnit = null, bState = {}; // bState[카드id-번호] = 'shown' | 'ok' | 'no'
function blankCards() {
  return filterCards(curSubject && curSubject !== '*' ? curSubject : '*', 'all').filter(c => c.sentence && segments(c).some(x => x.b)).sort(byOrder);
}
function renderBlank() {
  const all = blankCards();
  const units = [...new Set(all.map(c => c.unit || '기타'))];
  if (!units.includes(bUnit)) bUnit = units[0] || null;
  const wrongN = u => all.filter(c => (c.unit || '기타') === u && (bWrong[c.id] || []).length).length;
  $('bUnits').innerHTML = units.map(u => `<button class="chip ${u === bUnit ? 'on' : ''}" data-u="${esc(u)}">${esc(u)}${wrongN(u) ? ` <span class="wdot">●${wrongN(u)}</span>` : ''}</button>`).join('');
  $('bUnits').querySelectorAll('.chip').forEach(b => b.onclick = () => { bUnit = b.dataset.u; bState = {}; renderBlank(); window.scrollTo(0, 0); });
  const onChip = $('bUnits').querySelector('.on'); if (onChip) $('bUnits').scrollLeft = onChip.offsetLeft - 20;
  let list = all.filter(c => (c.unit || '기타') === bUnit);
  if ($('bWrongOnly').checked) list = list.filter(c => (bWrong[c.id] || []).length);
  const type = $('bMode').value === 'type', hint = $('bHint').checked;
  if (!list.length) {
    $('blankBox').innerHTML = `<p class="muted center" style="padding:30px 0">${all.length ? ($('bWrongOnly').checked ? '이 단원에 틀린 빈칸이 없어요 🎉' : '빈칸 문장이 없어요') : '이 과목에는 아직 빈칸 문장이 없어요.'}</p>`;
    $('bBar').innerHTML = ''; $('bTip').textContent = ''; return;
  }
  let html = '', topic = null, n = 0;
  list.forEach(c => {
    if ((c.topic || '') !== topic) { topic = c.topic || ''; if (topic) html += `<div class="btopic">${esc(topic)}</div>`; }
    const wr = bWrong[c.id] || [];
    html += `<div class="bsent ${wr.length ? 'hasWrong' : ''}" data-id="${esc(c.id)}">` + segments(c).map((x, i) => {
      if (x.t !== undefined) return esc(x.t);
      n++; const key = `${c.id}-${i}`, st = bState[key];
      const label = hint ? chosung(x.b) : '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'[(n - 1) % 20];
      if (type) {
        const w = Math.max(3.5, x.b.length * 0.95 + 1.2);
        return `<input type="text" class="bin ${st || ''}" data-k="${key}" data-i="${i}" data-a="${esc(x.b)}" style="width:${w}em" placeholder="${esc(label)}" autocomplete="off" autocorrect="off" spellcheck="false">${st === 'no' ? `<span class="bfix">${esc(x.b)}</span>` : ''}`;
      }
      return `<button class="bk ${st || ''}" data-k="${key}" data-i="${i}" data-a="${esc(x.b)}" data-l="${esc(label)}">${st ? esc(x.b) : esc(label)}</button>`;
    }).join('') + '</div>';
  });
  $('blankBox').innerHTML = html;
  updateBlankBar(n, type);
  $('bTip').innerHTML = type ? '빈칸에 답을 쓰고 <b>채점</b>을 누르세요. 띄어쓰기·가운뎃점(·)은 무시해요. 틀린 빈칸은 \'틀린 것만\'으로 다시 볼 수 있어요.'
    : '빈칸을 누르면 답이 보여요. <b>한 번 더 누르면 \'몰랐음\'(빨강)</b>으로 표시되고, 다시 누르면 \'알았음\'(초록)으로 바뀌어요. 몰랐던 빈칸은 \'틀린 것만\'과 카드 탭의 \'몰랐던 카드\'에 모여요.';
}
function updateBlankBar(n, type) {
  const vals = Object.values(bState);
  const seen = vals.length, no = vals.filter(v => v === 'no').length;
  $('bBar').innerHTML = `<span class="stat">빈칸 <b>${n}</b> · 확인 <b>${seen}</b> · 몰랐음 <b class="wdot">${no}</b></span>` +
    (type ? `<button class="btn small good" id="bCheck">채점</button>` : `<button class="btn small" id="bShowAll">모두 보기</button>`) +
    `<button class="btn small" id="bHideAll">다시 가리기</button>`;
  if ($('bCheck')) $('bCheck').onclick = checkTyped;
  if ($('bShowAll')) $('bShowAll').onclick = () => { document.querySelectorAll('#blankBox .bk').forEach(b => { if (!bState[b.dataset.k]) bState[b.dataset.k] = 'shown'; }); renderBlank(); };
  $('bHideAll').onclick = () => { bState = {}; renderBlank(); };
}
function markBlank(cardId, i, wrong) {
  const set = new Set(bWrong[cardId] || []);
  const had = set.size;
  wrong ? set.add(+i) : set.delete(+i);
  if (set.size) bWrong[cardId] = [...set]; else delete bWrong[cardId];
  if (wrong && !had) grade(cardId, false);   // 처음 틀리면 '몰랐던 카드'로
  saveAll();
}
$('blankBox').onclick = e => {
  const b = e.target.closest('.bk'); if (!b) return;
  const id = b.closest('.bsent').dataset.id, k = b.dataset.k, st = bState[k];
  const next = !st ? 'shown' : st === 'shown' || st === 'ok' ? 'no' : 'ok';
  bState[k] = next;
  if (next === 'no') markBlank(id, b.dataset.i, true);
  if (next === 'ok') markBlank(id, b.dataset.i, false);
  b.className = 'bk ' + next; b.textContent = b.dataset.a;
  b.closest('.bsent').classList.toggle('hasWrong', !!(bWrong[id] || []).length);
  updateBlankBar(document.querySelectorAll('#blankBox .bk').length, false);
};
$('blankBox').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.classList.contains('bin')) return;
  e.preventDefault(); const ins = [...document.querySelectorAll('#blankBox .bin')]; const nx = ins[ins.indexOf(e.target) + 1]; nx ? nx.focus() : checkTyped();
});
function checkTyped() {
  const typed = {};
  document.querySelectorAll('#blankBox .bin').forEach(inp => {
    typed[inp.dataset.k] = inp.value;
    if (!inp.value.trim()) return;
    const ok = normAns(inp.value) === normAns(inp.dataset.a);
    bState[inp.dataset.k] = ok ? 'ok' : 'no';
    markBlank(inp.closest('.bsent').dataset.id, inp.dataset.i, !ok);
  });
  renderBlank();
  document.querySelectorAll('#blankBox .bin').forEach(inp => { inp.value = typed[inp.dataset.k] || ''; });
}
['bMode', 'bHint', 'bWrongOnly'].forEach(id => $(id).onchange = () => { bState = {}; renderBlank(); });

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
    const showA = $('wShowA').checked; // 답 같이 보기: 문제와 함께 답·해설·원문을 처음부터 보여 줌
    const reveal = () => { $('wA').textContent = c.a; $('wExp').textContent = c.exp ? '💡 ' + c.exp : ''; $('wRef').innerHTML = refHtml(c); };
    $('wQ').textContent = c.q; $('wA').textContent = ''; $('wExp').textContent = ''; $('wRef').innerHTML = ''; $('wStatus').textContent = showA ? '문제와 답' : '문제';
    if (showA) reveal();
    const myIdx = wi;
    let act = await Promise.race([speak(c.q).then(() => (walking && wi === myIdx && wResolve) ? waitInput(pause) : new Promise(() => { })), new Promise(r => { wResolve = r; })]);
    if (!walking) return;
    reveal(); $('wStatus').textContent = '정답 — 탭: 알았다 / ← 밀기: 몰랐다';
    if (act === 'timeout') { await speak('정답. ' + c.a); if (!walking) return; if ($('wReadExp').checked && c.exp) { await speak('해설. ' + c.exp); if (!walking) return; } act = await waitInput(5000); }
    if (!walking) return;
    if (act === 'know') grade(c.id, true);
    else if (act === 'wrong') { grade(c.id, false); await speak('다시 볼게요'); }
    wi++;
  }
  if (walking) { $('wQ').textContent = '끝! 수고했어요 🎉'; $('wA').textContent = ''; $('wStatus').textContent = ''; await speak('끝났어요. 수고했어요.'); }
}
$('wStart').onclick = async () => {
  wDeck = shuffle(filterCards($('wSubject').value, $('wScope').value).filter(c => inPart(c, $('wPart').value)));
  if (!wDeck.length) { alert('볼 카드가 없어요. 범위를 바꿔 보세요.'); return; }
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
$('wShowA').onchange = () => LS.set('ma_wshowa', $('wShowA').checked);
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
      <label>해설 (선택)</label><textarea data-k="exp" rows="3">${esc(c.exp || '')}</textarea>
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
  box.querySelectorAll('[data-k]').forEach(i => {
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
  let sums = [];
  try {
    const d = JSON.parse(txt);
    if (Array.isArray(d)) arr = d;
    else if (d.cards || d.summary || d.summaries) { arr = d.cards || []; sums = d.summaries || (d.summary ? [d.summary] : []); }
    else arr = [d];
  }
  catch { $('pasteMsg').textContent = '❌ JSON 형식이 아니에요. AI에게 "JSON 배열로만 다시 출력해줘"라고 요청하세요.'; return; }
  let n = 0;
  arr.forEach((c, i) => {
    if (!c.q || !c.a) return;
    c.id = c.id || `c-${Date.now()}-${i}`;
    if (allCards().some(x => x.id === c.id)) c.id += '-' + Math.random().toString(36).slice(2, 6);
    c.status = c.status === '확정' ? '확정' : '검수대기';
    c.lessonDate = c.lessonDate || today();
    c.blanks = Array.isArray(c.blanks) ? c.blanks : [];
    if (typeof c.order === 'number') c.order += Date.now() / 1000 | 0; // 새로 붙인 묶음은 기존 카드 뒤에 오게
    deleted = deleted.filter(d => d !== c.id);
    upsert(c); n++;
  });
  let m = 0;
  sums.forEach((s, i) => {
    if (!s || !s.body) return;
    s.id = s.id || `s-${Date.now()}-${i}`; s.lessonDate = s.lessonDate || today();
    s.subject = s.subject || arr[0]?.subject || ''; s.unit = s.unit || arr[0]?.unit || '';
    s.title = s.title || [s.subject, s.unit, s.lessonDate].filter(Boolean).join(' · ');
    delSums = delSums.filter(d => d !== s.id); localSums[s.id] = s; m++;
  });
  saveAll();
  $('pasteMsg').textContent = `✅ 요약본 ${m}개 · 카드 ${n}개 추가됨 → 카드는 '검수' 탭에서 확인 후 확정하세요.`;
  $('pasteBox').value = ''; refreshCommon();
};

// 외울 부분의 표시 기준은 매번 다름 (빨간 밑줄, 형광펜, 별표 등) → 입력한 기준을 요청문에 넣음
function buildPrompt(rule) {
  rule = (rule || '').trim();
  const pick = rule
    ? `- ★ 포함 기준: "${rule}" 부분만 사용해. 기준에 해당하지 않는 본문·사진 설명·탐구 활동은 빼.`
    : `- ★ 포함 기준: 사진 속에 표시(밑줄·형광펜·별표·동그라미·손글씨 등)된 부분만 사용해. 어떤 표시를 기준으로 삼았는지 맨 앞 "rule"에 적어. 표시가 전혀 없으면 핵심 내용 위주로.`;
  const tag = rule || '표시한 부분';
  return `첨부한 교과서·필기 사진으로 암기장 데이터를 만들어줘.
- 과목: 한국사 / 단원: "03-1 4·19 혁명"처럼 번호+제목 / 쪽: p.○~○ / 수업일: YYYY-MM-DD
${pick}
- 사진에 없는 내용은 절대 추가하지 마. 글씨가 안 보이면 "판독불가".

[cards] 기준에 해당하는 문장 하나 = 카드 하나, 교과서 순서대로
- topic: 그 문장이 있는 교과서 소제목 (예: "3·15 부정 선거를 자행하다")
- sentence: 해당 문장을 한 문장으로 (표시 앞뒤 몇 글자는 이어 써도 됨, 내용은 원문 그대로)
- blanks: sentence 안에 글자 그대로 들어 있는 핵심어 1~4개 (사건명·인물·연도·제도 이름 우선)
- q: 걸으면서 들어도 이해되는 짧은 질문, a: 짧은 답
- exp: 사진 속 보충 설명(각주·사진 설명·손글씨 메모)이 있을 때만 1~2문장, 없으면 ""
- order: 1부터 순서대로 번호

[summary] 단원 요약: body는 "## 소제목" 아래 "- 문장" 형식, 줄바꿈은 \n

출력은 아래 JSON 하나로만, 설명 없이:
{"rule":"${tag}","summary":{"subject":"","unit":"","lessonDate":"","title":"","body":"## 소제목\n- 문장","source":"교과서 p.○ (${tag})"},
 "cards":[{"subject":"","unit":"","topic":"","order":1,"lessonDate":"","q":"","a":"","exp":"","sentence":"","blanks":[""],"source":"교과서 p.○ (${tag})","status":"검수대기"}]}`;
}
$('markRule').value = LS.get('ma_markrule', '');
const refreshPrompt = () => { LS.set('ma_markrule', $('markRule').value); $('promptBox').value = buildPrompt($('markRule').value); };
$('markRule').oninput = refreshPrompt; refreshPrompt();
$('copyPrompt').onclick = async () => { const t = buildPrompt($('markRule').value); try { await navigator.clipboard.writeText(t); alert('복사됨'); } catch { $('promptBox').select(); document.execCommand('copy'); } };

/* ===== 백업 ===== */
function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('exportBtn').onclick = () => download(`암기장-백업-${today()}.json`, { localCards, deleted, prog, stars, localSums, delSums });
$('exportSums').onclick = () => download('summaries.json', allSums());
$('exportCards').onclick = () => download('cards.json', confirmed());
$('importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    Object.assign(localCards, d.localCards || {});
    deleted = [...new Set([...deleted, ...(d.deleted || [])])];
    Object.assign(localSums, d.localSums || {}); delSums = [...new Set([...delSums, ...(d.delSums || [])])]; stars = [...new Set([...stars, ...(d.stars || [])])];
    for (const [id, p] of Object.entries(d.prog || {})) if (!prog[id] || (p.due || 0) > (prog[id].due || 0)) prog[id] = p;
    saveAll(); refreshCommon(); alert('가져오기 완료');
  } catch { alert('백업 파일을 읽지 못했어요'); }
  e.target.value = '';
};

/* ===== 요약본 ===== */
function mdLite(t) {
  const out = []; let ul = false;
  String(t || '').split('\n').forEach(l => {
    const s = l.trim();
    if (/^[-•*]\s+/.test(s)) { if (!ul) { out.push('<ul>'); ul = true; } out.push('<li>' + esc(s.replace(/^[-•*]\s+/, '')) + '</li>'); return; }
    if (ul) { out.push('</ul>'); ul = false; }
    if (/^#{1,4}\s+/.test(s)) out.push('<h4>' + esc(s.replace(/^#+\s+/, '')) + '</h4>');
    else if (s) out.push('<p>' + esc(s) + '</p>');
  });
  if (ul) out.push('</ul>');
  return out.join('').replace(/★/g, '<b>★</b>');
}
// kind: 'note' = 사진 속 손글씨 필기만 모은 요약. 필기 요약이 있는 과목에서만 '전체 요약 / 필기만' 칩이 보임.
let mKind = 'sum';
function renderSums() {
  const s = $('mSubject').value;
  const mine = allSums().filter(x => !s || s === '*' || x.subject === s);
  const hasNote = mine.some(x => x.kind === 'note');
  if (!hasNote) mKind = 'sum';
  $('mKinds').innerHTML = hasNote ? [['sum', '전체 요약'], ['note', '✏️ 필기만']].map(([v, l]) => `<button class="chip ${v === mKind ? 'on' : ''}" data-k="${v}">${l}</button>`).join('') : '';
  $('mKinds').querySelectorAll('.chip').forEach(b => b.onclick = () => { mKind = b.dataset.k; renderSums(); });
  const list = mine.filter(x => (x.kind === 'note') === (mKind === 'note')).sort((a, b) => mKind === 'note' ? (a.unit || '').localeCompare(b.unit || '') : 0);
  $('sumList').innerHTML = list.length ? list.map(x => `
    <details class="scard" data-id="${esc(x.id)}" ${mKind === 'note' ? 'open' : ''}>
      <summary><label onclick="event.stopPropagation()"><input type="checkbox" class="mpick"></label> ${esc(x.title || x.unit || '요약')}
        <div class="smeta">${esc([x.subject, x.unit, x.lessonDate, x.source].filter(Boolean).join(' · '))}</div></summary>
      <div class="sbody">${mdLite(x.body)}</div>
      <div class="row"><button class="btn small" data-act="edit">수정</button><button class="btn small bad" data-act="del">삭제</button></div>
      <div class="sedit hidden">
        <input type="text" data-k="title" value="${esc(x.title || '')}" style="width:100%" placeholder="제목">
        <textarea data-k="body" rows="12">${esc(x.body || '')}</textarea>
        <div class="row"><button class="btn small good" data-act="save">저장</button></div>
      </div>
    </details>`).join('') : '<p class="muted">아직 요약본이 없어요. "+ 요약 직접 쓰기"를 누르세요.</p>';
}
$('mSubject').onchange = renderSums;
$('sumList').onclick = e => {
  const act = e.target.dataset.act; if (!act) return;
  const box = e.target.closest('.scard'), id = box.dataset.id;
  const x = { ...allSums().find(v => v.id === id) };
  if (act === 'edit') { box.querySelector('.sedit').classList.toggle('hidden'); return; }
  if (act === 'del') { if (!confirm('이 요약본을 삭제할까요?')) return; delSums.push(id); delete localSums[id]; }
  if (act === 'save') { box.querySelectorAll('.sedit [data-k]').forEach(i => x[i.dataset.k] = i.value); localSums[id] = x; }
  saveAll(); renderSums();
};
$('mNew').onclick = () => {
  const subj = prompt('과목?', $('mSubject').value !== '*' ? $('mSubject').value : ''); if (subj === null) return;
  const unit = prompt('단원?', '') ?? '';
  const id = 's-' + Date.now();
  localSums[id] = { id, subject: subj, unit, lessonDate: today(), title: [subj, unit, today()].filter(Boolean).join(' · '), body: '## 소제목\n- 내용' };
  saveAll(); refreshCommon(); renderSums();
  const box = document.querySelector(`.scard[data-id="${id}"]`); if (box) { box.open = true; box.querySelector('.sedit').classList.remove('hidden'); }
};
$('mPrint').onclick = () => {
  let ids = [...document.querySelectorAll('.scard')].filter(b => b.querySelector('.mpick').checked).map(b => b.dataset.id);
  if (!ids.length) { if (!confirm('체크한 요약이 없어요. 보이는 요약을 모두 저장할까요?')) return; ids = [...document.querySelectorAll('.scard')].map(b => b.dataset.id); }
  const list = allSums().filter(x => ids.includes(x.id)).reverse();
  if (!list.length) return;
  $('sheet').innerHTML = `<div class="page"><div class="ph"><h3>수업 총 요약본</h3><div class="info">${list.length}개 수업 · 출력 ${today()}</div></div>` +
    list.map(x => `<div class="sumsec"><h3>${esc(x.title || x.unit)}</h3><div class="info" style="font-size:8.5pt;color:#555">${esc([x.subject, x.unit, x.lessonDate, x.source].filter(Boolean).join(' · '))}</div><div class="sbody">${mdLite(x.body)}</div></div>`).join('') + '</div>';
  $('sheet').classList.add('show'); setTimeout(() => window.print(), 100);
};

/* ===== 사료 ===== */
// data/sources.json: {id, subject, unit, title, text, cite, a, exp}. 맞히기 모드에서는 제목·정답을 가리고 사료만 보여 줌.
let baseSrcs = [], srcWrong = LS.get('ma_srcwrong', []), srcUnit = '*', srcOpen = {}, srcOrder = null;
function renderSrc() {
  const sj = curSubject && curSubject !== '*' ? curSubject : null;
  const all = baseSrcs.filter(s => !sj || s.subject === sj).sort(byOrder);
  const units = [...new Set(all.map(s => s.unit || '기타'))];
  if (srcUnit !== '*' && !units.includes(srcUnit)) srcUnit = '*';
  $('srcUnits').innerHTML = [['*', '전체']].concat(units.map(u => [u, u])).map(([v, l]) => `<button class="chip ${v === srcUnit ? 'on' : ''}" data-u="${esc(v)}">${esc(l)}</button>`).join('');
  $('srcUnits').querySelectorAll('.chip').forEach(b => b.onclick = () => { srcUnit = b.dataset.u; srcOpen = {}; srcOrder = null; renderSrc(); });
  let list = all.filter(s => srcUnit === '*' || (s.unit || '기타') === srcUnit);
  if ($('srcWrongOnly').checked) list = list.filter(s => srcWrong.includes(s.id));
  const quiz = $('srcMode').value === 'quiz';
  if (quiz && $('srcShuffle').checked) {
    if (!srcOrder) srcOrder = shuffle(list.map(s => s.id));
    list = list.slice().sort((x, y) => srcOrder.indexOf(x.id) - srcOrder.indexOf(y.id));
  }
  $('srcList').innerHTML = list.length ? list.map((s, i) => {
    const open = !quiz || srcOpen[s.id], st = srcOpen[s.id];
    return `<div class="src ${srcWrong.includes(s.id) ? 'hasWrong' : ''}" data-id="${esc(s.id)}">
      <div class="srch">${quiz && !open ? `사료 ${i + 1}` : `${esc(s.title || '사료')}<small>${esc(s.unit || '')}</small>`}</div>
      <div class="srct">${esc(s.text)}</div>
      ${s.cite && !(quiz && !open && /기출/.test(s.title || '')) ? `<div class="srcc">- ${esc(s.cite)} -</div>` : ''}
      ${open ? `<div class="srca">→ ${esc(s.a)}</div>${s.exp ? `<div class="srce">💡 ${esc(s.exp)}</div>` : ''}` : `<button class="btn small" data-act="show">무엇에 대한 사료일까? (탭해서 정답 보기)</button>`}
      ${quiz && open ? `<div class="row"><button class="btn small bad ${st === 'no' ? 'on' : ''}" data-act="no">몰랐다</button><button class="btn small good ${st === 'ok' ? 'on' : ''}" data-act="ok">알았다</button></div>` : ''}
    </div>`;
  }).join('') : `<p class="muted center" style="padding:30px 0">${all.length ? '여기에 해당하는 사료가 없어요 🎉' : '이 과목에는 아직 사료가 없어요.'}</p>`;
  $('srcTip').textContent = quiz ? '사료를 읽고 무엇에 대한 것인지 떠올린 뒤 탭해서 확인하세요. \'몰랐다\'를 누른 사료는 \'틀린 것만\'에 모여요.' : '사료와 정답·해설을 함께 보는 모드예요.';
}
$('srcList').onclick = e => {
  const act = e.target.dataset.act; if (!act) return;
  const id = e.target.closest('.src').dataset.id;
  if (act === 'show') srcOpen[id] = 'shown';
  else { srcOpen[id] = act; srcWrong = act === 'no' ? [...new Set([...srcWrong, id])] : srcWrong.filter(x => x !== id); LS.set('ma_srcwrong', srcWrong); }
  renderSrc();
};
['srcMode', 'srcShuffle', 'srcWrongOnly'].forEach(id => $(id).onchange = () => { srcOpen = {}; srcOrder = null; renderSrc(); });

/* ===== 원문·해석 ===== */
// data/texts.json: {id, subject, unit, title, author, note, source, parts: [{name, lines: [[원문, 해석, 풀이·필기]]}]}
let baseTxts = [], txtCur = null, txtOpen = {};
function renderTxt() {
  const sj = curSubject && curSubject !== '*' ? curSubject : null;
  const all = baseTxts.filter(t => !sj || t.subject === sj).sort(byOrder);
  if (!all.some(t => t.id === txtCur)) txtCur = all[0]?.id || null;
  $('txtWorks').innerHTML = all.map(t => `<button class="chip ${t.id === txtCur ? 'on' : ''}" data-id="${esc(t.id)}">${esc(t.title)}</button>`).join('');
  $('txtWorks').querySelectorAll('.chip').forEach(b => b.onclick = () => { txtCur = b.dataset.id; txtOpen = {}; renderTxt(); window.scrollTo(0, 0); });
  const onChip = $('txtWorks').querySelector('.on'); if (onChip) $('txtWorks').scrollLeft = onChip.offsetLeft - 20;
  const t = all.find(x => x.id === txtCur);
  if (!t) { $('txtBox').innerHTML = '<p class="muted center" style="padding:30px 0">이 과목에는 아직 원문이 없어요.</p>'; $('txtTip').textContent = ''; return; }
  const showT = $('txtTrans').checked, showN = $('txtNote').checked;
  const hasT = t.parts.some(p => p.lines.some(l => l[1]));
  let n = 0;
  $('txtBox').innerHTML = `<div class="txth"><b>${esc(t.title)}</b><small>${esc([t.author, t.source].filter(Boolean).join(' · '))}</small>${t.note ? `<small>${esc(t.note)}</small>` : ''}</div>` +
    t.parts.map(p => (p.name ? `<div class="btopic">${esc(p.name)}</div>` : '') + '<div class="txt">' + p.lines.map(([o, tr, note]) => {
      n++; const open = showT || txtOpen[n];
      return `<div class="tline ${tr && !showT ? 'tap' : ''}" data-n="${n}"><span class="tn">${n}</span><div><div class="ro">${esc(o)}</div>${tr && open ? `<div class="rt">${esc(tr)}</div>` : ''}${note && showN ? `<div class="tnote">${esc(note)}</div>` : ''}</div></div>`;
    }).join('') + '</div>').join('');
  $('txtTip').textContent = !hasT ? '' : showT ? '\'해석 보기\'를 끄면 원문만 보고 뜻을 떠올린 뒤, 행을 눌러 해석을 확인할 수 있어요.' : '행을 누르면 그 행의 해석이 보여요.';
}
$('txtBox').onclick = e => { const l = e.target.closest('.tline.tap'); if (!l) return; txtOpen[l.dataset.n] = !txtOpen[l.dataset.n]; renderTxt(); };
['txtTrans', 'txtNote'].forEach(id => $(id).onchange = () => { txtOpen = {}; renderTxt(); });

/* ===== 시작 ===== */
async function init() {
  try { const r = await fetch('data/cards.json', { cache: 'no-cache' }); baseCards = await r.json(); } catch { baseCards = []; }
  try { const r = await fetch('data/summaries.json', { cache: 'no-cache' }); baseSums = await r.json(); } catch { baseSums = []; }
  try { const r = await fetch('data/sources.json', { cache: 'no-cache' }); baseSrcs = await r.json(); } catch { baseSrcs = []; }
  try { const r = await fetch('data/texts.json', { cache: 'no-cache' }); baseTxts = await r.json(); } catch { baseTxts = []; }
  refreshCommon(); startDeck();
  if (MANAGE) { document.body.classList.add('manage'); goTab('review'); return; }
  if (!curSubject || !subjects().includes(curSubject)) showPicker();
  else renderBlank();
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
init();
