# 빠바 구문독해 7·8과 지문 전체 본문을 vocab.html 의 passage-data 에 "full" 로 넣는다.
# 본문 출처: english.html 의 eng-data (사용자가 보낸 빠바 7·8과 어형변화 학습지 사진을 옮긴 것). 빈칸 [01] 은 정답으로 채운다.
# full = [{"en": 문장, "k": 핵심 문장 번호(sentences 의 index) 또는 -1}, ...]  — 지문 전체 보기의 '해설 보기'에서 핵심 문장 표시에 쓴다.
# 학습지에 없는 문장(예: 08-7 무관한 문장)은 full 에 없다. 학습지는 정답 순서로 이어진 지문이다.
import json, os, re, difflib
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
def block(path, marker):
    s = open(path, encoding="utf-8").read()
    k = [m.end() for m in re.finditer(re.escape(marker), s)][-1]
    j = s.index("</script>", k)
    return s, k, j
s_e, k, j = block(os.path.join(ROOT, "english.html"), 'id="eng-data">')
E = json.loads(s_e[k:j])
vp = os.path.join(ROOT, "vocab.html")
s_v, k, j = block(vp, 'id="passage-data">')
V = json.loads(s_v[k:j])
byid = {p["id"]: p for p in V}
norm = lambda t: re.sub(r"[^a-z0-9]", "", re.sub(r"\([^)]{1,12}\)", "", t.lower().replace("“", '"').replace("”", '"').replace("’", "'")))
for e in E:
    vid = "%02d-%d" % tuple(map(int, e["id"].split("-")))
    p = byid[vid]
    fill = lambda t: re.sub(r"\[(\d\d)\]", lambda m: e["b"][int(m.group(1)) - 1][1].split("|")[0], t)
    full, used = [], set()
    keys = [norm(x["en"]) for x in p.get("sentences", [])]
    for t in e["text"]:
        en = fill(t); n = norm(en); best, bi = 0, -1
        for i, kk in enumerate(keys):
            if not kk: continue
            m = sum(b.size for b in difflib.SequenceMatcher(None, n, kk, autojunk=False).get_matching_blocks())
            r = max(m / len(kk), m / len(n))   # 핵심 문장이 지문 문장의 일부이거나, 두 문장을 합친 것이어도 연결
            if r > best: best, bi = r, i
        k_idx = bi if best >= 0.85 else -1
        if k_idx >= 0: used.add(k_idx)
        full.append({"en": en, "k": k_idx})
    p["full"] = full
    miss = [i for i in range(len(keys)) if i not in used]
    print(vid, len(full), "문장 · 핵심 문장 연결", len(used), "/", len(keys), ("· 못 찾음 " + str(miss)) if miss else "")
body = "\n" + json.dumps(V, ensure_ascii=False, indent=1) + "\n"
s_v = s_v[:k] + body + s_v[j:]
open(vp, "w", encoding="utf-8").write(s_v)
