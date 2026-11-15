'use strict';
/* 마인드맵: 가지를 누르면 펴지고, 펼수록 구체적인 내용이 나오는 그림.
   index.html(과목 마인드맵 탭)과 vocab.html(지문 학습의 흐름 맵)이 같이 쓴다. 모양은 mindmap.css.

   const mm = MindMap(el, { onToggle });  mm.render(tree, storeKey);   // storeKey = 열림 상태를 저장할 localStorage 이름
   노드 = {
     id,                 // 열림 상태를 기억하는 이름 (바꾸면 그 가지의 열림 기록만 사라짐)
     tag, label | html,  // 앞머리 꼬리표(예: "03-1"), 제목(글자 또는 미리 만든 HTML)
     sub,                // 접혀 있을 때 아래에 보이는 한 줄 미리 보기
     chain: [{t, to}],   // 흐름 칩. 접혀 있으면 한 줄 글로, 펴면 누를 수 있는 칩으로. to = 눌렀을 때 찾아갈 노드 id
     sep,                // 칩 사이 기호 (기본 "→", 순서가 없으면 "·")
     body,               // 폈을 때 나오는 설명(HTML)
     children, extra,    // 아래 가지 / 색 없는 덧가지(사료·필기 등)
     seq,                // children이 순서 있는 단계면 true → 번호와 화살표
     count, mark, cls    // 오른쪽 숫자, 작은 표시(💡 등), 크기 종류: big | mid | sm | txt
   } */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HUES = [221, 152, 27, 280, 344, 188];

  function MindMap(el, opts) {
    opts = opts || {};
    let root = null, index = {}, open = new Set(), key = null;
    const save = () => { if (key) try { localStorage.setItem(key, JSON.stringify([...open])); } catch (e) { } };
    const kids = n => (n.children || []).concat(n.extra || []);
    const expandable = n => !!(kids(n).length || n.body);

    function walk(n, depth, parent, hue) {
      index[n.id] = { n, depth, parent, hue };
      (n.children || []).forEach((c, i) => walk(c, depth + 1, n, depth === 0 ? HUES[i % HUES.length] : null));
      (n.extra || []).forEach(c => walk(c, depth + 1, n, null));
    }
    function listHtml(list, depth, seq, neutral) {
      return `<ul class="mm-ch${seq ? ' seq' : ''}${neutral ? ' neu' : ''}">` +
        list.map((c, i) => (seq && i ? '<li class="mm-arr" aria-hidden="true"></li>' : '') + nodeHtml(c, depth)).join('') + '</ul>';
    }
    function nodeHtml(n, depth) {
      const isOpen = depth === 0 || open.has(n.id), exp = expandable(n), hue = index[n.id].hue;
      const head = (n.tag ? `<span class="mm-tag">${esc(n.tag)}</span>` : '') + `<span class="mm-l">${n.html || esc(n.label || '')}</span>` +
        (n.mark ? `<span class="mm-mk">${esc(n.mark)}</span>` : '') + (n.count ? `<span class="mm-ct">${esc(n.count)}</span>` : '') +
        (exp && depth ? '<span class="mm-cv" aria-hidden="true"></span>' : '');
      const kind = depth === 0 ? 'root' : n.cls || ['big', 'mid', 'sm', 'txt'][Math.min(depth, 4) - 1];
      let h = `<li class="mm-n mm-${kind}${isOpen ? ' mm-open' : ''}${exp ? '' : ' mm-leaf'}" data-id="${esc(n.id)}"${hue != null ? ` style="--mmh:${hue}"` : ''}>`;
      h += exp && depth ? `<button type="button" class="mm-b" aria-expanded="${isOpen}">${head}</button>` : `<div class="mm-b">${head}</div>`;
      const chain = n.chain || [];
      if (!isOpen && (n.sub || chain.length)) h += `<div class="mm-sub">${esc(n.sub || chain.map(c => c.t).join(n.sep ? ` ${n.sep} ` : ' → '))}</div>`;
      if (isOpen) {
        if (chain.length) h += '<div class="mm-chain">' + chain.map((c, i) => '<span class="mm-lk">' + (c.to && index[c.to]
          ? `<button type="button" class="mm-chip" data-to="${esc(c.to)}">${esc(c.t)}</button>` : `<span class="mm-chip">${esc(c.t)}</span>`) +
          (i < chain.length - 1 ? `<i>${esc(n.sep || '→')}</i>` : '') + '</span>').join('') + '</div>';
        if (n.body) h += `<div class="mm-body">${n.body}</div>`;
        if ((n.children || []).length) h += listHtml(n.children, depth + 1, n.seq, false);
        if ((n.extra || []).length) h += listHtml(n.extra, depth + 1, false, true);
      }
      return h + '</li>';
    }
    function paint() { el.innerHTML = root ? `<ul class="mm">${nodeHtml(root, 0)}</ul>` : ''; }
    const liOf = id => [...el.querySelectorAll('.mm-n')].find(x => x.dataset.id === id);

    function toggle(id) {
      const it = index[id]; if (!it || !it.depth || !expandable(it.n)) return;
      open.has(id) ? open.delete(id) : open.add(id); save();
      const li = liOf(id); if (li) li.outerHTML = nodeHtml(it.n, it.depth); else paint();
      if (opts.onToggle) opts.onToggle();
    }
    // 그 가지까지 길을 모두 펴고 화면에 보여 줌 (흐름 칩을 눌렀을 때)
    function reveal(id) {
      let it = index[id]; if (!it) return;
      if (expandable(it.n)) open.add(id);
      for (let p = it.parent; p; p = index[p.id].parent) open.add(p.id);
      save(); paint();
      const li = liOf(id); if (!li) return;
      li.scrollIntoView({ block: 'center', behavior: 'smooth' });
      li.classList.add('mm-flash'); setTimeout(() => li.classList.remove('mm-flash'), 1800);
      if (opts.onToggle) opts.onToggle();
    }
    // 깊이 d까지 한꺼번에 펴기: 1 = 첫 가지만 보임, 2 = 그 아래까지 … / withBody = 맨 끝 가지의 설명(body)까지 펴기
    function expandTo(d, withBody) {
      open = new Set(Object.keys(index).filter(id => { const x = index[id]; return x.depth > 0 && (kids(x.n).length ? x.depth < d : withBody && !!x.n.body); }));
      save(); paint();
    }
    el.addEventListener('click', e => {
      const chip = e.target.closest('.mm-chip[data-to]'); if (chip) { reveal(chip.dataset.to); return; }
      const b = e.target.closest('button.mm-b'); if (b) toggle(b.closest('.mm-n').dataset.id);
    });
    return {
      // 저장된 열림 상태가 없으면(처음 열면) firstDepth까지 펴서 보여 줌
      render(tree, storeKey, firstDepth) {
        root = tree; index = {}; key = storeKey || null; if (root) walk(root, 0, null, null);
        let saved = null; try { saved = JSON.parse(localStorage.getItem(key)); } catch (e) { }
        if (Array.isArray(saved)) { open = new Set(saved); paint(); } else expandTo(firstDepth || 1);
      },
      expandTo, reveal, toggle
    };
  }
  window.MindMap = MindMap;
})();
