/* ============================================================
   N1 Quizizz – giao diện & luồng chơi
   ============================================================ */
const $app = document.getElementById('app');
const SETS = getSets();
const ALL_TYPES = ['reading', 'meaning', 'reverse', 'synonym', 'context'];
const TEST_SIZE = 20;
const TEST_SECONDS = 30;

// ---------- Lưu trữ (an toàn nếu trình duyệt chặn localStorage) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
};
let mode = store.get('n1q_mode', 'practice');
let types = store.get('n1q_types', ALL_TYPES.slice()).filter(t => ALL_TYPES.includes(t));
if (!types.length) types = ALL_TYPES.slice();
const best = store.get('n1q_best', {});              // setId -> % cao nhất (kiểm tra)
const known = new Set(store.get('n1q_known', []));   // id từ đã trả lời đúng
const wrongIds = new Set(store.get('n1q_wrong', [])); // id từ hay sai
function saveProgress() {
  store.set('n1q_best', best); store.set('n1q_known', [...known]); store.set('n1q_wrong', [...wrongIds]);
}

let S = null;          // phiên chơi hiện tại
let timerId = null;
let keyHandler = null;

const typeLabel = t => `<span class="jp">${TYPE_INFO[t].jp}</span>${TYPE_INFO[t].vi}`;

// ============================================================
// TRANG CHỦ
// ============================================================
let section = store.get('n1q_section', 'vocab');

function heroHtml() {
  return `
    <div class="hero">
      <div class="logo">N1</div>
      <div>
        <h1>N1 Quizizz</h1>
        <p>Từ vựng & ngữ pháp JLPT N1</p>
      </div>
    </div>`;
}
function tabsHtml(active) {
  return `
    <div class="tabs">
      <button data-sec="vocab" class="${active === 'vocab' ? 'on' : ''}">Từ vựng <small>${WORDS.length} từ</small></button>
      <button data-sec="grammar" class="${active === 'grammar' ? 'on' : ''}">Ngữ pháp <small>Mondai 5 · 6</small></button>
    </div>`;
}
function bindTabs() {
  $app.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { section = b.dataset.sec; store.set('n1q_section', section); renderHome(); });
}

function renderHome() {
  stopTimer();
  S = null;
  if (section === 'grammar' && typeof renderGrammarHome === 'function') return renderGrammarHome();
  const wrongSet = { id: 'wrong', title: 'Từ hay sai', icon: '🎯', words: WORDS.filter(w => wrongIds.has(w.id)) };
  const special = SETS.filter(s => s.special);
  const years = SETS.filter(s => !s.special);

  $app.innerHTML = `
    ${heroHtml()}
    ${tabsHtml('vocab')}

    <div class="controls">
      <div class="panel">
        <div class="label">Chế độ</div>
        <div class="seg">
          <button data-mode="practice" class="${mode === 'practice' ? 'on' : ''}">
            <b>Luyện tập</b><span>Học hết từ trong tập · sai sẽ được hỏi lại</span>
          </button>
          <button data-mode="test" class="${mode === 'test' ? 'on' : ''}">
            <b>Kiểm tra</b><span>${TEST_SIZE} câu ngẫu nhiên · ${TEST_SECONDS} giây/câu · chấm điểm</span>
          </button>
        </div>
      </div>
      <div class="panel">
        <div class="label">Dạng câu hỏi</div>
        <div class="chips">
          ${ALL_TYPES.map(t => `<button class="chip ${types.includes(t) ? 'on' : ''}" data-type="${t}"><small>${TYPE_INFO[t].jp}</small>${TYPE_INFO[t].vi}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="section-title"><h2>Tập đặc biệt</h2><span>Bấm vào một tập để bắt đầu</span></div>
    <div class="grid">
      ${special.map(s => setCard(s, s.id === 'freq' ? 'feature' : '')).join('')}
      ${wrongSet.words.length ? setCard(wrongSet, 'wrongset') : ''}
    </div>

    <div class="section-title"><h2>Theo năm thi</h2><span>${years.length} tập</span></div>
    <div class="grid">${years.map(s => setCard(s)).join('')}</div>

    <div class="foot">Phím tắt: <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án · <kbd>Enter</kbd> câu tiếp · Tiến độ được lưu trên trình duyệt này</div>
  `;

  bindTabs();
  $app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; store.set('n1q_mode', mode); renderHome(); });
  $app.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
    const t = b.dataset.type;
    if (types.includes(t)) { if (types.length > 1) types = types.filter(x => x !== t); }
    else types.push(t);
    store.set('n1q_types', types); renderHome();
  });
  $app.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const id = b.dataset.set;
    const set = id === 'wrong' ? wrongSet : SETS.find(s => s.id === id);
    startSession(set, mode);
  });
  window.scrollTo(0, 0);
}

function setCard(s, cls = '') {
  const n = s.words.length;
  const k = s.words.filter(w => known.has(w.id)).length;
  const pct = n ? Math.round(k / n * 100) : 0;
  let badge = '';
  if (mode === 'test' && best[s.id] != null) badge = `<span class="badge ${best[s.id] >= 80 ? 'good' : ''}">🏆 ${best[s.id]}%</span>`;
  else if (mode === 'practice' && k) badge = `<span class="badge ${pct === 100 ? 'good' : ''}">${pct}%</span>`;
  const exams = s.exams ? s.exams.map(e => 'Kỳ ' + e.split('/')[1]).join(' · ') : '';
  return `
    <button class="set-card ${cls}" data-set="${s.id}">
      ${badge}
      <div>
        <div class="ico">${s.icon}</div>
        <div class="t">${s.title}</div>
        <div class="m">${n} từ${exams ? ' · ' + exams : ''}</div>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </button>`;
}

// ============================================================
// PHIÊN CHƠI
// ============================================================
function startSession(set, m, wordsOverride) {
  const words = wordsOverride || set.words;
  if (!words.length) return;
  S = {
    set, mode: m,
    queue: [], idx: 0,
    done: new Set(),            // luyện tập: từ đã trả lời đúng
    total: m === 'test' ? Math.min(TEST_SIZE, words.length) : words.length,
    correct: 0, answered: [], streak: 0, bestStreak: 0, points: 0,
    startedAt: Date.now(), wordsPool: words,
  };
  if (m === 'test') {
    // xoay vòng các dạng câu hỏi để bài kiểm tra có đủ dạng
    const ws = shuffle(words).slice(0, S.total);
    let cycle = shuffle(types), ci = 0;
    S.queue = ws.map(w => {
      const avail = availableTypes(w).filter(t => types.includes(t));
      let t = null;
      for (let j = 0; j < cycle.length; j++) { const c = cycle[(ci + j) % cycle.length]; if (avail.includes(c)) { t = c; ci = (ci + j + 1) % cycle.length; break; } }
      return { w, t };
    });
  } else {
    S.queue = shuffle(words).map(w => ({ w, t: null }));
  }
  nextQuestion();
}

function nextQuestion() {
  stopTimer();
  if (S.idx >= S.queue.length) return renderResult();
  const item = S.queue[S.idx];
  S.q = makeQuestion(item.w, types, item.t);
  S.qStart = Date.now();
  S.locked = false;
  renderQuestion();
}

function progressValue() {
  if (S.mode === 'test') return S.idx / S.total;
  return S.done.size / S.total;
}

function renderQuestion() {
  const q = S.q, w = WORDS[q.wordId];
  const jpOpts = q.type === 'reading' || q.type === 'reverse' || q.type === 'synonym' || q.type === 'context';
  const counter = S.mode === 'test' ? `${S.idx + 1}/${S.total}` : `${S.done.size}/${S.total}`;
  $app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="quit" title="Kết thúc">✕</button>
      <div class="progress"><i style="width:${progressValue() * 100}%"></i></div>
      <div class="pill">${counter}</div>
      <div class="pill streak" title="Chuỗi đúng liên tiếp">🔥 ${S.streak}</div>
      <div class="pill pts">⭐ ${S.points}</div>
    </div>
    ${S.mode === 'test' ? '<div class="timer"><i id="tbar"></i></div>' : ''}
    <div class="qcard">
      <div class="qtag">${typeLabel(q.type)}</div>
      <div class="qset">${S.set.title}</div>
      <div class="hint">${q.hint}</div>
      ${q.prompt}
      ${q.sub}
    </div>
    <div class="options" id="opts">
      ${q.options.map((o, i) => `<button class="opt ${jpOpts ? 'jp-opt' : ''}" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div id="fb"></div>
  `;
  document.getElementById('quit').onclick = () => { stopTimer(); S.answered.length ? renderResult(true) : renderHome(); };
  $app.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.i));
  setKeys(e => {
    if (S.locked) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goNext(); } return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) answer(n - 1);
  });
  if (S.mode === 'test') startTimer();
  window.scrollTo(0, 0);
}

function startTimer() {
  const bar = document.getElementById('tbar');
  const end = S.qStart + TEST_SECONDS * 1000;
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    if (bar) { bar.style.width = (left / (TEST_SECONDS * 1000) * 100) + '%'; bar.classList.toggle('low', left < 8000); }
    if (left <= 0) { stopTimer(); answer(-1); }
  };
  requestAnimationFrame(() => { if (bar) bar.style.transition = 'width .25s linear, background .3s'; tick(); });
  timerId = setInterval(tick, 250);
}
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

function answer(i) {
  if (S.locked) return;
  S.locked = true;
  stopTimer();
  const q = S.q, w = WORDS[q.wordId];
  const ok = i === q.correctIndex;
  const secs = (Date.now() - S.qStart) / 1000;

  const box = document.getElementById('opts');
  box.classList.add('answered');
  box.querySelectorAll('.opt').forEach((b, j) => {
    b.disabled = true;
    if (j === q.correctIndex) { b.classList.add('correct'); b.insertAdjacentHTML('beforeend', '<span class="mark">✓</span>'); }
    else if (j === i) { b.classList.add('wrong'); b.insertAdjacentHTML('beforeend', '<span class="mark">✗</span>'); }
  });

  let gained = 0;
  if (ok) {
    S.correct++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
    const limit = S.mode === 'test' ? TEST_SECONDS : 20;
    gained = 600 + Math.round(400 * Math.max(0, 1 - secs / limit)) + 100 * Math.min(S.streak - 1, 5);
    S.points += gained;
    known.add(w.id); wrongIds.delete(w.id);
    if (S.mode === 'practice') S.done.add(w.id);
    popup('+' + gained, 'var(--ok)');
  } else {
    S.streak = 0;
    wrongIds.add(w.id);
    if (S.mode === 'practice') {
      // hỏi lại từ này sau 3–5 câu
      const pos = Math.min(S.queue.length, S.idx + 3 + Math.floor(Math.random() * 3));
      S.queue.splice(pos, 0, { w, t: null });
    }
  }
  saveProgress();
  S.answered.push({ q, chosen: i, ok, secs });

  // cập nhật thanh trên
  const pb = $app.querySelector('.progress i'); if (pb) pb.style.width = (S.mode === 'test' ? (S.idx + 1) / S.total : S.done.size / S.total) * 100 + '%';
  const st = $app.querySelector('.pill.streak'); if (st) st.textContent = '🔥 ' + S.streak;
  const pt = $app.querySelector('.pill.pts'); if (pt) pt.textContent = '⭐ ' + S.points;

  renderFeedback(q, w, i, ok, gained);
}

function trapNote(q, w, i) {
  if (i < 0 || q.type !== 'reading') return '';
  const why = readingVariants(w).get(q.options[i]);
  return why ? `<div class="trap">⚠️ Bẫy: ${why}</div>` : '';
}

function renderFeedback(q, w, i, ok, gained) {
  const head = ok
    ? `<div class="fb-head ok"><span>✓ Chính xác!</span><small>+${gained} điểm${S.streak > 1 ? ` · 🔥 ${S.streak} câu liên tiếp` : ''}</small></div>`
    : `<div class="fb-head bad"><span>${i < 0 ? 'Hết giờ!' : '✗ Sai rồi!'}</span><small>Đáp án đúng: <span class="jp">${esc(q.options[q.correctIndex])}</span></small></div>`;
  const last = S.mode === 'test' ? S.idx + 1 >= S.queue.length : (S.idx + 1 >= S.queue.length);
  document.getElementById('fb').innerHTML = `
    <div class="feedback">
      ${head}
      <div class="fb-body">
        <div class="fb-word">
          <div class="w">${esc(w.word)}</div>
          <div class="r">${esc(w.kanaAll.join(' / '))}</div>
          ${w.hv ? `<div class="hv">${esc(w.hv)}</div>` : ''}
          <button class="speak" id="spk">🔊 Nghe</button>
        </div>
        <div class="fb-info">
          <div class="mean">${esc(w.mean)}</div>
          ${w.origin ? `<div class="row">Gốc từ: <b>${esc(w.origin)}</b></div>` : ''}
          ${w.syn ? `<div class="row">Đồng nghĩa (言い換え): <b class="jp">${esc(w.syn)}</b></div>` : ''}
          <div class="row">Loại từ: <b>${POS_LABEL[w.pos]}</b> · Đề thi: <b>${esc(w.exam)}</b>${w.freq ? ' · <b style="color:var(--mark)">Thường xuất hiện</b>' : ''}</div>
          ${w.ex ? `<div class="ex"><div class="j">${highlightIn(w.ex, w)}</div><div class="v">${esc(w.exVi)}</div></div>` : ''}
          ${trapNote(q, w, i)}
        </div>
      </div>
      <div class="fb-actions"><button class="btn primary" id="next">${last ? 'Xem kết quả' : 'Câu tiếp'} →</button></div>
    </div>`;
  document.getElementById('next').onclick = goNext;
  document.getElementById('spk').onclick = () => speak(w.kana);
  document.getElementById('next').focus({ preventScroll: true });
  setTimeout(() => document.getElementById('fb')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

function goNext() { S.idx++; nextQuestion(); }

function popup(text, color) {
  const d = document.createElement('div');
  d.className = 'pop'; d.textContent = text; d.style.color = color;
  document.body.appendChild(d); setTimeout(() => d.remove(), 950);
}

function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 0.9;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ja'));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { /* trình duyệt không hỗ trợ */ }
}

function setKeys(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn; if (fn) document.addEventListener('keydown', fn);
}

// ============================================================
// KẾT QUẢ
// ============================================================
function renderResult(early) {
  stopTimer();
  document.querySelectorAll('.pop').forEach(e => e.remove());
  setKeys(null);
  const a = S.answered;
  const n = a.length;
  const right = a.filter(x => x.ok).length;
  // Luyện tập: tính theo lần trả lời đầu tiên của mỗi từ
  let pct;
  if (S.mode === 'test') pct = Math.round(right / (early ? Math.max(n, 1) : S.total) * 100);
  else {
    const first = new Map();
    for (const x of a) if (!first.has(x.q.wordId)) first.set(x.q.wordId, x.ok);
    pct = first.size ? Math.round([...first.values()].filter(Boolean).length / first.size * 100) : 0;
  }
  if (S.mode === 'test' && !early && S.set.id !== 'wrong' && !S.isRetry) {
    best[S.set.id] = Math.max(best[S.set.id] || 0, pct); saveProgress();
  }
  const secs = Math.round((Date.now() - S.startedAt) / 1000);
  const mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');

  const byType = {};
  for (const x of a) { const t = x.q.type; byType[t] = byType[t] || [0, 0]; byType[t][1]++; if (x.ok) byType[t][0]++; }

  const wrongMap = new Map();
  for (const x of a) if (!x.ok && !wrongMap.has(x.q.wordId)) wrongMap.set(x.q.wordId, x);
  const wrongWords = [...wrongMap.keys()].map(id => WORDS[id]);

  const title = pct >= 90 ? 'Xuất sắc! 🎉' : pct >= 70 ? 'Làm tốt lắm! 💪' : pct >= 50 ? 'Khá ổn, cố thêm chút nữa!' : 'Cần ôn thêm nhé 📖';
  $app.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="home">←</button><div class="pill">${S.set.icon} ${S.set.title} · ${S.mode === 'test' ? 'Kiểm tra' : 'Luyện tập'}</div></div>
    <div class="panel">
      <div class="result-top">
        <div class="ring" style="--p:${pct}"><div><div><b>${pct}%</b><span>${S.mode === 'test' ? `${right}/${early ? n : S.total} câu đúng` : 'đúng ngay lần đầu'}</span></div></div></div>
        <div>
          <h2>${title}</h2>
          <p>${early ? 'Bạn đã dừng giữa chừng. ' : ''}${S.mode === 'test' && best[S.set.id] != null && !early ? `Điểm cao nhất của tập này: ${best[S.set.id]}%` : 'Các từ trả lời sai đã được thêm vào tập 🎯 Từ hay sai.'}</p>
          <div class="stats">
            <div class="stat"><b>${S.points}</b><span>Điểm</span></div>
            <div class="stat"><b>${right}/${n}</b><span>Câu đúng</span></div>
            <div class="stat"><b>🔥 ${S.bestStreak}</b><span>Chuỗi dài nhất</span></div>
            <div class="stat"><b>${mm}:${ss}</b><span>Thời gian</span></div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" id="again">↻ Làm lại</button>
        ${wrongWords.length ? `<button class="btn" id="redo">🎯 Ôn lại ${wrongWords.length} từ sai</button>` : ''}
        <button class="btn ghost" id="home2">Về trang chủ</button>
      </div>
    </div>

    <div class="section-title"><h2>Theo dạng câu hỏi</h2></div>
    <div class="panel typebars">
      ${Object.keys(byType).length ? ALL_TYPES.filter(t => byType[t]).map(t => {
        const [r, tot] = byType[t];
        return `<div class="typebar"><div>${TYPE_INFO[t].vi}</div><div class="track"><i style="width:${r / tot * 100}%"></i></div><div class="v">${r}/${tot}</div></div>`;
      }).join('') : '<div class="empty">Chưa có câu trả lời nào.</div>'}
    </div>

    <div class="section-title"><h2>Từ cần ôn</h2><span>${wrongWords.length} từ</span></div>
    <div class="wrong-list">
      ${wrongWords.length ? [...wrongMap.values()].map(x => {
        const w = WORDS[x.q.wordId];
        const you = x.chosen < 0 ? 'Hết giờ' : x.q.options[x.chosen];
        return `<div class="wl">
          <div class="w">${esc(w.word)}<small>${esc(w.kanaAll.join(' / '))}</small></div>
          <div class="d">${esc(w.mean)}${w.hv ? ` · <span class="tag">${esc(w.hv)}</span>` : ''}
            <div class="you">Bạn chọn: <span class="jp">${esc(you)}</span> · <span class="tag">${TYPE_INFO[x.q.type].vi}</span></div></div>
        </div>`;
      }).join('') : '<div class="empty">Không sai từ nào — tuyệt vời! 🎉</div>'}
    </div>
  `;
  const set = S.set, m = S.mode, pool = S.wordsPool;
  document.getElementById('home').onclick = renderHome;
  document.getElementById('home2').onclick = renderHome;
  document.getElementById('again').onclick = () => startSession(set, m, pool);
  const redo = document.getElementById('redo');
  if (redo) redo.onclick = () => { startSession({ ...set, title: 'Ôn từ sai', icon: '🎯' }, 'practice', wrongWords); S.isRetry = true; };
  window.scrollTo(0, 0);
}
