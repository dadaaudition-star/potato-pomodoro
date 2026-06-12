(() => {
  "use strict";

  const { BREAK_TIPS, TIME_HINTS, ACHIEVEMENTS } = window.PotatoConstants;
  const STORAGE_KEY = "potato-pomodoro-v1";

  const PHASE = {
    STUDY: "study",
    SHORT_BREAK: "shortBreak",
    LONG_BREAK: "longBreak",
  };

  const PHASE_LABELS = {
    [PHASE.STUDY]: "Study Time",
    [PHASE.SHORT_BREAK]: "Short Break",
    [PHASE.LONG_BREAK]: "Long Break",
  };

  const SHORT_BREAK_POTATOES = [
    "assets/images/potato-short-break-transparent.png",
    "assets/images/potato-break-transparent.png",
  ];

  const CONFETTI_COLORS = ["#7a8b5f", "#e8a04c", "#d9b67b", "#d4846a", "#fdfbf0", "#e8efe0"];
  const AMBIENT_EMOJIS = ["🍃", "🌿", "🌸", "🌼", "🌻", "✨", "⭐", "💫", "🍀"];
  const CELEBRATION_EMOJIS = ["🍃", "🌸", "🌼", "✨", "🥔", "🌿"];

  const PHASE_HISTORY = {
    [PHASE.STUDY]: "study",
    [PHASE.SHORT_BREAK]: "short-break",
    [PHASE.LONG_BREAK]: "long-break",
  };

  const SAYINGS = {
    idle: {
      [PHASE.STUDY]: ["Potato is waiting patiently.", "Ready when you are, friend.", "Potato believes in your focus."],
      [PHASE.SHORT_BREAK]: ["A tiny break awaits!", "Potato is ready to stretch.", "Rest those wonderful brain cells."],
      [PHASE.LONG_BREAK]: ["Time for a proper rest.", "Potato saved you a cozy nap spot.", "You've earned this long break!"],
    },
    running: {
      [PHASE.STUDY]: ["Study started. Potato is concentrating.", "Potato is deep in focus mode.", "Shhh… potato is thinking very hard.", "One pomodoro at a time!"],
      [PHASE.SHORT_BREAK]: ["Potato is doing a happy wiggle!", "Stretch, sip water, breathe.", "Quick break — potato approves."],
      [PHASE.LONG_BREAK]: ["Potato is lounging in the sun.", "Long break — you've earned it!", "Potato says: rest is productive too."],
    },
    paused: {
      [PHASE.STUDY]: ["Potato noticed you paused…", "Paused! Potato will wait right here.", "Break the pause when you're ready."],
      [PHASE.SHORT_BREAK]: ["Break paused. Potato is patient.", "Potato saved your spot on the couch."],
      [PHASE.LONG_BREAK]: ["Long break paused. No rush!", "Potato is still napping nearby."],
    },
    complete: {
      [PHASE.STUDY]: ["Study session complete! Potato is proud!", "Nice work! Potato is doing a little dance."],
      [PHASE.SHORT_BREAK]: ["Break over! Potato is refreshed.", "Back to work? Potato is cheering for you!"],
      [PHASE.LONG_BREAK]: ["Long break finished! Potato feels brand new.", "Rest complete — let's go again!"],
    },
  };

  const DEFAULT_SETTINGS = {
    studyMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    soundsEnabled: true,
    tickEnabled: true,
    chimeEnabled: true,
    showStudyTotal: true,
    showBreakTotal: true,
    showOverallTotal: true,
    autoStartNextPhase: false,
    ambientDecorations: true,
    showProgressBar: false,
    useProgressInsteadOfTimer: false,
    showPeriodStats: true,
  };

  const DEFAULT_STATE = {
    phase: PHASE.STUDY,
    secondsLeft: DEFAULT_SETTINGS.studyMinutes * 60,
    isRunning: false,
    completedStudySessions: 0,
    history: [],
    totals: { studySeconds: 0, breakSeconds: 0 },
    currentStudyTopic: "",
  };

  let settings = { ...DEFAULT_SETTINGS };
  let state = { ...DEFAULT_STATE };
  let historyFilter = "all";
  let timerId = null;
  let ambientTimer = null;
  let timerEndsAt = null;
  let lastTickSecond = null;
  let audioUnlocked = false;
  let currentBreakTip = "";
  let pendingTransition = null;

  const $ = (id) => document.getElementById(id);

  const els = {
    body: document.body,
    appFrame: document.querySelector(".app-frame"),
    phaseLabel: $("phase-label"),
    saying: $("potato-saying"),
    breakTip: $("break-tip"),
    potatoImage: $("potato-image"),
    potatoStage: $("potato-stage"),
    studyTopicWrap: $("study-topic-wrap"),
    studyTopicInput: $("study-topic-input"),
    timerDisplay: $("timer-display"),
    timerProgressWrap: $("timer-progress-wrap"),
    timerProgressFill: $("timer-progress-fill"),
    timerProgressLabel: $("timer-progress-label"),
    sessionDots: $("session-dots"),
    dailyCheer: $("daily-cheer"),
    streakBadge: $("streak-badge"),
    periodStats: $("period-stats"),
    periodToday: $("period-today"),
    periodWeek: $("period-week"),
    periodAll: $("period-all"),
    confettiLayer: $("confetti-layer"),
    ambientLayer: $("ambient-layer"),
    btnStartPause: $("btn-start-pause"),
    btnStop: $("btn-stop"),
    btnSkip: $("btn-skip"),
    btnSettings: $("btn-settings"),
    btnHistory: $("btn-history"),
    btnAchievements: $("btn-achievements"),
    settingsModal: $("settings-modal"),
    settingsForm: $("settings-form"),
    historyModal: $("history-modal"),
    historyList: $("history-list"),
    historyEmpty: $("history-empty"),
    historySummary: $("history-summary"),
    historyFilters: $("history-filters"),
    btnExportCsv: $("btn-export-csv"),
    btnClearHistory: $("btn-clear-history"),
    journalModal: $("journal-modal"),
    journalForm: $("journal-form"),
    journalInput: $("journal-input"),
    journalSkip: $("journal-skip"),
    achievementsModal: $("achievements-modal"),
    achievementList: $("achievement-list"),
    statsBar: $("stats-bar"),
    statStudy: $("stat-study"),
    statBreak: $("stat-break"),
    statTotal: $("stat-total"),
    statStudyValue: $("stat-study-value"),
    statBreakValue: $("stat-break-value"),
    statTotalValue: $("stat-total-value"),
    audioTick: $("audio-tick"),
    audioChime: $("audio-chime"),
    settingStudy: $("setting-study"),
    settingShortBreak: $("setting-short-break"),
    settingLongBreak: $("setting-long-break"),
    settingLongInterval: $("setting-long-interval"),
    settingSounds: $("setting-sounds"),
    settingTick: $("setting-tick"),
    settingChime: $("setting-chime"),
    settingShowStudy: $("setting-show-study"),
    settingShowBreak: $("setting-show-break"),
    settingShowTotal: $("setting-show-total"),
    settingAutoStart: $("setting-auto-start"),
    settingAmbient: $("setting-ambient"),
    settingProgressBar: $("setting-progress-bar"),
    settingProgressInstead: $("setting-progress-instead"),
    settingPeriodStats: $("setting-period-stats"),
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.settings) {
        settings = { ...DEFAULT_SETTINGS, ...saved.settings };
        if (saved.settings.autoStartAfterBreaks !== undefined && saved.settings.autoStartNextPhase === undefined) {
          settings.autoStartNextPhase = saved.settings.autoStartAfterBreaks;
        }
      }
      if (saved.state) {
        const loaded = { ...DEFAULT_STATE, ...saved.state };
        state = loaded;
        if (state.isRunning && loaded.savedAt) {
          const elapsed = Math.floor((Date.now() - loaded.savedAt) / 1000);
          state.secondsLeft = Math.max(0, state.secondsLeft - elapsed);
          if (state.secondsLeft === 0) state.isRunning = false;
        }
        delete state.savedAt;
      }
    } catch {
      settings = { ...DEFAULT_SETTINGS };
      state = { ...DEFAULT_STATE };
    }
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, state: { ...state, savedAt: Date.now() } })
    );
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    [els.audioTick, els.audioChime].forEach((audio) => {
      const vol = audio.volume;
      audio.volume = 0.01;
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.volume = vol || 1; }).catch(() => { audio.volume = vol || 1; });
    });
    audioUnlocked = true;
  }

  function pickSaying(group) {
    const list = SAYINGS[group]?.[state.phase] ?? SAYINGS.idle[state.phase];
    return list[Math.floor(Math.random() * list.length)];
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${totalSeconds}s`;
  }

  function phaseDurationSeconds(phase) {
    switch (phase) {
      case PHASE.STUDY: return settings.studyMinutes * 60;
      case PHASE.SHORT_BREAK: return settings.shortBreakMinutes * 60;
      case PHASE.LONG_BREAK: return settings.longBreakMinutes * 60;
      default: return 0;
    }
  }

  function sessionProgress() {
    const total = phaseDurationSeconds(state.phase);
    if (!total) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - state.secondsLeft) / total) * 100)));
  }

  function bodyPhaseClass() {
    if (state.phase === PHASE.STUDY) return "phase-study";
    if (state.phase === PHASE.SHORT_BREAK) return "phase-short-break";
    return "phase-long-break";
  }

  function potatoSrc() {
    switch (state.phase) {
      case PHASE.STUDY: return "assets/images/potato-study-transparent.png";
      case PHASE.SHORT_BREAK: return SHORT_BREAK_POTATOES[state.completedStudySessions % SHORT_BREAK_POTATOES.length];
      case PHASE.LONG_BREAK: return "assets/images/potato-long-break-transparent.png";
      default: return "assets/images/potato-study-transparent.png";
    }
  }

  function timeHintKey() {
    if (state.phase === PHASE.STUDY) return "study";
    if (state.phase === PHASE.SHORT_BREAK) return "shortBreak";
    return "longBreak";
  }

  function updateSayingFromTime() {
    if (!state.isRunning) return;
    const total = phaseDurationSeconds(state.phase);
    if (!total) return;
    const ratio = state.secondsLeft / total;
    const key = timeHintKey();
    const hints = TIME_HINTS[key === "shortBreak" ? "shortBreak" : key === "longBreak" ? "longBreak" : "study"];
    const match = hints.find((h) => ratio >= h.above);
    if (match) {
      const line = match.lines[Math.floor(Math.random() * match.lines.length)];
      els.saying.textContent = line;
    }
  }

  function updateBreakTip() {
    const onBreak = state.phase === PHASE.SHORT_BREAK || state.phase === PHASE.LONG_BREAK;
    if (!onBreak) {
      els.breakTip.hidden = true;
      return;
    }
    if (!currentBreakTip) {
      currentBreakTip = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
    }
    els.breakTip.hidden = false;
    els.breakTip.textContent = `Try: ${currentBreakTip}`;
  }

  function updatePotatoAnimation() {
    const stage = els.potatoStage;
    stage.classList.remove("potato-animate-bob", "potato-animate-wiggle", "potato-animate-nap");
    if (state.phase === PHASE.SHORT_BREAK && state.isRunning) stage.classList.add("potato-animate-wiggle");
    else if (state.phase === PHASE.LONG_BREAK) stage.classList.add("potato-animate-nap");
    else stage.classList.add("potato-animate-bob");
  }

  function updateControls() {
    const emoji = els.btnStartPause.querySelector(".btn-emoji");
    const label = els.btnStartPause.querySelector(".btn-label");
    if (state.isRunning) {
      emoji.textContent = "⏸️";
      label.textContent = "Pause";
      els.btnStartPause.setAttribute("aria-label", "Pause");
    } else {
      emoji.textContent = "▶️";
      label.textContent = "Start";
      els.btnStartPause.setAttribute("aria-label", "Start");
    }
  }

  function updateProgressBar() {
    const show = settings.showProgressBar;
    els.timerProgressWrap.hidden = !show;
    if (!show) return;
    const pct = sessionProgress();
    els.timerProgressFill.style.width = `${pct}%`;
    els.timerProgressLabel.textContent = `${pct}%`;
  }

  function updateTimerDisplay() {
    const useBarOnly = settings.showProgressBar && settings.useProgressInsteadOfTimer;
    els.timerDisplay.hidden = useBarOnly;
    if (!useBarOnly) els.timerDisplay.textContent = formatTime(state.secondsLeft);
    updateProgressBar();
  }

  function updateStudyTopicField() {
    const show = state.phase === PHASE.STUDY;
    els.studyTopicWrap.hidden = !show;
    if (els.studyTopicInput.value !== state.currentStudyTopic) {
      els.studyTopicInput.value = state.currentStudyTopic || "";
    }
  }

  function getFilteredHistory() {
    if (historyFilter === "all") return state.history;
    return state.history.filter((e) => e.type === historyFilter);
  }

  function summarizeHistory(entries) {
    const studyEntries = entries.filter((e) => e.type === "study");
    const studySeconds = entries.reduce((sum, e) => sum + (e.type === "study" ? e.durationSeconds : 0), 0);
    return { count: studyEntries.length, studySeconds, total: entries.length };
  }

  function getPeriodStats() {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const stats = { today: { pom: 0, sec: 0 }, week: { pom: 0, sec: 0 }, all: { pom: 0, sec: 0 } };
    for (const entry of state.history) {
      if (entry.type !== "study") continue;
      const d = new Date(entry.finishedAt);
      stats.all.pom += 1;
      stats.all.sec += entry.durationSeconds;
      if (d.toDateString() === todayStr) {
        stats.today.pom += 1;
        stats.today.sec += entry.durationSeconds;
      }
      if (d >= weekStart) {
        stats.week.pom += 1;
        stats.week.sec += entry.durationSeconds;
      }
    }
    return stats;
  }

  function updatePeriodStats() {
    els.periodStats.hidden = !settings.showPeriodStats;
    if (!settings.showPeriodStats) return;
    const s = getPeriodStats();
    els.periodToday.textContent = `${s.today.pom} pom · ${formatDuration(s.today.sec)}`;
    els.periodWeek.textContent = `${s.week.pom} pom · ${formatDuration(s.week.sec)}`;
    els.periodAll.textContent = `${s.all.pom} pom · ${formatDuration(s.all.sec)}`;
  }

  function getAchievementStats() {
    const studyEntries = state.history.filter((e) => e.type === "study");
    return {
      pomodoros: studyEntries.length,
      studyMinutes: Math.floor(studyEntries.reduce((s, e) => s + e.durationSeconds, 0) / 60),
      streak: computeStreak(),
      notes: state.history.filter((e) => e.completionNote).length,
    };
  }

  function computeStreak() {
    const studyDays = new Set(
      state.history.filter((e) => e.type === "study").map((e) => new Date(e.finishedAt).toDateString())
    );
    if (studyDays.size === 0) return 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!studyDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (studyDays.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function updateDailyCheer() {
    const today = new Date().toDateString();
    const count = state.history.filter((e) => e.type === "study" && new Date(e.finishedAt).toDateString() === today).length;
    if (count === 0) { els.dailyCheer.hidden = true; return; }
    els.dailyCheer.hidden = false;
    els.dailyCheer.textContent = count === 1 ? "1 potato-powered study session today 🥔" : `${count} potato-powered study sessions today 🥔✨`;
  }

  function updateStreakBadge() {
    const streak = computeStreak();
    if (streak === 0) { els.streakBadge.hidden = true; return; }
    els.streakBadge.hidden = false;
    els.streakBadge.textContent = streak === 1 ? "1-day potato streak 🔥" : `${streak}-day potato streak 🔥`;
  }

  function updateDocumentTitle() {
    const time = formatTime(state.secondsLeft);
    document.title = `${time}${state.isRunning ? "" : " · paused"} · Potato Pomodoro`;
  }

  function updateStatsDisplay() {
    const showAny = settings.showStudyTotal || settings.showBreakTotal || settings.showOverallTotal;
    els.statsBar.hidden = !showAny;
    els.statStudy.hidden = !settings.showStudyTotal;
    els.statBreak.hidden = !settings.showBreakTotal;
    els.statTotal.hidden = !settings.showOverallTotal;
    els.statStudyValue.textContent = formatDuration(state.totals.studySeconds);
    els.statBreakValue.textContent = formatDuration(state.totals.breakSeconds);
    els.statTotalValue.textContent = formatDuration(state.totals.studySeconds + state.totals.breakSeconds);
  }

  function updateSessionDots() {
    const interval = settings.longBreakInterval;
    els.sessionDots.innerHTML = "";
    for (let i = 0; i < interval; i += 1) {
      const dot = document.createElement("span");
      if (i < state.completedStudySessions % interval) dot.classList.add("filled");
      els.sessionDots.appendChild(dot);
    }
  }

  function renderHistory() {
    const entries = getFilteredHistory();
    const summary = summarizeHistory(entries);
    els.historySummary.textContent =
      historyFilter === "all"
        ? `${summary.total} sessions · ${summary.count} pomodoros · ${formatDuration(summary.studySeconds)} study`
        : `${summary.total} shown · ${summary.count} pomodoros · ${formatDuration(summary.studySeconds)} study`;

    els.historyList.innerHTML = "";
    for (const entry of [...entries].reverse()) {
      const li = document.createElement("li");
      const type = document.createElement("span");
      type.className = `entry-type ${entry.type}`;
      type.textContent = entry.type === "study" ? "Study" : entry.type === "short-break" ? "Short break" : "Long break";

      const meta = document.createElement("span");
      meta.className = "entry-meta";
      const date = new Date(entry.finishedAt);
      let detail = `${formatDuration(entry.durationSeconds)} · ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      if (entry.studyTopic) detail = `${entry.studyTopic} · ${detail}`;
      if (entry.completionNote) detail += ` · “${entry.completionNote}”`;
      meta.textContent = detail;

      li.append(type, meta);
      els.historyList.appendChild(li);
    }
    els.historyEmpty.hidden = entries.length > 0;
  }

  function renderAchievements() {
    const stats = getAchievementStats();
    els.achievementList.innerHTML = "";
    for (const ach of ACHIEVEMENTS) {
      const unlocked =
        (ach.minPomodoros && stats.pomodoros >= ach.minPomodoros) ||
        (ach.minStudyMinutes && stats.studyMinutes >= ach.minStudyMinutes) ||
        (ach.minStreak && stats.streak >= ach.minStreak) ||
        (ach.minNotes && stats.notes >= ach.minNotes);

      const li = document.createElement("li");
      li.className = unlocked ? "achievement unlocked" : "achievement locked";
      li.innerHTML = `<span class="achievement-emoji">${ach.emoji}</span><span class="achievement-text"><strong>${ach.name}</strong><br>${ach.desc}</span>`;
      els.achievementList.appendChild(li);
    }
  }

  function render() {
    els.body.className = bodyPhaseClass();
    els.phaseLabel.textContent = PHASE_LABELS[state.phase];
    els.potatoImage.src = potatoSrc();
    updateStudyTopicField();
    updateTimerDisplay();
    updatePotatoAnimation();
    updateControls();
    updateBreakTip();
    updateSessionDots();
    updateDailyCheer();
    updateStreakBadge();
    updatePeriodStats();
    updateStatsDisplay();
    updateDocumentTitle();
  }

  function populateSettingsForm() {
    els.settingStudy.value = settings.studyMinutes;
    els.settingShortBreak.value = settings.shortBreakMinutes;
    els.settingLongBreak.value = settings.longBreakMinutes;
    els.settingLongInterval.value = settings.longBreakInterval;
    els.settingSounds.checked = settings.soundsEnabled;
    els.settingTick.checked = settings.tickEnabled;
    els.settingChime.checked = settings.chimeEnabled;
    els.settingShowStudy.checked = settings.showStudyTotal;
    els.settingShowBreak.checked = settings.showBreakTotal;
    els.settingShowTotal.checked = settings.showOverallTotal;
    els.settingAutoStart.checked = settings.autoStartNextPhase;
    els.settingAmbient.checked = settings.ambientDecorations;
    els.settingProgressBar.checked = settings.showProgressBar;
    els.settingProgressInstead.checked = settings.useProgressInsteadOfTimer;
    els.settingPeriodStats.checked = settings.showPeriodStats;
  }

  function readSettingsForm() {
    settings = {
      studyMinutes: clamp(Number(els.settingStudy.value), 1, 120),
      shortBreakMinutes: clamp(Number(els.settingShortBreak.value), 1, 60),
      longBreakMinutes: clamp(Number(els.settingLongBreak.value), 1, 60),
      longBreakInterval: clamp(Number(els.settingLongInterval.value), 2, 12),
      soundsEnabled: els.settingSounds.checked,
      tickEnabled: els.settingTick.checked,
      chimeEnabled: els.settingChime.checked,
      showStudyTotal: els.settingShowStudy.checked,
      showBreakTotal: els.settingShowBreak.checked,
      showOverallTotal: els.settingShowTotal.checked,
      autoStartNextPhase: els.settingAutoStart.checked,
      ambientDecorations: els.settingAmbient.checked,
      showProgressBar: els.settingProgressBar.checked,
      useProgressInsteadOfTimer: els.settingProgressInstead.checked,
      showPeriodStats: els.settingPeriodStats.checked,
    };
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n || min));
  }

  function stopTickAudio() {
    els.audioTick.pause();
    els.audioTick.currentTime = 0;
  }

  function playChime() {
    if (!settings.soundsEnabled || !settings.chimeEnabled) return;
    unlockAudio();
    els.audioChime.currentTime = 0;
    els.audioChime.play().catch(() => {});
  }

  function playTick() {
    if (!settings.soundsEnabled || !settings.tickEnabled) return;
    if (state.phase !== PHASE.STUDY || !state.isRunning) return;
    unlockAudio();
    if (!els.audioTick.paused) return;
    els.audioTick.currentTime = 0;
    els.audioTick.play().catch(() => {});
  }

  function stopTimer(captureRemaining = true) {
    if (captureRemaining && timerEndsAt !== null) {
      state.secondsLeft = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    }
    if (timerId !== null) clearInterval(timerId);
    timerId = null;
    timerEndsAt = null;
    lastTickSecond = null;
    stopTickAudio();
  }

  function syncTimerFromClock() {
    if (!state.isRunning || timerEndsAt === null) return;
    const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    if (remaining !== state.secondsLeft) {
      const previous = state.secondsLeft;
      state.secondsLeft = remaining;
      if (state.phase === PHASE.STUDY && remaining > 0 && remaining < previous && remaining !== lastTickSecond) {
        lastTickSecond = remaining;
        playTick();
      }
      if (remaining !== previous && remaining % 15 === 0) updateSayingFromTime();
      updateTimerDisplay();
      updateDocumentTitle();
      persist();
    }
    if (remaining <= 0) {
      state.secondsLeft = 0;
      completePhase();
    }
  }

  function startTimer() {
    stopTimer(false);
    timerEndsAt = Date.now() + state.secondsLeft * 1000;
    lastTickSecond = state.secondsLeft;
    if (state.phase === PHASE.STUDY) playTick();
    else stopTickAudio();
    timerId = window.setInterval(syncTimerFromClock, 250);
  }

  function resumeTimerFromBackground() {
    if (state.isRunning && timerEndsAt !== null) syncTimerFromClock();
  }

  function logSession(phase, durationSeconds, extra = {}) {
    const type = PHASE_HISTORY[phase];
    state.history.push({
      id: crypto.randomUUID(),
      type,
      durationSeconds,
      finishedAt: Date.now(),
      studyTopic: phase === PHASE.STUDY ? (extra.studyTopic ?? state.currentStudyTopic ?? "").trim() : "",
      completionNote: extra.completionNote ?? "",
    });
    if (phase === PHASE.STUDY) state.totals.studySeconds += durationSeconds;
    else state.totals.breakSeconds += durationSeconds;
  }

  function nextPhaseAfterComplete() {
    if (state.phase === PHASE.STUDY) {
      state.completedStudySessions += 1;
      return state.completedStudySessions % settings.longBreakInterval === 0 ? PHASE.LONG_BREAK : PHASE.SHORT_BREAK;
    }
    return PHASE.STUDY;
  }

  function maybeAutoStartNextPhase() {
    if (!settings.autoStartNextPhase) return false;
    state.isRunning = true;
    els.saying.textContent = pickSaying("running");
    if (state.phase !== PHASE.STUDY) currentBreakTip = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
    startTimer();
    updatePotatoAnimation();
    updateControls();
    updateBreakTip();
    updateDocumentTitle();
    return true;
  }

  function transitionAfterPhase(completedPhase) {
    const next = nextPhaseAfterComplete();
    state.phase = next;
    state.secondsLeft = phaseDurationSeconds(next);
    state.isRunning = false;
    if (next !== PHASE.STUDY) currentBreakTip = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
    else currentBreakTip = "";
    els.saying.textContent = pickSaying("idle");
    render();
    if (maybeAutoStartNextPhase()) persist();
    else persist();
  }

  function promptStudyJournal(onDone) {
    els.journalInput.value = "";
    pendingTransition = onDone;
    els.journalModal.showModal();
    els.journalInput.focus();
  }

  function finishJournal(note) {
    const last = state.history[state.history.length - 1];
    if (last && last.type === "study" && note) last.completionNote = note;
    els.journalModal.close();
    const done = pendingTransition;
    pendingTransition = null;
    if (done) done();
  }

  function completePhase() {
    stopTimer();
    const completedPhase = state.phase;
    const duration = phaseDurationSeconds(completedPhase);
    logSession(completedPhase, duration, { studyTopic: state.currentStudyTopic });
    els.saying.textContent = pickSaying("complete");
    playChime();
    if (completedPhase === PHASE.STUDY) launchConfetti();

    if (completedPhase === PHASE.STUDY) {
      promptStudyJournal(() => transitionAfterPhase(completedPhase));
      updatePeriodStats();
      updateDailyCheer();
      updateStreakBadge();
      persist();
      return;
    }
    transitionAfterPhase(completedPhase);
  }

  function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    els.confettiLayer.innerHTML = "";
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      els.confettiLayer.appendChild(piece);
    }
    for (let i = 0; i < 14; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece emoji";
      piece.textContent = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      els.confettiLayer.appendChild(piece);
    }
    window.setTimeout(() => { els.confettiLayer.innerHTML = ""; }, 2400);
  }

  function spawnAmbientParticle() {
    if (!settings.ambientDecorations || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const piece = document.createElement("span");
    piece.className = "ambient-particle";
    piece.textContent = AMBIENT_EMOJIS[Math.floor(Math.random() * AMBIENT_EMOJIS.length)];
    piece.style.left = `${8 + Math.random() * 84}%`;
    const duration = 4 + Math.random() * 2.5;
    piece.style.animationDuration = `${duration}s`;
    els.ambientLayer.appendChild(piece);
    window.setTimeout(() => piece.remove(), duration * 1000 + 100);
  }

  function syncAmbientDecorations() {
    if (ambientTimer !== null) clearInterval(ambientTimer);
    ambientTimer = null;
    els.ambientLayer.innerHTML = "";
    if (settings.ambientDecorations) {
      els.appFrame.classList.add("decorations-on");
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        spawnAmbientParticle();
        ambientTimer = window.setInterval(spawnAmbientParticle, 2600);
      }
    } else {
      els.appFrame.classList.remove("decorations-on");
    }
  }

  function startPause() {
    unlockAudio();
    if (state.isRunning) {
      state.isRunning = false;
      stopTimer();
      els.saying.textContent = pickSaying("paused");
    } else {
      state.isRunning = true;
      els.saying.textContent = state.phase === PHASE.STUDY ? pickSaying("running") : pickSaying("running");
      startTimer();
    }
    updatePotatoAnimation();
    updateControls();
    persist();
  }

  function stopPhase() {
    stopTimer();
    state.isRunning = false;
    state.secondsLeft = phaseDurationSeconds(state.phase);
    els.saying.textContent = pickSaying("idle");
    render();
    persist();
  }

  function skipPhase() {
    stopTimer();
    playChime();
    const completedPhase = state.phase;
    const elapsed = phaseDurationSeconds(completedPhase) - state.secondsLeft;
    if (elapsed > 0) logSession(completedPhase, elapsed, { studyTopic: state.currentStudyTopic });

    if (completedPhase === PHASE.STUDY) {
      state.completedStudySessions += 1;
      state.phase = state.completedStudySessions % settings.longBreakInterval === 0 ? PHASE.LONG_BREAK : PHASE.SHORT_BREAK;
    } else {
      state.phase = PHASE.STUDY;
    }

    state.secondsLeft = phaseDurationSeconds(state.phase);
    state.isRunning = false;
    if (state.phase !== PHASE.STUDY) currentBreakTip = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
    els.saying.textContent = pickSaying("idle");
    render();
    if (maybeAutoStartNextPhase()) persist();
    else persist();
  }

  function exportCsv() {
    const rows = [["date", "time", "minutes", "type", "study_topic", "completion_note"]];
    for (const entry of state.history) {
      const d = new Date(entry.finishedAt);
      rows.push([
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        (entry.durationSeconds / 60).toFixed(2),
        entry.type,
        entry.studyTopic || "",
        entry.completionNote || "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `potato-pomodoro-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function applySettingsAndResetIfNeeded() {
    const previous = { ...settings };
    const wasRunning = state.isRunning;
    readSettingsForm();
    const durationsChanged =
      previous.studyMinutes !== settings.studyMinutes ||
      previous.shortBreakMinutes !== settings.shortBreakMinutes ||
      previous.longBreakMinutes !== settings.longBreakMinutes;
    if (durationsChanged) {
      state.secondsLeft = phaseDurationSeconds(state.phase);
      stopTimer();
      state.isRunning = false;
    } else if (wasRunning && timerId === null) {
      startTimer();
    }
    syncAmbientDecorations();
    persist();
    render();
  }

  function clearHistory() {
    if (!confirm("Clear all history and totals? Potato will forget everything.")) return;
    state.history = [];
    state.totals = { studySeconds: 0, breakSeconds: 0 };
    state.completedStudySessions = 0;
    persist();
    renderHistory();
    renderAchievements();
    updateSessionDots();
    updateDailyCheer();
    updateStreakBadge();
    updatePeriodStats();
    updateStatsDisplay();
  }

  function bindEvents() {
    els.btnStartPause.addEventListener("click", startPause);
    els.btnStop.addEventListener("click", stopPhase);
    els.btnSkip.addEventListener("click", skipPhase);

    els.studyTopicInput.addEventListener("input", () => {
      state.currentStudyTopic = els.studyTopicInput.value.trim();
      persist();
    });

    els.btnSettings.addEventListener("click", () => {
      populateSettingsForm();
      syncSoundToggleState();
      els.settingsModal.showModal();
    });

    els.btnHistory.addEventListener("click", () => {
      renderHistory();
      els.historyModal.showModal();
    });

    els.btnAchievements.addEventListener("click", () => {
      renderAchievements();
      els.achievementsModal.showModal();
    });

    els.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySettingsAndResetIfNeeded();
      els.settingsModal.close();
    });

    els.journalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      finishJournal(els.journalInput.value.trim());
    });

    els.journalSkip.addEventListener("click", () => finishJournal(""));

    els.btnExportCsv.addEventListener("click", exportCsv);
    els.btnClearHistory.addEventListener("click", clearHistory);

    els.historyFilters.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        historyFilter = btn.dataset.filter;
        els.historyFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderHistory();
      });
    });

    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => document.getElementById(btn.dataset.close)?.close());
    });

    els.settingSounds.addEventListener("change", syncSoundToggleState);
    els.settingProgressBar.addEventListener("change", () => {
      if (!els.settingProgressBar.checked) els.settingProgressInstead.checked = false;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resumeTimerFromBackground();
    });
    window.addEventListener("pageshow", resumeTimerFromBackground);
    window.addEventListener("focus", resumeTimerFromBackground);
  }

  function syncSoundToggleState() {
    const on = els.settingSounds.checked;
    els.settingTick.disabled = !on;
    els.settingChime.disabled = !on;
  }

  function init() {
    const hadSavedState = Boolean(localStorage.getItem(STORAGE_KEY));
    load();
    if (!hadSavedState) state.secondsLeft = phaseDurationSeconds(state.phase);
    else if (state.secondsLeft <= 0) {
      state.secondsLeft = phaseDurationSeconds(state.phase);
      state.isRunning = false;
    }
    bindEvents();
    syncSoundToggleState();
    syncAmbientDecorations();
    els.saying.textContent = pickSaying("idle");
    render();
    if (state.isRunning && state.secondsLeft > 0) {
      startTimer();
      updateControls();
    } else if (state.secondsLeft === 0 && state.isRunning) {
      completePhase();
    }
  }

  init();
})();
