(() => {
  "use strict";

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

  const PHASE_HISTORY = {
    [PHASE.STUDY]: "study",
    [PHASE.SHORT_BREAK]: "short-break",
    [PHASE.LONG_BREAK]: "long-break",
  };

  const SAYINGS = {
    idle: {
      [PHASE.STUDY]: [
        "Potato is waiting patiently.",
        "Ready when you are, friend.",
        "Potato believes in your focus.",
      ],
      [PHASE.SHORT_BREAK]: [
        "A tiny break awaits!",
        "Potato is ready to stretch.",
        "Rest those wonderful brain cells.",
      ],
      [PHASE.LONG_BREAK]: [
        "Time for a proper rest.",
        "Potato saved you a cozy nap spot.",
        "You've earned this long break!",
      ],
    },
    running: {
      [PHASE.STUDY]: [
        "Study started. Potato is concentrating.",
        "Potato is deep in focus mode.",
        "Shhh… potato is thinking very hard.",
        "One pomodoro at a time!",
      ],
      [PHASE.SHORT_BREAK]: [
        "Potato is doing a happy wiggle!",
        "Stretch, sip water, breathe.",
        "Quick break — potato approves.",
      ],
      [PHASE.LONG_BREAK]: [
        "Potato is lounging in the sun.",
        "Long break — you've earned it!",
        "Potato says: rest is productive too.",
      ],
    },
    paused: {
      [PHASE.STUDY]: [
        "Potato noticed you paused…",
        "Paused! Potato will wait right here.",
        "Break the pause when you're ready.",
      ],
      [PHASE.SHORT_BREAK]: [
        "Break paused. Potato is patient.",
        "Potato saved your spot on the couch.",
      ],
      [PHASE.LONG_BREAK]: [
        "Long break paused. No rush!",
        "Potato is still napping nearby.",
      ],
    },
    complete: {
      [PHASE.STUDY]: [
        "Study session complete! Potato is proud!",
        "Nice work! Potato is doing a little dance.",
      ],
      [PHASE.SHORT_BREAK]: [
        "Break over! Potato is refreshed.",
        "Back to work? Potato is cheering for you!",
      ],
      [PHASE.LONG_BREAK]: [
        "Long break finished! Potato feels brand new.",
        "Rest complete — let's go again!",
      ],
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
    autoStartAfterBreaks: false,
  };

  const DEFAULT_STATE = {
    phase: PHASE.STUDY,
    secondsLeft: DEFAULT_SETTINGS.studyMinutes * 60,
    isRunning: false,
    completedStudySessions: 0,
    history: [],
    totals: { studySeconds: 0, breakSeconds: 0 },
  };

  let settings = { ...DEFAULT_SETTINGS };
  let state = { ...DEFAULT_STATE };
  let timerId = null;
  let lastTickSecond = null;

  const $ = (id) => document.getElementById(id);

  const els = {
    body: document.body,
    phaseLabel: $("phase-label"),
    saying: $("potato-saying"),
    potatoImage: $("potato-image"),
    timerDisplay: $("timer-display"),
    sessionDots: $("session-dots"),
    dailyCheer: $("daily-cheer"),
    btnStartPause: $("btn-start-pause"),
    btnStop: $("btn-stop"),
    btnSkip: $("btn-skip"),
    btnSettings: $("btn-settings"),
    btnHistory: $("btn-history"),
    settingsModal: $("settings-modal"),
    settingsForm: $("settings-form"),
    historyModal: $("history-modal"),
    historyList: $("history-list"),
    historyEmpty: $("history-empty"),
    btnClearHistory: $("btn-clear-history"),
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
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.settings) settings = { ...DEFAULT_SETTINGS, ...saved.settings };
      if (saved.state) {
        state = {
          ...DEFAULT_STATE,
          ...saved.state,
          isRunning: false,
        };
      }
    } catch {
      settings = { ...DEFAULT_SETTINGS };
      state = { ...DEFAULT_STATE };
    }
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        state: { ...state, isRunning: false },
      })
    );
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
      case PHASE.STUDY:
        return settings.studyMinutes * 60;
      case PHASE.SHORT_BREAK:
        return settings.shortBreakMinutes * 60;
      case PHASE.LONG_BREAK:
        return settings.longBreakMinutes * 60;
      default:
        return 0;
    }
  }

  function bodyPhaseClass() {
    if (state.phase === PHASE.STUDY) return "phase-study";
    if (state.phase === PHASE.SHORT_BREAK) return "phase-short-break";
    return "phase-long-break";
  }

  function potatoSrc() {
    switch (state.phase) {
      case PHASE.STUDY:
        return "assets/images/potato-study-transparent.png";
      case PHASE.SHORT_BREAK:
        return "assets/images/potato-short-break-transparent.png";
      case PHASE.LONG_BREAK:
        return "assets/images/potato-long-break-transparent.png";
      default:
        return "assets/images/potato-study-transparent.png";
    }
  }

  function updatePotatoAnimation() {
    const img = els.potatoImage;
    img.classList.remove("potato-animate-bob", "potato-animate-wiggle", "potato-animate-nap");

    if (state.phase === PHASE.SHORT_BREAK && state.isRunning) {
      img.classList.add("potato-animate-wiggle");
    } else if (state.phase === PHASE.LONG_BREAK) {
      img.classList.add("potato-animate-nap");
    } else {
      img.classList.add("potato-animate-bob");
    }
  }

  function updateControls() {
    const playPause = els.btnStartPause;
    const emoji = playPause.querySelector(".btn-emoji");
    const label = playPause.querySelector(".btn-label");

    if (state.isRunning) {
      emoji.textContent = "⏸️";
      label.textContent = "Pause";
      playPause.setAttribute("aria-label", "Pause");
    } else {
      emoji.textContent = "▶️";
      label.textContent = "Start";
      playPause.setAttribute("aria-label", "Start");
    }
  }

  function updateDailyCheer() {
    const today = new Date().toDateString();
    const count = state.history.filter(
      (entry) => entry.type === "study" && new Date(entry.finishedAt).toDateString() === today
    ).length;

    if (count === 0) {
      els.dailyCheer.hidden = true;
      return;
    }

    els.dailyCheer.hidden = false;
    els.dailyCheer.textContent =
      count === 1
        ? "1 potato-powered study session today 🥔"
        : `${count} potato-powered study sessions today 🥔✨`;
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

  function updateStatsDisplay() {
    const showAny =
      settings.showStudyTotal ||
      settings.showBreakTotal ||
      settings.showOverallTotal;

    els.statsBar.hidden = !showAny;
    els.statStudy.hidden = !settings.showStudyTotal;
    els.statBreak.hidden = !settings.showBreakTotal;
    els.statTotal.hidden = !settings.showOverallTotal;

    els.statStudyValue.textContent = formatDuration(state.totals.studySeconds);
    els.statBreakValue.textContent = formatDuration(state.totals.breakSeconds);
    els.statTotalValue.textContent = formatDuration(
      state.totals.studySeconds + state.totals.breakSeconds
    );
  }

  function renderSaying(forceNew = false) {
    if (forceNew) {
      const group = state.isRunning ? "running" : "idle";
      els.saying.textContent = pickSaying(group);
      return;
    }
    if (!els.saying.textContent) {
      els.saying.textContent = pickSaying("idle");
    }
  }

  function render() {
    els.body.className = bodyPhaseClass();
    els.phaseLabel.textContent = PHASE_LABELS[state.phase];
    els.potatoImage.src = potatoSrc();
    els.potatoImage.alt = `${PHASE_LABELS[state.phase]} potato mascot`;
    els.timerDisplay.textContent = formatTime(state.secondsLeft);
    updatePotatoAnimation();
    updateControls();
    updateSessionDots();
    updateDailyCheer();
    updateStatsDisplay();
    renderHistory();
  }

  function renderHistory() {
    els.historyList.innerHTML = "";
    const sorted = [...state.history].reverse();
    for (const entry of sorted) {
      const li = document.createElement("li");
      const type = document.createElement("span");
      type.className = `entry-type ${entry.type}`;
      type.textContent =
        entry.type === "study"
          ? "Study"
          : entry.type === "short-break"
            ? "Short break"
            : "Long break";

      const meta = document.createElement("span");
      meta.className = "entry-meta";
      const date = new Date(entry.finishedAt);
      meta.textContent = `${formatDuration(entry.durationSeconds)} · ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      li.append(type, meta);
      els.historyList.appendChild(li);
    }
    els.historyEmpty.hidden = state.history.length > 0;
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
    els.settingAutoStart.checked = settings.autoStartAfterBreaks;
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
      autoStartAfterBreaks: els.settingAutoStart.checked,
    };
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n || min));
  }

  function playChime() {
    if (!settings.soundsEnabled || !settings.chimeEnabled) return;
    const audio = els.audioChime;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function playTick() {
    if (!settings.soundsEnabled || !settings.tickEnabled) return;
    if (state.phase !== PHASE.STUDY || !state.isRunning) return;
    const audio = els.audioTick;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    lastTickSecond = null;
  }

  function startTimer() {
    stopTimer();
    lastTickSecond = state.secondsLeft;
    timerId = setInterval(tick, 1000);
  }

  function tick() {
    if (state.secondsLeft <= 0) {
      completePhase();
      return;
    }

    state.secondsLeft -= 1;

    if (state.secondsLeft !== lastTickSecond) {
      lastTickSecond = state.secondsLeft;
      playTick();
    }

    els.timerDisplay.textContent = formatTime(state.secondsLeft);
    persist();
  }

  function logSession(phase, durationSeconds) {
    const type = PHASE_HISTORY[phase];
    state.history.push({
      id: crypto.randomUUID(),
      type,
      durationSeconds,
      finishedAt: Date.now(),
    });

    if (phase === PHASE.STUDY) {
      state.totals.studySeconds += durationSeconds;
    } else {
      state.totals.breakSeconds += durationSeconds;
    }
  }

  function nextPhaseAfterComplete() {
    if (state.phase === PHASE.STUDY) {
      state.completedStudySessions += 1;
      const interval = settings.longBreakInterval;
      if (state.completedStudySessions % interval === 0) {
        return PHASE.LONG_BREAK;
      }
      return PHASE.SHORT_BREAK;
    }
    return PHASE.STUDY;
  }

  function maybeAutoStartStudy(completedPhase) {
    const finishedBreak =
      completedPhase === PHASE.SHORT_BREAK || completedPhase === PHASE.LONG_BREAK;
    if (!settings.autoStartAfterBreaks || !finishedBreak || state.phase !== PHASE.STUDY) {
      return false;
    }

    state.isRunning = true;
    els.saying.textContent = pickSaying("running");
    startTimer();
    updatePotatoAnimation();
    updateControls();
    return true;
  }

  function completePhase() {
    stopTimer();
    const completedPhase = state.phase;
    const duration = phaseDurationSeconds(completedPhase);
    logSession(completedPhase, duration);

    els.saying.textContent = pickSaying("complete");
    playChime();

    const next = nextPhaseAfterComplete();
    state.phase = next;
    state.secondsLeft = phaseDurationSeconds(next);
    state.isRunning = false;

    render();

    if (maybeAutoStartStudy(completedPhase)) {
      persist();
      return;
    }

    persist();
  }

  function startPause() {
    if (state.isRunning) {
      state.isRunning = false;
      stopTimer();
      els.saying.textContent = pickSaying("paused");
    } else {
      state.isRunning = true;
      if (state.phase === PHASE.STUDY) {
        els.saying.textContent = pickSaying("running");
      } else {
        renderSaying(true);
      }
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
    const elapsed = phaseDurationSeconds(state.phase) - state.secondsLeft;
    if (elapsed > 0) {
      logSession(state.phase, elapsed);
    }

    if (state.phase === PHASE.STUDY) {
      state.completedStudySessions += 1;
      const interval = settings.longBreakInterval;
      state.phase =
        state.completedStudySessions % interval === 0
          ? PHASE.LONG_BREAK
          : PHASE.SHORT_BREAK;
    } else {
      state.phase = PHASE.STUDY;
    }

    state.secondsLeft = phaseDurationSeconds(state.phase);
    state.isRunning = false;
    els.saying.textContent = pickSaying("idle");
    render();
    persist();
  }

  function applySettingsAndResetIfNeeded() {
    readSettingsForm();
    state.secondsLeft = phaseDurationSeconds(state.phase);
    stopTimer();
    state.isRunning = false;
    updateStatsDisplay();
    updateSessionDots();
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
    updateSessionDots();
    updateDailyCheer();
    updateStatsDisplay();
  }

  function bindEvents() {
    els.btnStartPause.addEventListener("click", startPause);
    els.btnStop.addEventListener("click", stopPhase);
    els.btnSkip.addEventListener("click", skipPhase);

    els.btnSettings.addEventListener("click", () => {
      populateSettingsForm();
      syncSoundToggleState();
      els.settingsModal.showModal();
    });

    els.btnHistory.addEventListener("click", () => {
      renderHistory();
      els.historyModal.showModal();
    });

    els.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySettingsAndResetIfNeeded();
      els.settingsModal.close();
    });

    els.btnClearHistory.addEventListener("click", clearHistory);

    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.close)?.close();
      });
    });

    els.settingSounds.addEventListener("change", syncSoundToggleState);
  }

  function syncSoundToggleState() {
    const on = els.settingSounds.checked;
    els.settingTick.disabled = !on;
    els.settingChime.disabled = !on;
  }

  function init() {
    load();
    state.secondsLeft = phaseDurationSeconds(state.phase);
    bindEvents();
    syncSoundToggleState();
    els.saying.textContent = pickSaying("idle");
    render();
  }

  init();
})();
