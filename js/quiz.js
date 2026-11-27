/* ============================================================
   Bộ tạo câu hỏi + đáp án nhiễu (dễ nhầm lẫn) cho từ vựng N1
   ============================================================ */

// ---------- Chuẩn hoá dữ liệu ----------
const isKataStr = s => /^[゠-ヿー]+$/.test(s);
const isHiraStr = s => /^[぀-ゟー]+$/.test(s);
const isHiraCh = c => /[぀-ゟ]/.test(c);
const isKanjiCh = c => /[一-鿿々]/.test(c);
const hasKanji = s => /[一-鿿々]/.test(s);

const ADV_SET = new Set(['悉く', '隈なく', '予め', '概ね', '最早', '予々', '薄々', '目下', '根こそぎ', '一先ず', '取り分け', '今更', '若干', '当面', '随時', '急遽', '人一倍', 'つくづく']);
const NOUN_SET = new Set(['憩い', 'ぞんざい']);

function detectPos(word, kana) {
  if (isKataStr(word)) return 'kata';
  if (ADV_SET.has(word)) return 'adv';
  if (NOUN_SET.has(word)) return 'noun';
  if (/する$/.test(kana)) return 'verb';
  if (isHiraStr(word) && /^(..)\1$/.test(kana)) return 'adv';        // じめじめ, くよくよ
  if (isHiraStr(word) && /[っん].り$/.test(kana)) return 'adv';       // てっきり, すんなり
  const last = word[word.length - 1];
  if (isHiraCh(last)) {
    if (/(に|と|て|ず|も)$/.test(kana)) return 'adv';
    if (/い$/.test(kana)) return 'iadj';
    if (/[うくぐすつぬぶむる]$/.test(kana)) return 'verb';
  }
  return 'noun';
}

const POS_LABEL = { verb: 'Động từ', iadj: 'Tính từ -い', adv: 'Phó từ', kata: 'Katakana', noun: 'Danh từ / Tính từ -な' };

const STOP = new Set(['sự', 'của', 'và', 'là', 'có', 'được', 'bị', 'một', 'cách', 'thường', 'dùng', 'với', 'ra', 'vào', 'làm', 'cho', 'người', 'việc', 'khi', 'không']);

function tokens(s) {
  return s.toLowerCase().replace(/[()]/g, ' ').split(/[\s,;\/]+/).filter(t => t && !STOP.has(t));
}
function phrases(s) {
  return s.toLowerCase().replace(/\(.*?\)/g, '').split(/[,;]/).map(p => p.trim()).filter(Boolean);
}

const WORDS = VOCAB_RAW.map((r, i) => {
  const kanaAll = r[3].split('/').map(s => s.trim()).filter(Boolean);
  const kana = kanaAll[0];
  const hvRaw = r[2] || '';
  const hvIsSino = hvRaw && hvRaw === hvRaw.toUpperCase() && /[A-ZĐÀ-Ỹ]/.test(hvRaw);
  return {
    id: i,
    exam: r[0],
    year: r[0].slice(0, 4),
    word: r[1],
    kana, kanaAll,
    hv: hvIsSino ? hvRaw : '',
    origin: hvIsSino ? '' : hvRaw,
    mean: r[4],
    syn: r[5] || '',
    ex: r[6] || '',
    exVi: r[7] || '',
    freq: i < FREQ_COUNT,
    pos: detectPos(r[1], kana),
    kanjiSet: new Set([...r[1]].filter(isKanjiCh)),
    hvSyl: new Set(hvIsSino ? hvRaw.split(/\s+/) : []),
    tok: new Set(tokens(r[4])),
    phr: phrases(r[4]),
  };
});

// ---------- Tiện ích ----------
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pick = a => a[Math.floor(Math.random() * a.length)];

// Hai nghĩa có "gần như giống nhau" không? (để tránh 2 đáp án cùng đúng)
function meaningClash(a, b) {
  if (a.mean.toLowerCase() === b.mean.toLowerCase()) return true;
  for (const p of a.phr) for (const q of b.phr) {
    if (p === q || (p.length > 4 && q.includes(p)) || (q.length > 4 && p.includes(q))) return true;
  }
  let shared = 0;
  for (const t of a.tok) if (b.tok.has(t)) shared++;
  const ratio = shared / Math.min(a.tok.size || 1, b.tok.size || 1);
  return shared >= 3 || ratio >= 0.6;
}
function sameWord(a, b) {
  return a.id === b.id || a.word === b.word || a.kanaAll.some(k => b.kanaAll.includes(k));
}

// Điểm "dễ nhầm" giữa từ đích và ứng viên (hình thức giống, nghĩa khác)
function confusability(t, c) {
  let s = 0;
  for (const k of t.kanjiSet) if (c.kanjiSet.has(k)) s += 5;             // chung chữ Hán
  for (const h of t.hvSyl) if (c.hvSyl.has(h)) s += 1.5;                 // chung âm Hán Việt
  if (t.pos === c.pos) s += 3;                                            // cùng loại từ
  if (t.kana.slice(0, 2) === c.kana.slice(0, 2)) s += 2.5;                // âm đầu giống
  else if (t.kana[0] === c.kana[0]) s += 1;
  if (t.kana.slice(-2) === c.kana.slice(-2)) s += 1.5;                    // đuôi giống (〜める, 〜しい)
  if (t.kana.length === c.kana.length) s += 1;
  if (t.word.length === c.word.length) s += 0.8;
  return s;
}

// Chọn n từ nhiễu cho từ đích
function pickDistractorWords(t, n, opts = {}) {
  const strictPos = !!opts.strictPos;
  let cands = WORDS.filter(c => !sameWord(t, c) && !meaningClash(t, c));
  if (opts.filter) cands = cands.filter(opts.filter);
  if (strictPos) {
    const same = cands.filter(c => c.pos === t.pos);
    if (same.length >= n + 3) cands = same;
  }
  const scored = cands.map(c => ({ c, s: confusability(t, c) + Math.random() * 3.5 }))
    .sort((a, b) => b.s - a.s);
  const out = [];
  for (const { c } of scored) {
    if (out.length >= n) break;
    if (out.some(o => sameWord(o, c) || meaningClash(o, c))) continue;
    out.push(c);
  }
  return out;
}

// ---------- Biến đổi cách đọc (bẫy JLPT) ----------
const DAKU = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ' };
const UNDAKU = Object.fromEntries(Object.entries(DAKU).map(([a, b]) => [b, a]));
Object.assign(UNDAKU, { ぱ: 'は', ぴ: 'ひ', ぷ: 'ふ', ぺ: 'へ', ぽ: 'ほ' });
const HANDAKU = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ', ば: 'ぱ', び: 'ぴ', ぶ: 'ぷ', べ: 'ぺ', ぼ: 'ぽ' };
const O_ROW = 'おこごそぞとどのほぼぽもよろょ';
const U_ROW = 'うくぐすずつぬふぶぷむゆるゅ';
const E_ROW = 'えけげせぜてでねへべぺめれ';
const TSU_OK = 'かきくけこさしすせそたちてとぱぴぷぺぽ';

// Phần cách đọc tương ứng với chữ Hán (không đụng vào okurigana)
function editableRange(w) {
  const s = w.word, k = w.kana;
  let lead = 0; while (lead < s.length && isHiraCh(s[lead])) lead++;
  let trail = 0; while (trail < s.length - lead && isHiraCh(s[s.length - 1 - trail])) trail++;
  return [lead, k.length - trail];
}

function readingVariants(w) {
  const k = w.kana;
  const [a, b] = editableRange(w);
  const res = new Map(); // variant -> loại bẫy
  const add = (v, why) => { if (v && v !== k && !w.kanaAll.includes(v) && !res.has(v) && !/^[っん]|っ$|っ[っんー]|んん/.test(v)) res.set(v, why); };
  for (let i = a; i < b; i++) {
    const c = k[i], prev = k[i - 1] || '', next = k[i + 1] || '';
    // 1. Trường âm
    if (c === 'う' && i > a && (O_ROW.includes(prev) || U_ROW.includes(prev))) add(k.slice(0, i) + k.slice(i + 1), 'trường âm');
    if (c === 'い' && i > a && E_ROW.includes(prev)) add(k.slice(0, i) + k.slice(i + 1), 'trường âm');
    if (O_ROW.includes(c) && next !== 'う' && next !== 'ょ' && i + 1 <= b) add(k.slice(0, i + 1) + 'う' + k.slice(i + 1), 'trường âm');
    if ((c === 'ゅ' || c === 'ょ') && next !== 'う') add(k.slice(0, i + 1) + 'う' + k.slice(i + 1), 'trường âm');
    // 2. Âm đục / bán đục
    if (DAKU[c]) add(k.slice(0, i) + DAKU[c] + k.slice(i + 1), 'âm đục');
    if (UNDAKU[c]) add(k.slice(0, i) + UNDAKU[c] + k.slice(i + 1), 'âm đục');
    if (HANDAKU[c] && i > a) add(k.slice(0, i) + HANDAKU[c] + k.slice(i + 1), 'âm bán đục');
    // 3. Âm ngắt っ
    if (c === 'っ') { add(k.slice(0, i) + k.slice(i + 1), 'âm ngắt っ'); add(k.slice(0, i) + 'つ' + k.slice(i + 1), 'âm ngắt っ'); }
    if (i > a && TSU_OK.includes(c) && prev !== 'っ' && prev !== 'ん' && isHiraCh(prev) && !'ゃゅょ'.includes(prev)) add(k.slice(0, i) + 'っ' + k.slice(i), 'âm ngắt っ');
    // 4. Âm ghép ゃゅょ
    if (c === 'ゅ') add(k.slice(0, i) + 'ょ' + k.slice(i + 1), 'âm ghép');
    if (c === 'ょ') add(k.slice(0, i) + 'ゅ' + k.slice(i + 1), 'âm ghép');
    if (c === 'ゃ' || c === 'ゅ' || c === 'ょ') add(k.slice(0, i) + ({ ゃ: 'や', ゅ: 'ゆ', ょ: 'よ' })[c] + k.slice(i + 1), 'âm ghép');
    // 5. ん
    if (c === 'ん') add(k.slice(0, i) + k.slice(i + 1), 'âm mũi ん');
  }
  return res;
}

function readingOptions(w) {
  const vars = [...readingVariants(w).entries()];
  // ưu tiên lấy 3 bẫy thuộc các loại khác nhau
  const byType = {};
  for (const [v, t] of shuffle(vars)) (byType[t] = byType[t] || []).push(v);
  const out = [];
  const types = shuffle(Object.keys(byType));
  while (out.length < 3 && types.some(t => byType[t].length)) {
    for (const t of types) { if (out.length < 3 && byType[t].length) out.push(byType[t].shift()); }
  }
  // Bẫy kép: kết hợp 2 biến đổi (khó hơn)
  if (out.length >= 1 && out.length < 3) {
    const tmp = { ...w, kana: out[0], kanaAll: [out[0]] };
    for (const [v] of readingVariants(tmp)) { if (out.length >= 3) break; if (!w.kanaAll.includes(v) && !out.includes(v)) out.push(v); }
  }
  // Dự phòng: cách đọc của từ khác cùng độ dài
  if (out.length < 3) {
    for (const c of pickDistractorWords(w, 6)) { if (out.length >= 3) break; if (!out.includes(c.kana)) out.push(c.kana); }
  }
  return out.slice(0, 3);
}

// ---------- Điền vào câu ----------
function blankSentence(w) {
  const s = w.ex;
  if (!s) return null;
  const forms = [w.word, ...w.kanaAll].sort((x, y) => y.length - x.length);
  for (const f of forms) {
    const i = s.indexOf(f);
    if (i >= 0) return { pre: s.slice(0, i), post: s.slice(i + f.length), blank: f, base: f, exact: true, kanaMode: f !== w.word };
  }
  if (w.pos === 'verb' || w.pos === 'iadj') {
    for (const f of [w.word, w.kana]) {
      if (f.length < 2) continue;
      const stem = f.endsWith('する') ? f.slice(0, -2) : f.slice(0, -1);
      if (!stem || (!hasKanji(stem) && stem.length < 2)) continue;
      const i = s.indexOf(stem);
      if (i < 0) continue;
      let j = i + stem.length, n = 0;
      while (j < s.length && isHiraCh(s[j]) && n < 6) { j++; n++; }
      return { pre: s.slice(0, i), post: s.slice(j), blank: s.slice(i, j), base: f, exact: false, kanaMode: f !== w.word };
    }
  }
  return null;
}

// ---------- Chia động từ / tính từ cho đáp án nhiễu ----------
const ROWS = {
  う: 'わいうえお', く: 'かきくけこ', ぐ: 'がぎぐげご', す: 'さしすせそ', つ: 'たちつてと',
  ぬ: 'なにぬねの', ぶ: 'ばびぶべぼ', む: 'まみむめも', る: 'らりるれろ',
};
const TE = { う: 'って', つ: 'って', る: 'って', む: 'んで', ぶ: 'んで', ぬ: 'んで', く: 'いて', ぐ: 'いで', す: 'して' };
const IE_ROW = 'いきぎしじちにひびみりえけげせぜてでねへべめれ';
const GODAN_EXC = new Set(['しくじる', 'ねる', 'さえぎる', 'はいる', 'しる', 'きる', 'かえる', 'はしる', 'いる', 'まいる', 'しゃべる', 'ちる', 'へる', 'すべる', 'よみがえる']);

function verbClass(d) {
  if (d.endsWith('する')) return 'suru';
  if (d.endsWith('る')) {
    const p = d[d.length - 2];
    if (p && IE_ROW.includes(p) && !GODAN_EXC.has(d)) return 'ichi';
  }
  return 'godan';
}

// Từ dạng từ điển D và dạng đã chia C → {f, rest}
function parseForm(D, C) {
  const cls = verbClass(D);
  if (cls === 'suru') {
    const c = C.slice(D.length - 2);
    if (c.startsWith('され')) return { f: 'pass', rest: c.slice(2) };
    if (c.startsWith('させ')) return { f: 'caus', rest: c.slice(2) };
    if (c.startsWith('すれ')) return { f: 'e', rest: c.slice(2) };
    if (c.startsWith('する')) return { f: 'dict', rest: c.slice(2) };
    if (c.startsWith('して')) return { f: 'te', rest: c.slice(2) };
    if (c.startsWith('した') && !c.startsWith('したい')) return { f: 'ta', rest: c.slice(2) };
    if (c.startsWith('し')) return { f: 'stem', rest: c.slice(1) };
    return null;
  }
  if (cls === 'ichi') {
    const c = C.slice(D.length - 1);
    if (c.startsWith('な') || c.startsWith('ず')) return { f: 'nai', rest: c };
    if (c === '' || c.startsWith('たい') || c.startsWith('ま')) return { f: 'stem', rest: c };
    if (c.startsWith('て')) return { f: 'te', rest: c.slice(1) };
    if (c.startsWith('た')) return { f: 'ta', rest: c.slice(1) };
    if (c.startsWith('られ')) return { f: 'pass', rest: c.slice(2) };
    if (c.startsWith('させ')) return { f: 'caus', rest: c.slice(2) };
    if (c.startsWith('れ')) return { f: 'e', rest: c.slice(1) };
    if (c.startsWith('よ')) return { f: 'o', rest: c.slice(1) };
    if (c.startsWith('る')) return { f: 'dict', rest: c.slice(1) };
    return { f: 'stem', rest: c };  // 〜やすい, 〜そうだ, 〜ながら
  }
  const last = D[D.length - 1], row = ROWS[last];
  if (!row) return null;
  const c = C.slice(D.length - 1);
  const te = TE[last];
  if (c[0] === te[0] && 'てでただ'.includes(c[1])) return { f: 'てで'.includes(c[1]) ? 'te' : 'ta', rest: c.slice(2) };
  const idx = row.indexOf(c[0]);
  const r = c.slice(1);
  if (idx === 0) {
    if (r.startsWith('れ')) return { f: 'pass', rest: r.slice(1) };
    if (r.startsWith('せ')) return { f: 'caus', rest: r.slice(1) };
    return { f: 'nai', rest: r };
  }
  if (idx === 1) return { f: 'stem', rest: r };
  if (idx === 2) return { f: 'dict', rest: r };
  if (idx === 3) return { f: 'e', rest: r };
  if (idx === 4) return { f: 'o', rest: r };
  return null;
}

function conjugate(D, form) {
  const { f, rest } = form, cls = verbClass(D);
  if (cls === 'suru') {
    const s = D.slice(0, -2);
    return s + ({ te: 'して', ta: 'した', nai: 'し', stem: 'し', dict: 'する', pass: 'され', caus: 'させ', e: 'すれ', o: 'しよ' })[f] + rest;
  }
  if (cls === 'ichi') {
    const s = D.slice(0, -1);
    return s + ({ te: 'て', ta: 'た', nai: '', stem: '', dict: 'る', pass: 'られ', caus: 'させ', e: rest.startsWith('ば') ? 'れ' : 'られ', o: 'よ' })[f] + rest;
  }
  const last = D[D.length - 1], row = ROWS[last], s = D.slice(0, -1);
  if (!row) return null;
  const te = TE[last];
  switch (f) {
    case 'te': return s + te + rest;
    case 'ta': return s + te[0] + (te[1] === 'で' ? 'だ' : 'た') + rest;
    case 'nai': return s + row[0] + rest;
    case 'stem': return s + row[1] + rest;
    case 'dict': return D + rest;
    case 'pass': return s + row[0] + 'れ' + rest;
    case 'caus': return s + row[0] + 'せ' + rest;
    case 'e': return s + row[3] + rest;
    case 'o': return s + row[4] + rest;
  }
  return null;
}

// Biến đổi từ nhiễu x về cùng dạng chia với từ đích trong câu
function inflectLike(target, b, x) {
  const xd = b.kanaMode ? x.kana : x.word;
  if (b.exact) return xd;
  const D = b.base;
  if (target.pos === 'iadj') {
    if (!xd.endsWith('い')) return null;
    return xd.slice(0, -1) + b.blank.slice(D.length - 1);
  }
  const form = parseForm(D, b.blank);
  if (!form) return null;
  return conjugate(xd, form);
}

// ---------- Từ đồng nghĩa ----------
const SYN_POOL = WORDS.filter(w => w.syn);
function synClash(a, b) {
  a = a.replace(/な$|に$/, ''); b = b.replace(/な$|に$/, '');
  return a === b || a.includes(b) || b.includes(a) || (a.length >= 2 && a.slice(0, 2) === b.slice(0, 2));
}
function synonymOptions(w) {
  const cands = SYN_POOL.filter(c => c.id !== w.id && !synClash(c.syn, w.syn) && !meaningClash(w, c) && c.syn !== w.word && c.syn !== w.kana)
    .map(c => ({ c, s: (c.pos === w.pos ? 3 : 0) + Math.random() * 4 }))
    .sort((a, b) => b.s - a.s);
  const out = [];
  for (const { c } of cands) {
    if (out.length >= 3) break;
    if (out.some(o => synClash(o, c.syn))) continue;
    out.push(c.syn);
  }
  return out;
}

// ---------- Tạo câu hỏi ----------
const TYPE_INFO = {
  reading: { jp: '漢字読み', vi: 'Cách đọc' },
  meaning: { jp: '意味', vi: 'Nghĩa của từ' },
  reverse: { jp: '語彙', vi: 'Chọn từ đúng nghĩa' },
  synonym: { jp: '言い換え類義', vi: 'Từ gần nghĩa' },
  context: { jp: '文脈規定', vi: 'Điền vào câu' },
};

function availableTypes(w) {
  const t = ['meaning', 'reverse'];
  if (hasKanji(w.word)) t.push('reading');
  if (w.syn) t.push('synonym');
  if (blankSentence(w)) t.push('context');
  return t;
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

function highlightIn(sentence, w) {
  const b = blankSentence(w);
  if (!b) return esc(sentence);
  return esc(b.pre) + '<u class="hl">' + esc(b.blank) + '</u>' + esc(b.post);
}

function buildQuestion(w, type) {
  let prompt, sub = '', opts, correct, hint = '';
  if (type === 'reading') {
    const b = blankSentence(w);
    const inSent = b && b.exact && b.blank === w.word;
    prompt = `<div class="q-word">${esc(w.word)}</div>`;
    if (inSent) sub = `<div class="q-sent">${esc(b.pre)}<u class="hl">${esc(w.word)}</u>${esc(b.post)}</div>`;
    hint = 'Chọn cách đọc đúng của từ gạch chân';
    correct = w.kana;
    opts = readingOptions(w);
  } else if (type === 'meaning') {
    prompt = `<div class="q-word">${esc(w.word)}</div>`;
    hint = 'Từ này có nghĩa là gì?';
    correct = w.mean;
    opts = pickDistractorWords(w, 3, { strictPos: true }).map(c => c.mean);
  } else if (type === 'reverse') {
    prompt = `<div class="q-mean">${esc(w.mean)}</div>`;
    hint = 'Từ nào mang nghĩa này?';
    correct = w.word;
    opts = pickDistractorWords(w, 3, { strictPos: true }).map(c => c.word);
  } else if (type === 'synonym') {
    const b = blankSentence(w);
    prompt = `<div class="q-word">${esc(w.word)}</div>`;
    if (b && b.exact) sub = `<div class="q-sent">${esc(b.pre)}<u class="hl">${esc(b.blank)}</u>${esc(b.post)}</div>`;
    hint = 'Chọn từ / cụm từ gần nghĩa nhất với từ gạch chân';
    correct = w.syn;
    opts = synonymOptions(w);
  } else if (type === 'context') {
    const b = blankSentence(w);
    prompt = `<div class="q-sent big">${esc(b.pre)}<span class="blank">（　　　）</span>${esc(b.post)}</div>`;
    hint = 'Chọn từ thích hợp nhất để điền vào chỗ trống';
    correct = b.blank;
    const needSame = w.pos === 'verb' || w.pos === 'iadj';
    const ds = pickDistractorWords(w, 8, { strictPos: true, filter: c => !needSame || c.pos === w.pos });
    opts = [];
    for (const c of ds) {
      const v = inflectLike(w, b, c);
      if (v && v !== correct && !opts.includes(v)) opts.push(v);
      if (opts.length >= 3) break;
    }
  }
  // loại trùng
  opts = [...new Set(opts.filter(o => o && o !== correct))].slice(0, 3);
  let guard = 0;
  while (opts.length < 3 && guard++ < 500) {
    const extra = pick(WORDS);
    if (extra.id === w.id) continue;
    let v;
    if (type === 'context') {
      if ((w.pos === 'verb' || w.pos === 'iadj') && extra.pos !== w.pos) continue;
      v = inflectLike(w, blankSentence(w), extra);
    } else v = type === 'meaning' ? extra.mean : type === 'reading' ? extra.kana : type === 'synonym' ? (extra.syn || extra.kana) : extra.word;
    if (!v) continue;
    if (v !== correct && !opts.includes(v)) opts.push(v);
  }
  const options = shuffle([correct, ...opts]);
  return { type, wordId: w.id, prompt, sub, hint, options, correctIndex: options.indexOf(correct) };
}

function makeQuestion(w, allowedTypes, preferType) {
  let types = availableTypes(w).filter(t => !allowedTypes || allowedTypes.includes(t));
  if (!types.length) types = availableTypes(w).filter(t => t === 'meaning' || t === 'reverse');
  const type = preferType && types.includes(preferType) ? preferType : pick(types);
  return buildQuestion(w, type);
}

// ---------- Các tập ----------
function getSets() {
  const years = [...new Set(WORDS.map(w => w.year))].sort();
  const sets = [{ id: 'freq', title: 'Từ thường xuất hiện', icon: '⭐', words: WORDS.filter(w => w.freq), special: true }];
  for (const y of years) {
    const ws = WORDS.filter(w => w.year === y);
    const exams = [...new Set(ws.map(w => w.exam))].sort((a, b) => parseInt(a.split('/')[1]) - parseInt(b.split('/')[1]));
    sets.push({ id: 'y' + y, title: 'Năm ' + y, icon: '📅', words: ws, exams });
  }
  sets.push({ id: 'all', title: 'Tất cả', icon: '🗂️', words: WORDS, special: true });
  return sets;
}

if (typeof module !== 'undefined') module.exports = { WORDS, makeQuestion, buildQuestion, availableTypes, readingVariants, blankSentence, getSets, pickDistractorWords, synonymOptions, readingOptions };
