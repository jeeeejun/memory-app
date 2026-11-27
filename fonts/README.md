# 옛한글 글꼴

`yethangul-Regular.woff2`, `yethangul-Bold.woff2` — 속미인곡·시조 같은 옛한글(아래아 ᆞ, 첫가끝 자모 U+1100~11FF 등)을
아이폰에서도 한 글자로 모아 보이게 하려고 넣은 글꼴. 옛한글 자모만 남긴 부분 글꼴이다(각 약 150KB).

- 원본: Noto Sans CJK KR (notofonts/noto-cjk, `Sans/SubsetOTF/KR/NotoSansKR-Regular.otf`, `-Bold.otf`)
- 만든 방법: `pyftsubset NotoSansKR-Regular.otf --unicodes="U+1100-11FF,U+A960-A97F,U+D7B0-D7FF,U+302E-302F,U+25CC" --layout-features='ljmo,vjmo,tjmo,ccmp,locl,kern,palt,vert' --flavor=woff2`
- 라이선스: SIL Open Font License 1.1 (https://openfontlicense.org) — © Adobe (Source Han Sans), Noto 글꼴 프로젝트.
- 쓰는 곳: `theme.css`의 `@font-face "YetHangul"` (unicode-range로 옛한글 자모에만 적용, 그런 글자가 있는 화면에서만 내려받음).
