/* 간단한 비밀번호 잠금 (국어). 기기 안에서만 확인하는 가벼운 잠금이다 — 소스를 열어 보면 풀 수 있으니 진짜 보안용이 아니다.
   - 비밀번호는 글자 그대로 두지 않고 hash()값만 둔다. 바꾸려면 브라우저 콘솔에서 Lock.hash('새 비번')을 구해 HASH에 넣는다.
   - 한 번 맞히면 앱을 끌 때까지(sessionStorage) 다시 묻지 않는다.
   쓰는 법: Lock.require('국어', 맞혔을 때, 취소했을 때) */
(function () {
  const HASH = { '국어': '824b96ac' };   // 국어 비밀번호의 hash 값
  const hash = s => { let h = 0x811c9dc5; for (const ch of '암기장|' + s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const KEY = n => 'lock_ok_' + n;
  const isOpen = n => !HASH[n] || sessionStorage.getItem(KEY(n)) === '1';
  const css = `.lk{position:fixed;inset:0;z-index:1000;background:var(--bg,#f5f6f9);color:var(--text,#161a24);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:calc(env(safe-area-inset-top) + 20px) 24px calc(env(safe-area-inset-bottom) + 20px);font-family:var(--sans,system-ui,sans-serif);touch-action:manipulation}
.lk h2{margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
.lk p{margin:0;color:var(--muted,#6c7488);font-size:.95rem}
.lk .dots{display:flex;gap:16px;margin:6px 0 4px}
.lk .dots i{width:16px;height:16px;border-radius:50%;border:2px solid var(--line2,#cfd4df)}
.lk .dots i.on{background:var(--accent,#4f46e5);border-color:var(--accent,#4f46e5)}
.lk .msg{min-height:1.3em;color:var(--no-fg,#b91c1c);font-weight:700;font-size:.92rem}
.lk .pad{display:grid;grid-template-columns:repeat(3,76px);gap:14px}
.lk .pad button{height:76px;border-radius:50%;border:1px solid var(--line,#e1e4ec);background:var(--surface,#fff);color:var(--text,#161a24);font:600 1.6rem var(--sans,system-ui);cursor:pointer;-webkit-tap-highlight-color:transparent}
.lk .pad button:active{background:var(--accent-soft,rgba(79,70,229,.1))}
.lk .pad button.tx{border:0;background:none;font-size:1rem;color:var(--sub,#3b4254)}
.lk.shake .dots{animation:lkshake .35s}
@keyframes lkshake{20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}`;
  function require(name, onOk, onCancel) {
    if (isOpen(name)) { onOk && onOk(); return; }
    if (!document.getElementById('lkStyle')) { const st = document.createElement('style'); st.id = 'lkStyle'; st.textContent = css; document.head.appendChild(st); }
    document.querySelectorAll('.lk').forEach(x => x.remove());
    const box = document.createElement('div'); box.className = 'lk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', name + ' 비밀번호');
    box.innerHTML = `<h2>🔒 ${name}</h2><p>비밀번호 4자리를 눌러 주세요</p><div class="dots">${'<i></i>'.repeat(4)}</div><div class="msg"></div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button class="tx" data-a="cancel">취소</button><button data-n="0">0</button><button class="tx" data-a="del" aria-label="지우기">⌫</button></div>`;
    document.body.appendChild(box);
    let v = '';
    const draw = () => box.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i < v.length));
    const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
    const press = k => {
      if (k === 'cancel') { close(); onCancel && onCancel(); return; }
      if (k === 'del') { v = v.slice(0, -1); draw(); return; }
      if (v.length >= 4) return;
      v += k; draw(); box.querySelector('.msg').textContent = '';
      if (v.length === 4) setTimeout(() => {
        if (hash(v) === HASH[name]) { sessionStorage.setItem(KEY(name), '1'); close(); onOk && onOk(); }
        else { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); box.querySelector('.msg').textContent = '비밀번호가 달라요'; v = ''; draw(); }
      }, 120);
    };
    const onKey = e => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Escape') press('cancel'); };
    box.addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.n ?? b.dataset.a); });
    document.addEventListener('keydown', onKey);
  }
  window.Lock = { require, isOpen, hash };
})();
