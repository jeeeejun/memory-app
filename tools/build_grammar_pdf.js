// 국어 문법 문제지 PDF 만들기: node tools/build_grammar_pdf.js [시트id ...]
// grammar-sheet.html?id=<id>&print=1 을 A4 PDF 로 저장 → pdf/grammar-<id>.pdf
// 한글 글꼴: 저장소에는 글꼴을 두지 않고, 실행할 때 @fontsource/noto-sans-kr 를 임시 폴더에 내려받아 끼운다.
// spacing(띄어쓰기 50제)은 사용자가 준 PDF 원본을 그대로 쓰므로 여기서 다시 만들지 않는다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['spacing']);

function fontDir() {
  const dir = path.join(os.tmpdir(), 'grammar-pdf-fonts');
  const pkg = path.join(dir, 'node_modules', '@fontsource', 'noto-sans-kr');
  if (!fs.existsSync(pkg)) { fs.mkdirSync(dir, { recursive: true }); execSync('npm i --silent --no-audit --no-fund @fontsource/noto-sans-kr', { cwd: dir, stdio: 'inherit' }); }
  return pkg;
}
function serve(root, fontPkg) {
  const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript' };
  return http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = u.startsWith('/__font/') ? path.join(fontPkg, u.slice(8)) : path.join(root, u);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
}
(async () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'grammar-sheets.json'), 'utf8'));
  const want = process.argv.slice(2);
  const ids = data.sheets.map(s => s.id).filter(id => !SKIP.has(id) && (!want.length || want.includes(id)));
  const fontPkg = fontDir();
  const srv = serve(ROOT, fontPkg); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const css = ['400', '700'].map(w => `@font-face{font-family:"Noto Sans KR";font-weight:${w};src:url(/__font/files/noto-sans-kr-korean-${w}-normal.woff2) format("woff2")}`).join('') + 'body{font-family:"Noto Sans KR",sans-serif!important}';
  const b = await chromium.launch(); const p = await b.newPage();
  fs.mkdirSync(path.join(ROOT, 'pdf'), { recursive: true });
  for (const id of ids) {
    await p.goto(`http://127.0.0.1:${port}/grammar-sheet.html?id=${id}&print=1`);
    await p.addStyleTag({ content: css });
    await p.waitForFunction(() => document.body.dataset.ready === '1');
    await p.evaluate(() => document.fonts.ready); await p.emulateMedia({ media: 'print' });
    const out = path.join(ROOT, 'pdf', `grammar-${id}.pdf`);
    await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(out, Math.round(fs.statSync(out).size / 1024) + 'KB');
  }
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
