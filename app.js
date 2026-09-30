// ---------- state ----------
const XP_PER_LEVEL = 100, XP_PER_CORRECT = 5;
const load = () => Object.assign({ xp: 0, mastered: [], lastDay: '', streak: 0 }, JSON.parse(localStorage.getItem('pr') || '{}'));
const state = load();
const save = () => localStorage.setItem('pr', JSON.stringify(state));
const level = xp => Math.floor(xp / XP_PER_LEVEL) + 1;
const bySym = Object.fromEntries(PHONEMES.map(p => [p.symbol, p]));

let tab = ['learn','practice','stats'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'learn', session = null;

// ---------- audio ----------
function say(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.85;
  speechSynthesis.speak(u);
}
// Plays sounds/<id>.mp3 if you drop one in; otherwise says the first example word.
function playPhoneme(p) {
  const a = new Audio(`sounds/${p.id}.mp3`);
  a.play().catch(() => say(p.ex[0].w));
}
function recognize(cb) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return cb(null);
  const r = new R(); r.lang = 'en-US'; r.maxAlternatives = 5;
  let done = false;
  const fin = v => { if (!done) { done = true; cb(v); } };
  r.onresult = e => fin([...e.results[0]].map(a => a.transcript));
  r.onerror = () => fin([]);
  r.onend = () => fin([]);
  r.start();
}
const norm = s => s.toLowerCase().replace(/[^a-z' ]/g, '').trim();

// ---------- helpers ----------
const shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const pick = (a, n) => shuffle(a).slice(0, n);
const $ = id => document.getElementById(id);
function toast(html) { const t = $('toast'); t.innerHTML = html; t.hidden = false; setTimeout(() => t.hidden = true, 5000); }
function award(correct, p) {
  if (!correct) return;
  state.xp += XP_PER_CORRECT;
  if (!state.mastered.includes(p.id)) state.mastered.push(p.id);
  save(); renderProgress();
}
function bumpStreak() {
  const today = new Date().toDateString();
  if (state.lastDay === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  state.streak = state.lastDay === y.toDateString() ? state.streak + 1 : 1;
  state.lastDay = today; save();
}

// ---------- rendering ----------
function renderProgress() {
  const lv = level(state.xp), inLevel = state.xp % XP_PER_LEVEL;
  $('progress').innerHTML = `
    <div class="row"><strong style="font-size:22px">🏆 Level ${lv}</strong><span class="muted">⚡ ${state.streak} day streak</span></div>
    <div class="bar"><div style="width:${inLevel}%"></div></div>
    <div class="row muted"><span>${state.xp} XP</span><span>${XP_PER_LEVEL - inLevel} XP to level ${lv + 1}</span></div>`;
}

function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const v = $('view');
  if (tab === 'learn') v.innerHTML = renderLearn();
  else if (tab === 'stats') v.innerHTML = renderStats();
  else v.innerHTML = session ? renderSession() : renderPracticeMenu();
}

function renderLearn() {
  return `<h2>All 44 Phonemes</h2><p class="sub">Click on any phoneme to see pronunciation tips and mouth position</p>
  <div class="grid">${PHONEMES.map(p => `
    <div class="card" data-open="${p.id}">
      <p class="sym">/${p.symbol}/</p><span class="pill">${p.cat}</span>
      <p class="muted" style="margin:14px 0 0">Example words:</p>
      <div class="chips">${p.ex.map(e => `<span class="pill teal">${e.w}</span>`).join('')}</div>
      ${p.conf.length ? `<p class="muted">Often confused with: ${p.conf.map(c => `/${c}/`).join(', ')}</p>` : ''}
      <div class="tip" hidden><b>How to make it:</b> ${p.tip}<br><br>${p.ex.map(e => `${e.w} /${e.ipa}/`).join(' · ')}</div>
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px"><button class="btn" data-play="${p.id}">🔊 Listen</button></div>
    </div>`).join('')}</div>`;
}

const MODES = [
  ['listening', '🎯', 'Listening Practice', 'Listen to phonemes, distinguish minimal pairs, and match sounds to IPA', 'Start Listening'],
  ['symbol', '🎯', 'Symbol Recognition', 'Listen to a word and select the correct IPA symbol', 'Start Quiz'],
  ['speaking', '🎙', 'Speaking Practice', 'See word and symbols, then practice pronunciation', 'Start Practice'],
  ['wordquiz', '🎙', 'Word Only Quiz', 'See only the word, speak the pronunciation', 'Start Challenge'],
];
function renderPracticeMenu() {
  return `<h2>Practice Mode</h2><p class="sub">Choose your practice method</p>
  <div class="grid two">${MODES.map(([id, icon, title, desc, cta]) => `
    <div class="card"><div style="font-size:32px">${icon}</div><h3 style="font-size:24px;margin:12px 0 8px">${title}</h3>
    <p class="muted" style="font-size:16px;margin:0 0 20px">${desc}</p><button class="btn primary" data-start="${id}">${cta}</button></div>`).join('')}</div>`;
}

function renderStats() {
  return `<h2>Your Progress</h2><p class="sub">Track your learning journey</p>
  <div class="grid" style="max-width:1000px;margin:0 auto">
    <div class="card stat"><div class="icon">🏆</div><div class="big">${level(state.xp)}</div><div class="muted">Current Level</div></div>
    <div class="card stat"><div class="icon">✦</div><div class="big">${state.xp}</div><div class="muted">Total XP</div></div>
    <div class="card stat"><div class="icon">📖</div><div class="big">${state.mastered.length}/${PHONEMES.length}</div><div class="muted">Phonemes Mastered</div></div>
  </div>
  <div class="card" style="max-width:1000px;margin:24px auto 0"><h3 style="margin:0 0 12px;font-size:22px">Completed Phonemes</h3>
    ${state.mastered.length ? `<div class="chips">${state.mastered.map(id => `<span class="pill">/${PHONEMES.find(p => p.id === id).symbol}/</span>`).join('')}</div>`
      : '<p class="muted" style="font-size:16px">Complete quizzes to add phonemes to your collection!</p>'}
    <button class="btn link muted" data-reset>Reset progress</button></div>`;
}

// ---------- sessions ----------
function startSession(mode) {
  const spoken = mode === 'speaking' || mode === 'wordquiz';
  const n = mode === 'speaking' ? 15 : 10;
  const items = pick(PHONEMES, n).map(p => {
    const ex = p.ex[Math.floor(Math.random() * p.ex.length)];
    const opts = shuffle([p, ...pick(PHONEMES.filter(q => q !== p && q.cat === p.cat), 3)]);
    return { p, ex, opts };
  });
  session = { mode, spoken, items, i: 0, score: 0, answered: false, feedback: '', last: null, recording: false };
  render();
}

function renderSession() {
  const s = session;
  if (s.i >= s.items.length) {
    return `<div class="quiz"><div class="card"><h3>Complete! 🎉</h3><p class="word" style="font-size:56px">${s.score}/${s.items.length}</p>
      <p class="muted" style="font-size:18px">Keep practicing to master all phonemes!</p><button class="btn primary" data-exit>Back to Practice</button></div></div>`;
  }
  const it = s.items[s.i], p = it.p;
  const head = `<div class="row" style="max-width:880px;margin:0 auto 20px">
    <span class="pill teal" style="font-size:16px;padding:8px 16px">${s.spoken ? 'Word' : 'Question'} ${s.i + 1} of ${s.items.length}</span>
    <span class="pill" style="font-size:16px;padding:8px 16px">Score: ${s.score}/${s.items.length}</span></div>`;
  const fb = `<div class="feedback ${s.last === null ? '' : s.last ? 'ok' : 'bad'}">${s.feedback}</div>`;
  const next = s.answered ? `<button class="btn primary" data-next>${s.i + 1 === s.items.length ? 'Finish' : 'Next'}</button>` : '';
  const exit = `<p style="text-align:center;margin-top:20px"><button class="btn link" data-exit>Exit Practice</button></p>`;
  let body;
  if (s.mode === 'listening' || s.mode === 'symbol') {
    const isWord = s.mode === 'symbol';
    body = `<h3>${isWord ? 'Which symbol represents this sound?' : 'Listen and Choose the Phoneme'}</h3>
      ${isWord ? '' : '<p class="muted" style="font-size:18px">Click the button to hear the sound</p>'}
      <button class="btn primary" style="width:auto;padding:14px 32px" data-play-item>🔊 ${isWord ? `Play Sound: "${it.ex.w}"` : 'Play Sound'}</button>
      <div class="options">${it.opts.map(o => `<button data-answer="${o.symbol}" ${s.answered ? 'disabled' : ''}
        class="${s.answered && o === p ? 'ok' : s.answered && s.chosen === o.symbol ? 'bad' : ''}">/${o.symbol}/</button>`).join('')}</div>${fb}${next}`;
  } else {
    const wordOnly = s.mode === 'wordquiz';
    body = `<h3>${wordOnly ? 'Pronounce this word' : 'Practice Speaking'}</h3>
      <p class="word">${it.ex.w}</p>
      ${wordOnly ? '' : `<p class="ipa">/${it.ex.ipa}/</p><span class="pill" style="font-size:18px;padding:8px 16px">/${p.symbol}/ sound</span>
        <p><button class="btn" style="width:auto;margin-top:20px" data-say="${it.ex.w}">🔊 Listen to Example</button></p>`}
      ${fb}
      ${s.answered ? '' : `<button class="btn primary ${s.recording ? 'rec' : ''}" style="width:auto;padding:16px 48px" data-record ${s.recording ? 'disabled' : ''}>🎙 ${s.recording ? 'Listening…' : wordOnly ? 'Record Your Pronunciation' : 'Start Recording'}</button>`}
      ${s.answered ? `<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" style="width:auto" data-retry>Try Again</button>${next.replace('class="btn primary"', 'class="btn primary" style="width:auto"')}</div>` : ''}`;
  }
  return `<div class="quiz">${head}<div class="card">${body}</div>${exit}</div>`;
}

function answer(symbol) {
  const s = session, it = s.items[s.i];
  if (s.answered) return;
  const ok = symbol === it.p.symbol;
  Object.assign(s, { answered: true, chosen: symbol, last: ok, feedback: ok ? 'Correct! +5 XP' : `Not quite — it was /${it.p.symbol}/ (${it.p.ex[0].w})` });
  if (ok) s.score++;
  award(ok, it.p); render();
}

function record() {
  const s = session, it = s.items[s.i];
  s.recording = true; s.feedback = ''; s.last = null; render();
  recognize(alts => {
    s.recording = false;
    if (alts === null) { s.feedback = 'Speech recognition is not supported in this browser. Try Chrome or Safari.'; s.answered = true; s.last = false; return render(); }
    const heard = alts.map(norm), target = norm(it.ex.w);
    const ok = heard.some(h => h === target || h.split(' ').includes(target));
    Object.assign(s, { answered: true, last: ok, feedback: ok ? `Great! I heard "${heard[0]}". +5 XP` : heard[0] ? `I heard "${heard[0]}". Try again!` : 'No speech detected. Check microphone permission and try again.' });
    if (ok) s.score++;
    award(ok, it.p); render();
  });
}

function nextItem() {
  const s = session;
  s.i++; Object.assign(s, { answered: false, feedback: '', last: null, chosen: null });
  if (s.i >= s.items.length) { bumpStreak(); renderProgress(); toast(`<b>✔ Complete! You scored ${s.score}/${s.items.length}</b><br>Keep practicing to master all phonemes!`); }
  render();
}

// ---------- events ----------
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.tab; location.hash = tab; render(); } });
$('view').addEventListener('click', e => {
  const t = e.target.closest('[data-play],[data-open],[data-start],[data-answer],[data-play-item],[data-say],[data-record],[data-next],[data-retry],[data-exit],[data-reset]');
  if (!t) return;
  const d = t.dataset;
  if (d.play) { e.stopPropagation(); return playPhoneme(PHONEMES.find(p => p.id === d.play)); }
  if (d.open) { const tip = t.querySelector('.tip'); tip.hidden = !tip.hidden; return; }
  if (d.start) return startSession(d.start);
  if (d.answer) return answer(d.answer);
  if ('playItem' in d) { const it = session.items[session.i]; return session.mode === 'symbol' ? say(it.ex.w) : playPhoneme(it.p); }
  if (d.say) return say(d.say);
  if ('record' in d) return record();
  if ('next' in d) return nextItem();
  if ('retry' in d) { Object.assign(session, { answered: false, feedback: '', last: null }); return render(); }
  if ('exit' in d) { session = null; return render(); }
  if ('reset' in d && confirm('Reset all progress?')) { localStorage.removeItem('pr'); Object.assign(state, load()); renderProgress(); render(); }
});

renderProgress(); render();
