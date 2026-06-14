/* CalledIt — buildless vanilla JS frontend */

// ─── API ────────────────────────────────────────────────────────────────────

const API = {
  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('/api/v1' + path, opts);
    if (res.status === 204) return null;
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || JSON.stringify(json));
    return json;
  },
  health:             ()         => API.request('GET', '/health'),
  getBoard:           code       => API.request('GET', `/boards/${code}`),
  createBoard:        body       => API.request('POST', '/boards', body),
  addMember:          (code, b)  => API.request('POST', `/boards/${code}/members`, b),
  addPrediction:      (code, b)  => API.request('POST', `/boards/${code}/predictions`, b),
  putForecast:        (id, b)    => API.request('PUT', `/predictions/${id}/forecast`, b),
  resolvePrediction:  (id, b)    => API.request('PATCH', `/predictions/${id}/resolve`, b),
  deletePrediction:   id         => API.request('DELETE', `/predictions/${id}`),
  getLeaderboard:     code       => API.request('GET', `/boards/${code}/leaderboard`),
  getCalibration:     (code, id) => API.request('GET', `/boards/${code}/members/${id}/calibration`),
};

// ─── i18n ────────────────────────────────────────────────────────────────────

const STR = {
  en: {
    landing: {
      hero: 'Who actually<br/>calls it?',
      subhead: "Drop predictions with your crew. Track who's sharp, who's wishful,\n          and who always says \"I told you so.\"",
      startBoard: 'Start a new board',
      boardPlaceholder: 'Friday Crew · Startup Bets · Q3 Calls…',
      createBoard: 'Create Board →',
      creating: 'Creating…',
      joinBoard: 'Join with a code',
      joinPlaceholder: 'DEMO01',
      joinBtn: 'Go →',
      seeDemo: 'See the demo board (DEMO01) →',
      footer: 'CalledIt · prediction accountability for people who <em>know</em> they\'re right',
      errNoName: 'Give your board a name.',
    },
    board: {
      allBoards: '← All boards',
      copyLink: 'Copy link',
      copied: '✓ Copied!',
      openPredictions: 'Open Predictions',
      resolved: 'Resolved',
      newClaim: '+ New Claim',
      noOpen: 'No open predictions yet. Make the first call!',
      noOpenShort: 'No open predictions yet.',
      notFound: 'Board not found',
      notFoundDesc: 'doesn\'t exist yet — or it\'s a typo.',
      backHome: '← Back to home',
    },
    me: {
      youAre: 'You are',
      pick: '— pick yourself —',
      addMe: '+ Add me…',
    },
    leaderboard: {
      title: '🏆 Leaderboard',
      briерHint: 'Brier score (lower = sharper) · click to see calibration',
      noRanked: 'No ranked members yet. Resolve 3 predictions to rank.',
      unranked: 'Unranked (need 3+ calls)',
      needMoreCalls: 'needs more calls',
      makeThreeCalls: 'Make 3 calls each to rank.',
      calls: '{n} calls',
      acc: '{acc}% acc',
      labels: {
        oracle: 'oracle',
        sharp: 'sharp',
        decent: 'decent',
        wishful: 'wishful',
      },
    },
    calibration: {
      title: 'Calibration chart',
      confidence: 'Confidence %',
      reality: 'Reality %',
      footer: 'Confidence vs Reality · dashed = perfect',
      brier: 'Brier',
      accuracy: 'Accuracy',
      calls: 'Calls',
      netStake: 'Net stake',
      yourCalls: 'Your calls',
      perfect: 'Perfect',
      failedLoad: 'Failed to load calibration.',
    },
    pred: {
      due: 'Due {date}',
      dueNow: 'DUE NOW',
      stake: '{stake} pts stake',
      yourCall: 'Your call',
      updateYourCall: 'Update your call',
      dropYourCall: 'Drop your call',
      updateCall: 'Update call',
      itHappened: '✓ It happened',
      itDidnt: "✗ It didn't",
      resolve: 'Resolve',
      happened: 'happened',
      didnt: "didn't",
      noForecasts: 'No forecasts yet.',
      saving: 'Saving…',
      resolving: 'Resolving…',
      deleteConfirm: 'Delete this prediction?',
    },
    hints: {
      almostNoChance: 'almost no chance',
      unlikely: 'unlikely',
      longShot: 'long shot',
      coinFlip: 'coin flip',
      likely: 'likely',
      prettyConfident: 'pretty confident',
      nearCertain: 'near-certain',
      allIn: 'all in',
    },
    modal: {
      newClaim: 'New Claim',
      claimLabel: 'What are you calling?',
      claimPlaceholder: 'We ship before Friday · Evals exceed 90% · Leo will admit he was wrong…',
      resolveByLabel: 'Resolve by',
      stakeLabel: 'Stake (optional points)',
      submitClaim: 'Drop this claim →',
      posting: 'Posting…',
      cancel: 'Cancel',
      errWriteClaim: 'Write your claim.',
      errPickDate: 'Pick a resolve date.',
      joinBoard: 'Join this board',
      yourName: 'Your name',
      namePlaceholder: 'Your name',
      join: 'Join →',
      joining: 'Joining…',
      errEnterName: 'Enter your name.',
    },
    toast: {
      forecastSaved: '📌 Forecast saved!',
      claimPosted: '🔮 Claim posted!',
      predDeleted: '🗑️ Prediction deleted.',
      calledIt: '🎯 {name} called it! Leaderboard updated.',
      leaderboardUpdated: '🎯 Resolved! Leaderboard updated.',
      refreshFailed: 'Refresh failed: {msg}',
      errSave: "Couldn't save — try again",
    },
  },
  ru: {
    landing: {
      hero: 'Кто реально<br/>угадывает?',
      subhead: 'Делайте прогнозы вместе с командой. Следите, кто точный, кто мечтатель\n          и кто всегда говорит «я же говорил».',
      startBoard: 'Создать новую доску',
      boardPlaceholder: 'Пятничная команда · Стартап-ставки · Цели Q3…',
      createBoard: 'Создать доску →',
      creating: 'Создаём…',
      joinBoard: 'Присоединиться по коду',
      joinPlaceholder: 'DEMO01',
      joinBtn: 'Перейти →',
      seeDemo: 'Посмотреть демо (DEMO01) →',
      footer: 'CalledIt · учёт прогнозов для тех, кто <em>знает</em>, что прав',
      errNoName: 'Дайте доске название.',
    },
    board: {
      allBoards: '← Все доски',
      copyLink: 'Скопировать',
      copied: '✓ Скопировано!',
      openPredictions: 'Открытые прогнозы',
      resolved: 'Завершённые',
      newClaim: '+ Новый прогноз',
      noOpen: 'Открытых прогнозов нет. Сделайте первый!',
      noOpenShort: 'Открытых прогнозов нет.',
      notFound: 'Доска не найдена',
      notFoundDesc: 'не существует — или это опечатка.',
      backHome: '← На главную',
    },
    me: {
      youAre: 'Вы',
      pick: '— выберите себя —',
      addMe: '+ Добавить меня…',
    },
    leaderboard: {
      title: '🏆 Таблица лидеров',
      briерHint: 'Brier-балл (чем ниже, тем точнее) · нажмите для калибровки',
      noRanked: 'Участников в рейтинге нет. Закройте 3 прогноза для ранжирования.',
      unranked: 'Без рейтинга (нужно 3+ прогноза)',
      needMoreCalls: 'нужно больше прогнозов',
      makeThreeCalls: 'Сделайте по 3 прогноза для ранжирования.',
      calls: '{n} прогнозов',
      acc: '{acc}% точность',
      labels: {
        oracle: 'оракул',
        sharp: 'точный',
        decent: 'неплохой',
        wishful: 'мечтатель',
      },
    },
    calibration: {
      title: 'График калибровки',
      confidence: 'Уверенность %',
      reality: 'Реальность %',
      footer: 'Уверенность vs Реальность · пунктир = идеал',
      brier: 'Brier',
      accuracy: 'Точность',
      calls: 'Прогнозы',
      netStake: 'Баланс',
      yourCalls: 'Ваши прогнозы',
      perfect: 'Идеал',
      failedLoad: 'Не удалось загрузить калибровку.',
    },
    pred: {
      due: 'До {date}',
      dueNow: 'СРОК СЕГОДНЯ',
      stake: 'Ставка {stake} оч.',
      yourCall: 'Ваш прогноз',
      updateYourCall: 'Обновить прогноз',
      dropYourCall: 'Сделать прогноз',
      updateCall: 'Обновить',
      itHappened: '✓ Сбылось',
      itDidnt: '✗ Не сбылось',
      resolve: 'Зафиксировать',
      happened: 'сбылось',
      didnt: 'не сбылось',
      noForecasts: 'Прогнозов пока нет.',
      saving: 'Сохраняем…',
      resolving: 'Фиксируем…',
      deleteConfirm: 'Удалить этот прогноз?',
    },
    hints: {
      almostNoChance: 'почти невозможно',
      unlikely: 'маловероятно',
      longShot: 'слабый шанс',
      coinFlip: '50 на 50',
      likely: 'вероятно',
      prettyConfident: 'уверен',
      nearCertain: 'почти точно',
      allIn: 'ва-банк',
    },
    modal: {
      newClaim: 'Новый прогноз',
      claimLabel: 'Что вы предсказываете?',
      claimPlaceholder: 'Мы выпустим продукт до пятницы · Оценки превысят 90% · Лео признает ошибку…',
      resolveByLabel: 'Дата истечения',
      stakeLabel: 'Ставка (опционально)',
      submitClaim: 'Создать →',
      posting: 'Публикуем…',
      cancel: 'Отмена',
      errWriteClaim: 'Напишите прогноз.',
      errPickDate: 'Выберите дату.',
      joinBoard: 'Присоединиться к доске',
      yourName: 'Ваше имя',
      namePlaceholder: 'Ваше имя',
      join: 'Войти →',
      joining: 'Входим…',
      errEnterName: 'Введите имя.',
    },
    toast: {
      forecastSaved: '📌 Прогноз сохранён!',
      claimPosted: '🔮 Прогноз опубликован!',
      predDeleted: '🗑️ Прогноз удалён.',
      calledIt: '🎯 {name} угадал! Таблица обновлена.',
      leaderboardUpdated: '🎯 Зафиксировано! Таблица обновлена.',
      refreshFailed: 'Ошибка обновления: {msg}',
      errSave: 'Не удалось сохранить — повторите',
    },
  },
};

let lang = (localStorage.getItem('calledit_lang') ||
  ((navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en'));

function t(key, vars = {}) {
  const parts = key.split('.');
  let str = STR[lang];
  for (const p of parts) str = str?.[p];
  if (!str) { str = STR['en']; for (const p of parts) str = str?.[p]; }
  if (!str) return key;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem('calledit_lang', lang);
  document.documentElement.lang = lang;
  // Re-render current view
  const route = getRoute();
  if (route.page === 'landing') {
    renderLanding();
  } else if (state.board) {
    renderBoard();
  }
}

// Set lang attribute on init
document.documentElement.lang = lang;

// ─── LANG SWITCHER HTML ──────────────────────────────────────────────────────

function renderLangSwitcher() {
  return `
    <div class="lang-switcher" role="group" aria-label="Language">
      <button class="lang-btn ${lang === 'en' ? 'lang-active' : ''}" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
      <span class="lang-sep">|</span>
      <button class="lang-btn ${lang === 'ru' ? 'lang-active' : ''}" data-lang="ru" aria-pressed="${lang === 'ru'}">RU</button>
    </div>`;
}

function wireLangSwitchers() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      if (newLang !== lang) setLang(newLang);
    });
  });
}

// ─── STATE ───────────────────────────────────────────────────────────────────

let state = {
  board: null,
  leaderboard: [],
  code: null,
  myMemberId: null,
  selectedMemberId: null,  // for calibration panel
  calChart: null,          // Chart.js instance
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const app = () => $('app');

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function showModal(html, onReady) {
  $('modal-content').innerHTML = html;
  const bd = $('modal-backdrop');
  bd.classList.remove('hidden');
  bd.classList.add('flex');
  if (onReady) onReady();
}

function closeModal() {
  const bd = $('modal-backdrop');
  bd.classList.add('hidden');
  bd.classList.remove('flex');
  $('modal-content').innerHTML = '';
}

$('modal-backdrop').addEventListener('click', e => {
  if (e.target === $('modal-backdrop')) closeModal();
});

document.addEventListener('keydown', e => {
  const modalOpen = !$('modal-backdrop').classList.contains('hidden');
  if (e.key === 'Escape' && modalOpen) { closeModal(); return; }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
  // `n` opens the new-claim modal when on a board and not typing
  if (e.key === 'n' && !typing && !modalOpen && !e.metaKey && !e.ctrlKey) {
    const btn = document.getElementById('btn-new-claim');
    if (btn) { e.preventDefault(); btn.click(); }
  }
});

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtProb(p) {
  return Math.round(p * 100) + '%';
}

function fmtBrier(b) {
  return b.toFixed(3);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

function probHint(v) {
  if (v <= 10) return t('hints.almostNoChance');
  if (v <= 30) return t('hints.unlikely');
  if (v <= 45) return t('hints.longShot');
  if (v <= 55) return t('hints.coinFlip');
  if (v <= 70) return t('hints.likely');
  if (v <= 85) return t('hints.prettyConfident');
  if (v <= 95) return t('hints.nearCertain');
  return t('hints.allIn');
}

function getMyId(code) {
  const v = localStorage.getItem(`calledit_me_${code}`);
  return v ? parseInt(v, 10) : null;
}

function setMyId(code, id) {
  localStorage.setItem(`calledit_me_${code}`, id);
  state.myMemberId = id;
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = t('board.copied') + ' <span class="copy-tick"></span>';
    setTimeout(() => { btn.textContent = t('board.copyLink'); }, 2000);
  });
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────

function getRoute() {
  const h = location.hash;
  if (!h || h === '#/' || h === '#') return { page: 'landing' };
  const code = h.slice(2).trim().toUpperCase();
  if (code) return { page: 'board', code };
  return { page: 'landing' };
}

window.addEventListener('hashchange', () => navigate());
window.addEventListener('DOMContentLoaded', () => navigate());

async function navigate() {
  const route = getRoute();
  if (route.page === 'landing') {
    renderLanding();
  } else {
    await loadBoard(route.code);
  }
}

// ─── LANDING ─────────────────────────────────────────────────────────────────

function renderLanding() {
  state.board = null;
  state.code = null;
  app().innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- Hero -->
      <div class="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center">

        <!-- Lang switcher in hero area -->
        <div class="absolute top-4 right-4">
          ${renderLangSwitcher()}
        </div>

        <div class="mb-6 text-5xl">🎯</div>
        <h1 class="font-display text-hero text-ink mb-3 leading-tight">${t('landing.hero')}</h1>
        <p class="text-muted text-body max-w-md mb-12">
          ${t('landing.subhead')}
        </p>

        <!-- Create board -->
        <div class="bg-surface border border-border rounded-card p-6 w-full max-w-md mb-6 card-appear">
          <h2 class="font-semibold text-h2 mb-4 text-ink">${t('landing.startBoard')}</h2>
          <input id="landing-title" type="text" maxlength="80" placeholder="${t('landing.boardPlaceholder')}"
            class="w-full bg-surface-2 border border-border rounded-control px-4 py-3 text-ink placeholder-muted text-body mb-4 focus:border-brand outline-none" />
          <button id="landing-create" class="w-full bg-brand hover:bg-brand-2 text-bg font-semibold rounded-control py-3 text-body transition-colors">
            ${t('landing.createBoard')}
          </button>
          <div id="landing-create-err" class="text-miss text-sm mt-2 hidden"></div>
        </div>

        <!-- Join board -->
        <div class="bg-surface border border-border rounded-card p-6 w-full max-w-md mb-6">
          <h2 class="font-semibold text-h2 mb-4 text-ink">${t('landing.joinBoard')}</h2>
          <div class="flex gap-2">
            <input id="landing-code" type="text" maxlength="8" placeholder="${t('landing.joinPlaceholder')}"
              class="flex-1 bg-surface-2 border border-border rounded-control px-4 py-3 text-ink placeholder-muted text-body focus:border-brand outline-none uppercase" />
            <button id="landing-join" class="bg-surface-2 hover:bg-border text-ink font-semibold rounded-control px-5 py-3 border border-border text-body transition-colors whitespace-nowrap">
              ${t('landing.joinBtn')}
            </button>
          </div>
        </div>

        <!-- Demo link -->
        <a href="#/DEMO01" class="text-muted hover:text-brand text-body underline transition-colors">
          ${t('landing.seeDemo')}
        </a>
      </div>

      <!-- Footer -->
      <footer class="text-center text-muted text-sm py-4 border-t border-border">
        ${t('landing.footer')}
      </footer>
    </div>
  `;

  wireLangSwitchers();

  $('landing-create').addEventListener('click', async () => {
    const title = $('landing-title').value.trim();
    const errEl = $('landing-create-err');
    if (!title) { errEl.textContent = t('landing.errNoName'); errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    $('landing-create').disabled = true;
    $('landing-create').textContent = t('landing.creating');
    try {
      const board = await API.createBoard({ title });
      location.hash = `#/${board.code}`;
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
      $('landing-create').disabled = false;
      $('landing-create').textContent = t('landing.createBoard');
    }
  });

  $('landing-title').addEventListener('keydown', e => { if (e.key === 'Enter') $('landing-create').click(); });

  $('landing-join').addEventListener('click', () => {
    const code = $('landing-code').value.trim().toUpperCase();
    if (code) location.hash = `#/${code}`;
  });

  $('landing-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('landing-join').click(); });
}

// ─── BOARD LOAD ──────────────────────────────────────────────────────────────

async function loadBoard(code) {
  state.code = code;
  state.myMemberId = getMyId(code);
  renderBoardSkeleton();
  try {
    const [board, leaderboard] = await Promise.all([
      API.getBoard(code),
      API.getLeaderboard(code),
    ]);
    state.board = board;
    state.leaderboard = leaderboard;
    renderBoard();
  } catch (e) {
    app().innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-8">
        <div class="text-center">
          <div class="text-4xl mb-4">🤔</div>
          <h2 class="text-h2 text-ink mb-2">${t('board.notFound')}</h2>
          <p class="text-muted mb-6">"${code}" ${t('board.notFoundDesc')}</p>
          <a href="#/" class="text-brand hover:underline">${t('board.backHome')}</a>
        </div>
      </div>`;
  }
}

function renderBoardSkeleton() {
  app().innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="skeleton h-8 w-48 mb-2 rounded"></div>
      <div class="skeleton h-4 w-64 mb-8 rounded"></div>
      <div class="skeleton h-48 rounded-card mb-6"></div>
      <div class="skeleton h-32 rounded-card mb-4"></div>
      <div class="skeleton h-32 rounded-card"></div>
    </div>`;
}

// ─── BOARD RENDER ────────────────────────────────────────────────────────────

function renderBoard() {
  const { board, code } = state;
  const shareUrl = `${location.origin}/#/${code}`;

  const openPreds  = board.predictions.filter(p => p.status === 'open');
  const resolvedPreds = board.predictions.filter(p => p.status === 'resolved');

  app().innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start gap-3 mb-6">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <a href="#/" class="text-muted text-sm hover:text-brand transition-colors whitespace-nowrap">${t('board.allBoards')}</a>
            <div class="ml-auto">${renderLangSwitcher()}</div>
          </div>
          <h1 class="font-display text-hero text-ink mt-1 leading-tight">${escHtml(board.title)}</h1>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span class="text-muted text-sm font-mono">${code}</span>
            <button id="copy-share" class="text-brand text-sm hover:underline transition-colors">${t('board.copyLink')}</button>
            <input id="share-link-hidden" type="hidden" value="${shareUrl}" />
          </div>
        </div>
        <!-- Me picker -->
        <div class="bg-surface border border-border rounded-card p-3 min-w-[180px]" id="me-widget">
          ${renderMeWidget()}
        </div>
      </div>

      <!-- Layout: two columns on wide, stacked on mobile -->
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- LEFT: Leaderboard + Calibration panel -->
        <div class="lg:w-80 flex-shrink-0">
          <div id="leaderboard-section">
            ${renderLeaderboard()}
          </div>
          <!-- Calibration panel placeholder -->
          <div id="calibration-panel" class="mt-4"></div>
        </div>

        <!-- RIGHT: Predictions -->
        <div class="flex-1 min-w-0">

          <!-- New claim button -->
          <div class="flex justify-between items-center mb-4 gap-2">
            <h2 class="font-semibold text-h2 text-ink">${t('board.openPredictions')}</h2>
            <button id="btn-new-claim"
              class="bg-brand hover:bg-brand-2 text-bg font-semibold rounded-control px-4 py-2 text-sm transition-colors whitespace-nowrap">
              ${t('board.newClaim')}
            </button>
          </div>

          <!-- Open predictions -->
          <div id="open-preds-list">
            ${openPreds.length ? openPreds.map(p => renderPredCard(p)).join('') : `
              <div class="bg-surface border border-border rounded-card p-6 text-center text-muted">
                ${t('board.noOpen')}
              </div>`}
          </div>

          <!-- Resolved predictions -->
          ${resolvedPreds.length ? `
            <div class="mt-8">
              <h2 class="font-semibold text-h2 text-ink mb-4">${t('board.resolved')}</h2>
              <div id="resolved-preds-list">
                ${resolvedPreds.map(p => renderPredCard(p)).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>

    </div>
  `;

  // Wire events
  $('copy-share').addEventListener('click', () => {
    copyToClipboard(shareUrl, $('copy-share'));
  });

  $('btn-new-claim').addEventListener('click', showNewClaimModal);

  wireLangSwitchers();
  wireMeWidget();
  wireLeaderboard();
  wirePredCards();
}

// ─── ME WIDGET ───────────────────────────────────────────────────────────────

function renderMeWidget() {
  const { board, myMemberId } = state;
  return `
    <p class="text-muted text-xs mb-2 font-semibold uppercase tracking-wider">${t('me.youAre')}</p>
    <select id="me-select"
      class="w-full bg-surface-2 border border-border rounded-control px-2 py-2 text-ink text-sm focus:border-brand outline-none">
      <option value="">${t('me.pick')}</option>
      ${board.members.map(m => `<option value="${m.id}" ${m.id === myMemberId ? 'selected' : ''}>${escHtml(m.name)}</option>`).join('')}
      <option value="__new__">${t('me.addMe')}</option>
    </select>
  `;
}

function wireMeWidget() {
  const sel = $('me-select');
  if (!sel) return;
  sel.addEventListener('change', async () => {
    const v = sel.value;
    if (v === '__new__') {
      showAddMemberModal();
    } else if (v) {
      setMyId(state.code, parseInt(v, 10));
      refreshOpenPreds();
    } else {
      localStorage.removeItem(`calledit_me_${state.code}`);
      state.myMemberId = null;
      refreshOpenPreds();
    }
  });
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

function mapLabel(label) {
  const map = { oracle: 'labels.oracle', sharp: 'labels.sharp', decent: 'labels.decent', wishful: 'labels.wishful' };
  return t(`leaderboard.${map[label] || 'labels.decent'}`);
}

function renderLeaderboard() {
  const { leaderboard } = state;
  if (!leaderboard.length) return `
    <div class="bg-surface border border-border rounded-card p-5 text-center text-muted text-sm">
      ${t('leaderboard.noRanked')}
    </div>`;

  const ranked   = leaderboard.filter(r => r.rank !== null);
  const unranked = leaderboard.filter(r => r.rank === null);

  const medalSymbol = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const labelColor = {
    oracle: 'bg-hit/20 text-hit',
    sharp: 'bg-brand/20 text-brand',
    decent: 'bg-muted/20 text-muted',
    wishful: 'bg-miss/20 text-miss',
  };

  const rowHtml = (r) => {
    const isFirst = r.rank === 1;
    const medal = r.rank && r.rank <= 3 ? medalSymbol[r.rank] : '';
    const lc = labelColor[r.label] || 'bg-muted/20 text-muted';
    const stakeColor = r.net_stake >= 0 ? 'text-hit' : 'text-miss';
    const netStakeStr = (r.net_stake >= 0 ? '+' : '') + r.net_stake.toFixed(0);
    return `
      <div class="lb-row flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface-2 transition-colors ${isFirst ? 'rank-1-glow bg-surface-2' : ''}"
           data-member-id="${r.member_id}" role="button" tabindex="0"
           aria-label="View calibration for ${escHtml(r.member)}">
        <div class="w-8 text-center text-lg">${medal || `<span class="text-muted font-mono text-sm">${r.rank ?? '—'}</span>`}</div>
        <div class="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-mono text-muted flex-shrink-0">
          ${initials(r.member)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-ink text-sm truncate">${escHtml(r.member)}</div>
          <div class="text-muted text-xs">${t('leaderboard.calls', { n: r.n })} · ${t('leaderboard.acc', { acc: r.accuracy.toFixed(0) })}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="font-mono text-score text-ink leading-none">${fmtBrier(r.brier)}</div>
          <div class="flex items-center gap-1 justify-end mt-0.5">
            <span class="text-xs px-1.5 py-0.5 rounded-full font-medium ${lc}">${mapLabel(r.label)}</span>
            <span class="${stakeColor} text-xs font-mono">${netStakeStr}</span>
          </div>
        </div>
      </div>`;
  };

  return `
    <div class="bg-surface border border-border rounded-card p-4">
      <h2 class="font-semibold text-h2 text-ink mb-3">${t('leaderboard.title')}</h2>
      <p class="text-muted text-xs mb-3">${t('leaderboard.briерHint')}</p>
      <div id="lb-rows" class="space-y-1">
        ${ranked.map(rowHtml).join('')}
        ${unranked.length ? `
          <div class="border-t border-border pt-2 mt-2">
            <p class="text-muted text-xs mb-1 px-3">${t('leaderboard.unranked')}</p>
            ${unranked.map(r => `
              <div class="lb-row flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface-2 transition-colors opacity-60"
                   data-member-id="${r.member_id}" role="button" tabindex="0">
                <div class="w-8 text-center"><span class="text-muted font-mono text-xs">—</span></div>
                <div class="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-mono text-muted flex-shrink-0">
                  ${initials(r.member)}
                </div>
                <div class="flex-1 text-sm text-muted truncate">${escHtml(r.member)}</div>
                <div class="text-right text-xs text-muted">${r.note ? t('leaderboard.needMoreCalls') : t('leaderboard.needMoreCalls')}</div>
              </div>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
}

function wireLeaderboard() {
  document.querySelectorAll('[data-member-id]').forEach(el => {
    const handler = () => {
      const id = parseInt(el.dataset.memberId, 10);
      toggleCalibration(id);
    };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

async function toggleCalibration(memberId) {
  const panel = $('calibration-panel');
  if (state.selectedMemberId === memberId) {
    state.selectedMemberId = null;
    panel.innerHTML = '';
    if (state.calChart) { state.calChart.destroy(); state.calChart = null; }
    return;
  }
  state.selectedMemberId = memberId;
  panel.innerHTML = `<div class="bg-surface border border-border rounded-card p-4"><div class="skeleton h-40 rounded"></div></div>`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  try {
    const [data, lb] = [
      await API.getCalibration(state.code, memberId),
      state.leaderboard,
    ];
    const member = lb.find(r => r.member_id === memberId);
    renderCalibrationPanel(data, member);
  } catch (e) {
    panel.innerHTML = `<div class="bg-surface border border-border rounded-card p-4 text-miss text-sm">${t('calibration.failedLoad')}</div>`;
  }
}

function renderCalibrationPanel(data, member) {
  const panel = $('calibration-panel');
  if (state.calChart) { state.calChart.destroy(); state.calChart = null; }

  panel.innerHTML = `
    <div class="bg-surface border border-border rounded-card p-4 card-appear">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-ink">${member ? escHtml(member.member) : 'Member'}</h3>
          <p class="text-muted text-xs">${t('calibration.title')}</p>
        </div>
        <button id="cal-close" class="text-muted hover:text-ink text-lg leading-none">&times;</button>
      </div>
      ${member ? `
        <div class="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div class="bg-surface-2 rounded-control p-2">
            <div class="text-muted">${t('calibration.brier')}</div>
            <div class="font-mono text-ink font-semibold">${fmtBrier(member.brier)}</div>
          </div>
          <div class="bg-surface-2 rounded-control p-2">
            <div class="text-muted">${t('calibration.accuracy')}</div>
            <div class="font-mono text-ink font-semibold">${member.accuracy.toFixed(0)}%</div>
          </div>
          <div class="bg-surface-2 rounded-control p-2">
            <div class="text-muted">${t('calibration.calls')}</div>
            <div class="font-mono text-ink font-semibold">${member.n}</div>
          </div>
          <div class="bg-surface-2 rounded-control p-2">
            <div class="text-muted">${t('calibration.netStake')}</div>
            <div class="font-mono font-semibold ${member.net_stake >= 0 ? 'text-hit' : 'text-miss'}">
              ${member.net_stake >= 0 ? '+' : ''}${member.net_stake.toFixed(0)}
            </div>
          </div>
        </div>` : ''}
      <div class="relative h-48">
        <canvas id="cal-chart"></canvas>
      </div>
      <p class="text-muted text-xs mt-2 text-center">${t('calibration.footer')}</p>
    </div>`;

  $('cal-close').addEventListener('click', () => {
    state.selectedMemberId = null;
    panel.innerHTML = '';
    if (state.calChart) { state.calChart.destroy(); state.calChart = null; }
  });

  // Build chart
  const points = data.map(d => ({ x: d.mean_prob * 100, y: d.hit_rate * 100 }));
  const diag = [{ x: 0, y: 0 }, { x: 100, y: 100 }];

  state.calChart = new Chart($('cal-chart'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: t('calibration.yourCalls'),
          data: points,
          backgroundColor: '#F59E0B',
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: t('calibration.perfect'),
          data: diag,
          type: 'line',
          borderColor: '#93A1C0',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0, max: 100,
          title: { display: true, text: t('calibration.confidence'), color: '#93A1C0', font: { size: 11 } },
          ticks: { color: '#93A1C0', font: { size: 10 } },
          grid: { color: '#2A3A5C' },
        },
        y: {
          min: 0, max: 100,
          title: { display: true, text: t('calibration.reality'), color: '#93A1C0', font: { size: 11 } },
          ticks: { color: '#93A1C0', font: { size: 10 } },
          grid: { color: '#2A3A5C' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Conf ${ctx.parsed.x.toFixed(0)}% → Hit ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
      },
    },
  });
}

// ─── PREDICTION CARDS ────────────────────────────────────────────────────────

function renderPredCard(p) {
  const isResolved = p.status === 'resolved';
  const isDue = p.due;
  const myId = state.myMemberId;
  const myForecast = myId ? p.forecasts.find(f => f.member_id === myId) : null;
  const hasMyForecast = !!myForecast;

  const outcomeIcon = isResolved
    ? (p.outcome === 1 ? '✅' : '❌')
    : (isDue ? '⏰' : '🔮');

  const borderClass = isDue && !isResolved
    ? 'border-pending'
    : isResolved
      ? (p.outcome === 1 ? 'border-hit/50' : 'border-miss/50')
      : 'border-border';

  const forecastChips = p.forecasts.map(f => {
    const isMe = myId && f.member_id === myId;
    const bgClass = isResolved
      ? (f.brier_contribution < 0.25 ? 'bg-hit/20 text-hit' : 'bg-miss/20 text-miss')
      : 'bg-surface-2 text-muted';
    return `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${bgClass} ${isMe ? 'ring-1 ring-brand' : ''}">
        ${initials(f.member_name)} <span class="text-ink/80">${fmtProb(f.probability)}</span>
        ${isResolved ? `<span class="text-xs opacity-60">(${f.brier_contribution.toFixed(2)})</span>` : ''}
      </span>`;
  }).join('');

  const sliderSection = (!isResolved && myId && !hasMyForecast) ? `
    <div class="mt-3 bg-surface-2 rounded-control p-3" data-forecast-area="${p.id}">
      <div class="flex justify-between items-center mb-1">
        <label class="text-muted text-xs">${t('pred.yourCall')}</label>
        <span id="prob-display-${p.id}" class="font-mono text-brand text-sm font-semibold">50%</span>
      </div>
      <input type="range" id="prob-slider-${p.id}" min="1" max="99" value="50"
        class="w-full mb-1" aria-label="Probability" />
      <div class="flex justify-between items-center">
        <span id="prob-hint-${p.id}" class="text-muted text-xs italic">${t('hints.coinFlip')}</span>
        <button data-forecast-btn="${p.id}"
          class="bg-brand hover:bg-brand-2 text-bg text-xs font-semibold rounded-control px-3 py-1.5 transition-colors">
          ${t('pred.dropYourCall')}
        </button>
      </div>
    </div>` : '';

  const updateForecastSection = (!isResolved && myId && hasMyForecast) ? `
    <div class="mt-3 bg-surface-2 rounded-control p-3" data-forecast-area="${p.id}">
      <div class="flex justify-between items-center mb-1">
        <label class="text-muted text-xs">${t('pred.updateYourCall')}</label>
        <span id="prob-display-${p.id}" class="font-mono text-brand text-sm font-semibold">${fmtProb(myForecast.probability)}</span>
      </div>
      <input type="range" id="prob-slider-${p.id}" min="1" max="99" value="${Math.round(myForecast.probability * 100)}"
        class="w-full mb-1" aria-label="Probability" />
      <div class="flex justify-between items-center">
        <span id="prob-hint-${p.id}" class="text-muted text-xs italic">${probHint(Math.round(myForecast.probability * 100))}</span>
        <button data-forecast-btn="${p.id}"
          class="bg-surface hover:bg-border text-ink text-xs font-semibold rounded-control px-3 py-1.5 border border-border transition-colors">
          ${t('pred.updateCall')}
        </button>
      </div>
    </div>` : '';

  const resolveButtons = (isDue && !isResolved && myId) ? `
    <div class="mt-3 flex gap-2">
      <button data-resolve-btn="${p.id}" data-outcome="true"
        class="flex-1 bg-hit/10 hover:bg-hit/20 text-hit border border-hit/30 text-xs font-semibold rounded-control px-3 py-2 transition-colors">
        ${t('pred.itHappened')}
      </button>
      <button data-resolve-btn="${p.id}" data-outcome="false"
        class="flex-1 bg-miss/10 hover:bg-miss/20 text-miss border border-miss/30 text-xs font-semibold rounded-control px-3 py-2 transition-colors">
        ${t('pred.itDidnt')}
      </button>
    </div>` : '';

  const deleteBtn = `
    <button data-delete-btn="${p.id}" class="text-muted hover:text-miss text-xs ml-2 transition-colors" title="Delete prediction">&times;</button>`;

  return `
    <div id="pred-card-${p.id}" class="bg-surface border ${borderClass} rounded-card p-4 mb-4 card-appear">
      <div class="flex justify-between items-start gap-2">
        <div class="flex items-start gap-2 flex-1 min-w-0">
          <span class="text-lg flex-shrink-0">${outcomeIcon}</span>
          <div class="min-w-0">
            <p class="text-ink font-medium text-body leading-snug">${escHtml(p.claim)}</p>
            <p class="text-muted text-xs mt-0.5">
              ${t('pred.due', { date: fmtDate(p.resolve_by) })}
              ${p.stake ? `· <span class="text-pending font-mono">${t('pred.stake', { stake: p.stake })}</span>` : ''}
              ${isDue && !isResolved ? `· <span class="text-pending font-semibold">${t('pred.dueNow')}</span>` : ''}
            </p>
          </div>
        </div>
        <div class="flex items-center flex-shrink-0">
          ${isResolved ? `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${p.outcome === 1 ? 'bg-hit/20 text-hit' : 'bg-miss/20 text-miss'}">${p.outcome === 1 ? t('pred.happened') : t('pred.didnt')}</span>` : ''}
          ${deleteBtn}
        </div>
      </div>

      <!-- Forecasters -->
      ${p.forecasts.length ? `<div class="mt-3 flex flex-wrap gap-1.5">${forecastChips}</div>` : `<p class="mt-3 text-muted text-xs">${t('pred.noForecasts')}</p>`}

      ${sliderSection}
      ${updateForecastSection}
      ${resolveButtons}
    </div>`;
}

function refreshOpenPreds() {
  const { board } = state;
  if (!board) return;
  const openPreds = board.predictions.filter(p => p.status === 'open');
  const container = $('open-preds-list');
  if (container) container.innerHTML = openPreds.length
    ? openPreds.map(p => renderPredCard(p)).join('')
    : `<div class="bg-surface border border-border rounded-card p-6 text-center text-muted">${t('board.noOpenShort')}</div>`;
  wirePredCards();
  // Refresh me widget
  const mw = $('me-widget');
  if (mw) { mw.innerHTML = renderMeWidget(); wireMeWidget(); }
}

function wirePredCards() {
  // Sliders
  document.querySelectorAll('input[type=range][id^="prob-slider-"]').forEach(slider => {
    const id = slider.id.replace('prob-slider-', '');
    const display = $(`prob-display-${id}`);
    const hint = $(`prob-hint-${id}`);
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      if (display) display.textContent = v + '%';
      if (hint) hint.textContent = probHint(v);
    });
  });

  // Forecast buttons
  document.querySelectorAll('[data-forecast-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const predId = parseInt(btn.dataset.forecastBtn, 10);
      const slider = $(`prob-slider-${predId}`);
      if (!slider || !state.myMemberId) return;
      const prob = parseInt(slider.value, 10) / 100;
      btn.disabled = true;
      btn.textContent = t('pred.saving');
      try {
        await API.putForecast(predId, { member_id: state.myMemberId, probability: prob });
        toast(t('toast.forecastSaved'));
        await refreshBoardData();
      } catch (e) {
        toast(t('toast.errSave'));
        btn.disabled = false;
        btn.textContent = t('pred.dropYourCall');
      }
    });
  });

  // Resolve buttons
  document.querySelectorAll('[data-resolve-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const predId = parseInt(btn.dataset.resolveBtn, 10);
      const outcome = btn.dataset.outcome === 'true';
      btn.disabled = true;
      btn.textContent = t('pred.resolving');
      try {
        await API.resolvePrediction(predId, { outcome });
        const topMover = state.leaderboard[0];
        toast(topMover
          ? t('toast.calledIt', { name: topMover.member })
          : t('toast.leaderboardUpdated'));
        await refreshBoardData(true);
      } catch (e) {
        toast('Error: ' + e.message);
        btn.disabled = false;
        btn.textContent = btn.dataset.outcome === 'true' ? t('pred.itHappened') : t('pred.itDidnt');
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('[data-delete-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const predId = parseInt(btn.dataset.deleteBtn, 10);
      if (!confirm(t('pred.deleteConfirm'))) return;
      try {
        await API.deletePrediction(predId);
        toast(t('toast.predDeleted'));
        await refreshBoardData();
      } catch (e) {
        toast('Error: ' + e.message);
      }
    });
  });
}

async function refreshBoardData(animateLb = false) {
  try {
    const [board, leaderboard] = await Promise.all([
      API.getBoard(state.code),
      API.getLeaderboard(state.code),
    ]);
    const oldLb = state.leaderboard;
    state.board = board;
    state.leaderboard = leaderboard;

    // Flash members whose rank improved
    if (animateLb) {
      const oldRanks = Object.fromEntries(oldLb.map(r => [r.member_id, r.rank]));
      leaderboard.forEach(r => {
        if (r.rank !== null && oldRanks[r.member_id] !== null && r.rank < (oldRanks[r.member_id] ?? 999)) {
          // rank improved — will flash after re-render
        }
      });
    }

    // Re-render leaderboard
    const lbSection = $('leaderboard-section');
    if (lbSection) {
      lbSection.innerHTML = renderLeaderboard();
      wireLeaderboard();
    }

    // Re-render predictions
    const openContainer = $('open-preds-list');
    if (openContainer) {
      const openPreds = board.predictions.filter(p => p.status === 'open');
      openContainer.innerHTML = openPreds.length
        ? openPreds.map(p => renderPredCard(p)).join('')
        : `<div class="bg-surface border border-border rounded-card p-6 text-center text-muted">${t('board.noOpenShort')}</div>`;
      wirePredCards();
    }

    const resolvedContainer = $('resolved-preds-list');
    if (resolvedContainer) {
      const resolvedPreds = board.predictions.filter(p => p.status === 'resolved');
      resolvedContainer.innerHTML = resolvedPreds.map(p => renderPredCard(p)).join('');
      wirePredCards();
    }

    // Refresh me widget
    const mw = $('me-widget');
    if (mw) { mw.innerHTML = renderMeWidget(); wireMeWidget(); }

  } catch (e) {
    toast(t('toast.refreshFailed', { msg: e.message }));
  }
}

// ─── MODALS ──────────────────────────────────────────────────────────────────

function showNewClaimModal() {
  const today = new Date().toISOString().split('T')[0];
  showModal(`
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-h2 text-ink">${t('modal.newClaim')}</h3>
      <button id="modal-close" class="text-muted hover:text-ink text-2xl leading-none">&times;</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-muted text-sm mb-1">${t('modal.claimLabel')}</label>
        <textarea id="claim-text" rows="3" maxlength="400"
          placeholder="${t('modal.claimPlaceholder')}"
          class="w-full bg-surface-2 border border-border rounded-control px-4 py-3 text-ink placeholder-muted text-body focus:border-brand outline-none resize-none"></textarea>
      </div>
      <div>
        <label class="block text-muted text-sm mb-1">${t('modal.resolveByLabel')}</label>
        <input type="date" id="claim-date" min="${today}" value="${today}"
          class="w-full bg-surface-2 border border-border rounded-control px-4 py-3 text-ink text-body focus:border-brand outline-none" />
      </div>
      <div>
        <label class="block text-muted text-sm mb-1">${t('modal.stakeLabel')}</label>
        <input type="number" id="claim-stake" min="0" max="1000" value="5" step="1"
          class="w-full bg-surface-2 border border-border rounded-control px-4 py-3 text-ink text-body focus:border-brand outline-none" />
      </div>
      <div id="claim-err" class="text-miss text-sm hidden"></div>
      <button id="claim-submit"
        class="w-full bg-brand hover:bg-brand-2 text-bg font-semibold rounded-control py-3 text-body transition-colors">
        ${t('modal.submitClaim')}
      </button>
    </div>
  `);

  $('modal-close').addEventListener('click', closeModal);
  $('claim-text').focus();

  $('claim-submit').addEventListener('click', async () => {
    const claim = $('claim-text').value.trim();
    const resolveBy = $('claim-date').value;
    const stake = parseFloat($('claim-stake').value) || 0;
    const errEl = $('claim-err');
    if (!claim) { errEl.textContent = t('modal.errWriteClaim'); errEl.classList.remove('hidden'); return; }
    if (!resolveBy) { errEl.textContent = t('modal.errPickDate'); errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    $('claim-submit').disabled = true;
    $('claim-submit').textContent = t('modal.posting');
    try {
      await API.addPrediction(state.code, { claim, resolve_by: resolveBy, stake });
      closeModal();
      toast(t('toast.claimPosted'));
      await refreshBoardData();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
      $('claim-submit').disabled = false;
      $('claim-submit').textContent = t('modal.submitClaim');
    }
  });
}

function showAddMemberModal() {
  showModal(`
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-h2 text-ink">${t('modal.joinBoard')}</h3>
      <button id="modal-close" class="text-muted hover:text-ink text-2xl leading-none">&times;</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-muted text-sm mb-1">${t('modal.yourName')}</label>
        <input type="text" id="member-name" maxlength="50" placeholder="${t('modal.namePlaceholder')}"
          class="w-full bg-surface-2 border border-border rounded-control px-4 py-3 text-ink placeholder-muted text-body focus:border-brand outline-none" />
      </div>
      <div id="member-err" class="text-miss text-sm hidden"></div>
      <button id="member-submit"
        class="w-full bg-brand hover:bg-brand-2 text-bg font-semibold rounded-control py-3 text-body transition-colors">
        ${t('modal.join')}
      </button>
    </div>
  `);

  $('modal-close').addEventListener('click', () => {
    closeModal();
    // Reset select
    const sel = $('me-select');
    if (sel) sel.value = state.myMemberId || '';
  });
  $('member-name').focus();

  $('member-submit').addEventListener('click', async () => {
    const name = $('member-name').value.trim();
    const errEl = $('member-err');
    if (!name) { errEl.textContent = t('modal.errEnterName'); errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    $('member-submit').disabled = true;
    $('member-submit').textContent = t('modal.joining');
    try {
      const member = await API.addMember(state.code, { name });
      setMyId(state.code, member.id);
      state.board.members.push(member);
      closeModal();
      toast(`👋 Welcome, ${member.name}!`);
      await refreshBoardData();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
      $('member-submit').disabled = false;
      $('member-submit').textContent = t('modal.join');
    }
  });

  $('member-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('member-submit').click(); });
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
