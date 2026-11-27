/* ============================================================
   BÀI TEST NGỮ PHÁP – Mondai 5 (文法形式の判断) & Mondai 6 (文の組み立て)
   ============================================================ */
const MONDAI = {
  m5: {
    label: '問題5', name: 'Chọn ngữ pháp', jp: '文法形式の判断',
    instr: '次の文の（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
  },
  m6: {
    label: '問題6', name: 'Sắp xếp câu (★)', jp: '文の組み立て',
    instr: '次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。',
  },
};
const PART_LABEL = { all: 'Cả đề', m5: 'Mondai 5', m6: 'Mondai 6' };
let gPart = store.get('n1q_gpart', 'all');
const gBest = store.get('n1q_gbest', {});   // `${testId}:${part}` -> %
let G = null;

function gAnswerIndex(item) {
  // trả về chỉ số 0-based của đáp án đúng
  if (item.mondai === 'm5') return item.q.answer - 1;
  const star = item.q.star || 3;
  return item.q.order[star - 1] - 1;
}
function gOptions(item) { return item.mondai === 'm5' ? item.q.options : item.q.parts; }

// ---------- Trang chủ ngữ pháp ----------
function renderGrammarHome() {
  stopTimer(); setKeys(null); G = null;
  const tests = GRAMMAR_TESTS;
  $app.innerHTML = `
    ${heroHtml()}
    ${tabsHtml('grammar')}
    <div class="controls">
      <div class="panel">
        <div class="label">Phần thi</div>
        <div class="seg seg3">
          ${['all', 'm5', 'm6'].map(p => `
            <button data-part="${p}" class="${gPart === p ? 'on' : ''}">
              <b>${PART_LABEL[p]}</b>
              <span>${p === 'all' ? 'Mondai 5 + Mondai 6' : `<span class="jp">${MONDAI[p].label} ${MONDAI[p].jp}</span>`}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>

    <div class="section-title"><h2>Đề ngữ pháp</h2><span>${tests.length} đề</span></div>
    ${tests.length ? `<div class="grid">${tests.map(gTestCard).join('')}</div>`
      : `<div class="panel empty">Chưa có đề nào. Hãy thêm đề vào file <b>js/grammar-data.js</b>.</div>`}

    <div class="foot">Phím tắt: <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án · <kbd>Enter</kbd> câu tiếp</div>
  `;
  bindTabs();
  $app.querySelectorAll('[data-part]').forEach(b => b.onclick = () => { gPart = b.dataset.part; store.set('n1q_gpart', gPart); renderGrammarHome(); });
  $app.querySelectorAll('[data-test]').forEach(b => b.onclick = () => startGrammar(GRAMMAR_TESTS.find(t => t.id === b.dataset.test), gPart));
  window.scrollTo(0, 0);
}

function gTestCard(t) {
  const n5 = (t.m5 || []).length, n6 = (t.m6 || []).length;
  const key = `${t.id}:${gPart}`;
  const badge = gBest[key] != null ? `<span class="badge ${gBest[key] >= 80 ? 'good' : ''}">${gBest[key]}%</span>` : '';
  const disabled = (gPart === 'm5' && !n5) || (gPart === 'm6' && !n6) || (!n5 && !n6);
  return `
    <button class="set-card" data-test="${esc(t.id)}" ${disabled ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}>
      ${badge}
      <div>
        <div class="t">${esc(t.title)}</div>
        <div class="m">Mondai 5: ${n5} câu · Mondai 6: ${n6} câu</div>
        ${t.source ? `<div class="m">${esc(t.source)}</div>` : ''}
      </div>
      <div class="bar"><i style="width:${gBest[key] || 0}%"></i></div>
    </button>`;
}

// ---------- Phiên làm bài ----------
function startGrammar(test, part) {
  if (!test) return;
  const items = [];
  if (part !== 'm6') (test.m5 || []).forEach(q => items.push({ mondai: 'm5', q }));
  if (part !== 'm5') (test.m6 || []).forEach(q => items.push({ mondai: 'm6', q }));
  if (!items.length) return;
  G = { test, part, items, idx: 0, answers: [], startedAt: Date.now(), streak: 0 };
  renderGrammarQuestion();
}

function m5Sentence(q, fill) {
  const parts = esc(q.q).split(/（\s*　*\s*）|\(\s*\)/);
  const blank = fill != null ? `<span class="gblank filled">${esc(fill)}</span>` : '<span class="gblank">（　　）</span>';
  return parts.join(blank).replace(/\n/g, '<br>');
}
function m6Sentence(q, filled) {
  const star = q.star || 3;
  const slots = [1, 2, 3, 4].map(i => {
    const isStar = i === star;
    const txt = filled ? esc(q.parts[q.order[i - 1] - 1]) : (isStar ? '★' : '');
    return `<span class="slot ${isStar ? 'star' : ''} ${filled ? 'filled' : ''}">${filled && isStar ? '<i>★</i>' : ''}${txt}</span>`;
  }).join('');
  return `${esc(q.before || '')}${slots}${esc(q.after || '')}`;
}

function renderGrammarQuestion() {
  const it = G.items[G.idx], q = it.q, M = MONDAI[it.mondai];
  const done = G.answers.length;
  $app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="quit" title="Kết thúc">✕</button>
      <div class="progress"><i style="width:${done / G.items.length * 100}%"></i></div>
      <div class="pill">${G.idx + 1}/${G.items.length}</div>
      <div class="pill streak">🔥 ${G.streak}</div>
    </div>
    <div class="qcard gcard">
      <div class="qtag"><span class="jp">${M.label} ${M.jp}</span>${M.name}</div>
      <div class="qset">${esc(G.test.title)}</div>
      <div class="instr jp">${M.instr}</div>
      <div class="gq">
        <span class="gno">${q.no ?? G.idx + 1}</span>
        <div class="gsent jp" id="gsent">${it.mondai === 'm5' ? m5Sentence(q) : m6Sentence(q, false)}</div>
      </div>
    </div>
    <div class="options gopts" id="opts">
      ${gOptions(it).map((o, i) => `<button class="opt jp-opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div id="fb"></div>
  `;
  document.getElementById('quit').onclick = () => (G.answers.length ? renderGrammarResult(true) : renderHome());
  $app.querySelectorAll('.opt').forEach(b => b.onclick = () => gAnswer(+b.dataset.i));
  G.locked = false;
  setKeys(e => {
    if (G.locked) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gNext(); } return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) gAnswer(n - 1);
  });
  window.scrollTo(0, 0);
}

function gAnswer(i) {
  if (G.locked) return;
  G.locked = true;
  const it = G.items[G.idx], q = it.q;
  const ci = gAnswerIndex(it);
  const ok = i === ci;
  G.streak = ok ? G.streak + 1 : 0;
  G.answers.push({ it, chosen: i, ok });

  const box = document.getElementById('opts');
  box.classList.add('answered');
  box.querySelectorAll('.opt').forEach((b, j) => {
    b.disabled = true;
    if (j === ci) { b.classList.add('correct'); b.insertAdjacentHTML('beforeend', '<span class="mark">✓</span>'); }
    else if (j === i) { b.classList.add('wrong'); b.insertAdjacentHTML('beforeend', '<span class="mark">✗</span>'); }
  });
  // điền đáp án vào câu
  document.getElementById('gsent').innerHTML = it.mondai === 'm5' ? m5Sentence(q, q.options[q.answer - 1]) : m6Sentence(q, true);
  $app.querySelector('.progress i').style.width = (G.answers.length / G.items.length * 100) + '%';
  $app.querySelector('.pill.streak').textContent = '🔥 ' + G.streak;

  const last = G.idx + 1 >= G.items.length;
  const orderTxt = it.mondai === 'm6' ? `<div class="row">Thứ tự đúng: <b>${q.order.join(' → ')}</b> · Ô ★ là đáp án <b>${ci + 1}</b></div>` : '';
  document.getElementById('fb').innerHTML = `
    <div class="feedback">
      ${ok ? `<div class="fb-head ok"><span>✓ Chính xác!</span><small>Đáp án ${ci + 1}</small></div>`
        : `<div class="fb-head bad"><span>✗ Sai rồi!</span><small>Đáp án đúng: ${ci + 1}. <span class="jp">${esc(gOptions(it)[ci])}</span></small></div>`}
      <div class="fb-body g">
        <div class="fb-info">
          ${q.point ? `<div class="mean jp">${esc(q.point)}</div>` : ''}
          ${orderTxt}
          <div class="ex">${q.explain ? `<div class="v" style="color:var(--text)">${esc(q.explain)}</div>` : '<div class="v">Chưa có giải thích cho câu này.</div>'}</div>
        </div>
      </div>
      <div class="fb-actions"><button class="btn primary" id="next">${last ? 'Xem kết quả' : 'Câu tiếp'} →</button></div>
    </div>`;
  document.getElementById('next').onclick = gNext;
  document.getElementById('next').focus({ preventScroll: true });
  setTimeout(() => document.getElementById('fb')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

function gNext() {
  G.idx++;
  if (G.idx >= G.items.length) renderGrammarResult(false);
  else renderGrammarQuestion();
}

// ---------- Kết quả ----------
function renderGrammarResult(early) {
  setKeys(null);
  const a = G.answers;
  const total = early ? a.length : G.items.length;
  const right = a.filter(x => x.ok).length;
  const pct = total ? Math.round(right / total * 100) : 0;
  const key = `${G.test.id}:${G.part}`;
  if (!early) { gBest[key] = Math.max(gBest[key] || 0, pct); store.set('n1q_gbest', gBest); }
  const secs = Math.round((Date.now() - G.startedAt) / 1000);
  const mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');

  const by = {};
  for (const x of a) { const m = x.it.mondai; by[m] = by[m] || [0, 0]; by[m][1]++; if (x.ok) by[m][0]++; }
  const wrong = a.filter(x => !x.ok);
  const title = pct >= 90 ? 'Xuất sắc!' : pct >= 70 ? 'Làm tốt lắm!' : pct >= 50 ? 'Khá ổn, cố thêm chút nữa!' : 'Cần ôn thêm nhé';

  $app.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="home">←</button><div class="pill">${esc(G.test.title)} · ${PART_LABEL[G.part]}</div></div>
    <div class="panel">
      <div class="result-top">
        <div class="ring" style="--p:${pct}"><div><div><b>${pct}%</b><span>${right}/${total} câu đúng</span></div></div></div>
        <div>
          <h2>${title}</h2>
          <p>${early ? 'Bạn đã dừng giữa chừng.' : `Điểm cao nhất: ${gBest[key]}%`}</p>
          <div class="stats">
            ${['m5', 'm6'].map(m => `<div class="stat"><b>${by[m] ? by[m][0] + '/' + by[m][1] : '–'}</b><span>${PART_LABEL[m]}</span></div>`).join('')}
            <div class="stat"><b>${wrong.length}</b><span>Câu sai</span></div>
            <div class="stat"><b>${mm}:${ss}</b><span>Thời gian</span></div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" id="again">↻ Làm lại</button>
        <button class="btn ghost" id="home2">Về danh sách đề</button>
      </div>
    </div>

    <div class="section-title"><h2>Câu sai</h2><span>${wrong.length} câu</span></div>
    <div class="wrong-list">
      ${wrong.length ? wrong.map(x => {
        const q = x.it.q, ci = gAnswerIndex(x.it), opts = gOptions(x.it);
        const sent = x.it.mondai === 'm5' ? m5Sentence(q, q.options[q.answer - 1]) : m6Sentence(q, true);
        return `<div class="wl g">
          <div class="w">${MONDAI[x.it.mondai].label}<small>Câu ${q.no ?? ''}</small></div>
          <div class="d"><div class="jp gsent small">${sent}</div>
            <div class="you">Bạn chọn: ${x.chosen + 1}. <span class="jp">${esc(opts[x.chosen])}</span> · Đúng: ${ci + 1}. <span class="jp">${esc(opts[ci])}</span></div></div>
        </div>`;
      }).join('') : '<div class="empty">Không sai câu nào — tuyệt vời!</div>'}
    </div>
  `;
  const test = G.test, part = G.part;
  document.getElementById('home').onclick = renderHome;
  document.getElementById('home2').onclick = renderHome;
  document.getElementById('again').onclick = () => startGrammar(test, part);
  window.scrollTo(0, 0);
}
