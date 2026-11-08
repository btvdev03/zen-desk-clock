/**
 * ZenDesk Clock - Master Application Controller
 * Supports 9 Aesthetic & Seasonal Themes, Web Audio Procedural Soundscapes,
 * 2.5D Multi-Layer Scenery Parallax Engine, 3D Optical DoF Particle Engine,
 * and Custom Milestone Event Countdown.
 */

import { clockEngine } from './clock.js';
import { FlipUnit } from './flip-renderer.js';
import { AnalogRenderer } from './analog-renderer.js';
import { pomodoroEngine } from './pomodoro.js';
import { soundEngine } from './audio-synth.js';
import { pipController } from './pip-controller.js';
import { wakeLockManager } from './wakelock.js';
import { getRandomQuote } from './quotes.js';
import { SeasonalParticleEngine } from './particle-engine.js';
import { eventCountdownManager } from './event-countdown.js';
import { SceneryEngine, PHOTO_PRESETS } from './scenery-engine.js';
import { wallpaperDB } from './wallpaper-db.js';
import { NixieRenderer } from './nixie-renderer.js';
import { nightModeManager } from './night-mode.js';
import { soundMixer } from './sound-mixer.js';
import { zenThreeScene } from './three-scene.js';

// Central Modal & Drawer Layering Coordinator
if (!window.zenModalManager) {
  window.zenModalManager = {
    stack: [],
    push(id, closeFn) {
      this.stack = this.stack.filter(item => item.id !== id);
      this.stack.push({ id, close: closeFn });
    },
    remove(id) {
      this.stack = this.stack.filter(item => item.id !== id);
    },
    closeTopmost() {
      if (this.stack.length > 0) {
        const top = this.stack.pop();
        if (top && typeof top.close === 'function') {
          try { top.close(); } catch (e) { console.error(e); }
          return true;
        }
      }
      return false;
    },
    hasOpenModal() {
      return this.stack.length > 0;
    }
  };

  // High-priority capture phase Escape handler: strictly closes topmost dialog/drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.zenModalManager.hasOpenModal()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.zenModalManager.closeTopmost();
      }
    }
  }, true);
}

class ZenApp {
  constructor() {
    this.currentThemeIndex = 0;
    this.themes = [
      'theme-flip',
      'theme-oled',
      'theme-matrix',
      'theme-aura',
      'theme-swiss',
      'theme-nixie',
      'theme-winter',
      'theme-spring',
      'theme-summer',
      'theme-autumn'
    ];
    this.themeLabels = {
      'theme-flip': 'Đồng Hồ Lật',
      'theme-oled': 'OLED Đen',
      'theme-matrix': 'Matrix CRT',
      'theme-aura': 'Hoàng Hôn Aura',
      'theme-swiss': 'Kim Thụy Sĩ',
      'theme-nixie': 'Đèn Nixie',
      'theme-winter': 'Mùa Đông',
      'theme-spring': 'Mùa Xuân',
      'theme-summer': 'Mùa Hạ',
      'theme-autumn': 'Mùa Thu'
    };
    this.progressMode = localStorage.getItem('zd_progress_mode') || 'realtime_pct';

    this.activeMode = 'clock'; // 'clock' | 'pomodoro'
    this.ambientSounds = ['none', 'rain', 'fire', 'ocean', 'crickets', 'birds', 'wind', 'thunder', 'cafe', 'brown', 'pink', 'white'];
    this.currentSoundIndex = 0; // starts at none
    this.particlePreference = 'auto'; // 'auto', 'snow', 'sakura', 'maple', 'fireflies', 'none'
    this.idleTimer = null;
    this.zenPureMode = false;

    this.flipUnits = {};
    this.analogRenderer = null;
    this.nixieRenderer = null;
    this.particleEngine = null;
    this.sceneryEngine = null;

    this.init();
  }

  init() {
    this._cacheDOM();
    this._initScenery();
    this._initParticles();
    this._initThreeScene();
    this._initFlipClock();
    this._initAnalogClock();
    this._initNixieClock();
    this._initNightMode();
    this._initPomodoro();
    this._initTimeEngine();
    this._initPiP();
    this._initWakeLock();
    this._initIdleDetection();
    this._initEventCountdown();
    this._initEventListeners();
    this._initWallpaperModal();
    this._initQuotes();
    this._loadSavedPreferences();
    if (typeof soundMixer !== 'undefined' && soundMixer.updateDockStatus) {
      soundMixer.updateDockStatus();
    }
  }

  _cacheDOM() {
    // Views
    this.flipClockView = document.getElementById('flipClockView');
    this.digitalClockView = document.getElementById('digitalClockView');
    this.analogClockView = document.getElementById('analogClockView');
    this.nixieClockView = document.getElementById('nixieClockView');
    this.pomodoroView = document.getElementById('pomodoroView');

    // Scenery & Particle Canvas
    this.sceneryContainer = document.getElementById('sceneryContainer');
    this.ambientCanvas = document.getElementById('ambientCanvas');

    // Digital view elements
    this.digitalHours = document.getElementById('digitalHours');
    this.digitalMinutes = document.getElementById('digitalMinutes');
    this.digitalSeconds = document.getElementById('digitalSeconds');
    this.digitalAmpm = document.getElementById('digitalAmpm');

    // Pomodoro elements
    this.pomoModeBadge = document.getElementById('pomoModeBadge');
    this.pomoTimeDisplay = document.getElementById('pomoTimeDisplay');
    this.pomoSessionDisplay = document.getElementById('pomoSessionDisplay');
    this.pomodoroProgressRing = document.getElementById('pomodoroProgressRing');

    // Top Bar elements
    this.topDateDisplay = document.getElementById('topDateDisplay');
    this.topDateShortDisplay = document.getElementById('topDateShortDisplay');
    this.topWeekDisplay = document.getElementById('topWeekDisplay');
    this.nightModeBtn = document.getElementById('nightModeBtn');
    this.nightModeDot = document.getElementById('nightModeDot');
    this.nightModeText = document.getElementById('nightModeText');
    this.wakeLockBtn = document.getElementById('wakeLockBtn');
    this.wakeLockDot = document.getElementById('wakeLockDot');
    this.wakeLockText = document.getElementById('wakeLockText');
    this.fullscreenTopBtn = document.getElementById('fullscreenTopBtn');
    this.eventCountdownChip = document.getElementById('eventCountdownChip');
    this.eventCountdownText = document.getElementById('eventCountdownText');
    this.eventCountdownCompactText = document.getElementById('eventCountdownCompactText');

    // Progress trackers
    this.dayProgressBar = document.getElementById('dayProgressBar');
    this.dayProgressPercent = document.getElementById('dayProgressPercent');
    this.yearProgressBar = document.getElementById('yearProgressBar');
    this.yearProgressPercent = document.getElementById('yearProgressPercent');

    // Quotes
    this.quotesBar = document.getElementById('quotesBar');
    this.quoteText = document.getElementById('quoteText');
    this.quoteAuthor = document.getElementById('quoteAuthor');

    // Dock buttons
    this.modeClockBtn = document.getElementById('modeClockBtn');
    this.modePomoBtn = document.getElementById('modePomoBtn');
    this.themeSwitchBtn = document.getElementById('themeSwitchBtn');
    this.themeNameLabel = document.getElementById('themeNameLabel');
    this.ambientSoundBtn = document.getElementById('ambientSoundBtn');
    this.soundLabel = document.getElementById('soundLabel');
    this.pipBtn = document.getElementById('pipBtn');
    this.threeDfxBtn = document.getElementById('threeDfxBtn');
    this.threeDfxToggle = document.getElementById('threeDfxToggle');
    this.threeDfxModeSelect = document.getElementById('threeDfxModeSelect');
    this.threeDfxOpacitySlider = document.getElementById('threeDfxOpacitySlider');
    this.threeDfxOpacityValue = document.getElementById('threeDfxOpacityValue');
    this.donateBtn = document.getElementById('donateBtn');
    this.donateModal = document.getElementById('donateModal');
    this.donateModalCloseBtn = document.getElementById('donateModalCloseBtn');
    this.copyDonateBtn = document.getElementById('copyDonateBtn');
    this.copyDonateBtnText = document.getElementById('copyDonateBtnText');
    this.donateAccNumber = document.getElementById('donateAccNumber');
    this.openDonateFromSettingsBtn = document.getElementById('openDonateFromSettingsBtn');
    this.settingsBtn = document.getElementById('settingsBtn');

    // Settings Modal elements
    this.settingsModal = document.getElementById('settingsModal');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.themeSelect = document.getElementById('themeSelect');
    this.format24Toggle = document.getElementById('format24Toggle');
    this.showSecondsToggle = document.getElementById('showSecondsToggle');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.focusDurationSelect = document.getElementById('focusDurationSelect');
    this.swissStyleSelect = document.getElementById('swissStyleSelect');
    this.swissMoveSelect = document.getElementById('swissMoveSelect');
    this.swissGlassToggle = document.getElementById('swissGlassToggle');
    this.particleSelect = document.getElementById('particleSelect');
    this.wallpaperSelect = document.getElementById('wallpaperSelect');
    this.customWallpaperOption = document.getElementById('customWallpaperOption');
    this.customWallpaperInput = document.getElementById('customWallpaperInput');
    this.uploadWallpaperBtn = document.getElementById('uploadWallpaperBtn');
    this.randomWallpaperBtn = document.getElementById('randomWallpaperBtn');
    this.wallpaperCaptionBadge = document.getElementById('wallpaperCaptionBadge');
    this.clearWallpaperBtn = document.getElementById('clearWallpaperBtn');
    this.bgDimmerSlider = document.getElementById('bgDimmerSlider');
    this.bgDimmerValue = document.getElementById('bgDimmerValue');
    this.bgBlurSlider = document.getElementById('bgBlurSlider');
    this.bgBlurValue = document.getElementById('bgBlurValue');
    this.manageEventsBtn = document.getElementById('manageEventsBtn');

    // Event Modal elements
    this.eventModal = document.getElementById('eventModal');
    this.eventModalCloseBtn = document.getElementById('eventModalCloseBtn');
    this.eventList = document.getElementById('eventList');
    this.eventAddForm = document.getElementById('eventAddForm');
    this.eventTitleInput = document.getElementById('eventTitleInput');
    this.eventIconInput = document.getElementById('eventIconInput');
    this.eventDateInput = document.getElementById('eventDateInput');
  }

  _initScenery() {
    if (this.sceneryContainer) {
      this.sceneryEngine = new SceneryEngine(this.sceneryContainer);
    }
  }


  _initThreeScene() {
    // Initialize 3D scene asynchronously
    zenThreeScene.init().then(() => {
      this._syncThreeControls();
    });

    // Dock button toggle
    if (this.threeDfxBtn) {
      this.threeDfxBtn.addEventListener('click', () => {
        const isEnabled = zenThreeScene.toggle();
        this._syncThreeControls();
        this._showToast(`Hiệu ứng 3D: ${isEnabled ? 'Bật' : 'Tắt'}`);
      });
    }

    // Settings Modal Toggle switch
    if (this.threeDfxToggle) {
      this.threeDfxToggle.addEventListener('change', (e) => {
        zenThreeScene.setEnabled(e.target.checked);
        this._syncThreeControls();
        this._showToast(`Hiệu ứng 3D: ${e.target.checked ? 'Bật' : 'Tắt'}`);
      });
    }

    // Settings Modal Mode selector
    if (this.threeDfxModeSelect) {
      this.threeDfxModeSelect.addEventListener('change', (e) => {
        zenThreeScene.setMode(e.target.value);
        this._syncThreeControls();
      });
    }

    // Settings Modal Opacity slider
    if (this.threeDfxOpacitySlider) {
      this.threeDfxOpacitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        zenThreeScene.setOpacity(val);
        if (this.threeDfxOpacityValue) {
          this.threeDfxOpacityValue.textContent = `${Math.round(val * 100)}%`;
        }
      });
    }
  }

  _syncThreeControls() {
    const isEnabled = zenThreeScene.enabled;
    if (this.threeDfxBtn) {
      this.threeDfxBtn.classList.toggle('active', isEnabled);
    }
    if (this.threeDfxToggle) {
      this.threeDfxToggle.checked = isEnabled;
    }
    if (this.threeDfxModeSelect) {
      this.threeDfxModeSelect.value = zenThreeScene.mode;
    }
    if (this.threeDfxOpacitySlider) {
      this.threeDfxOpacitySlider.value = zenThreeScene.opacity;
      if (this.threeDfxOpacityValue) {
        this.threeDfxOpacityValue.textContent = `${Math.round(zenThreeScene.opacity * 100)}%`;
      }
    }
  }

  _showToast(message) {
    let toast = document.getElementById('zenToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'zenToast';
      toast.className = 'swiss-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2200);
  }

  _initParticles() {
    if (this.ambientCanvas) {
      this.particleEngine = new SeasonalParticleEngine(this.ambientCanvas);
    }
  }

  _initFlipClock() {
    const timeData = clockEngine.getTimeData();
    this.flipUnits.hours = new FlipUnit(document.getElementById('flipHours'), timeData.hoursStr);
    this.flipUnits.minutes = new FlipUnit(document.getElementById('flipMinutes'), timeData.minutesStr);
    this.flipUnits.seconds = new FlipUnit(document.getElementById('flipSeconds'), timeData.secondsStr);
  }

  _initAnalogClock() {
    this.analogRenderer = new AnalogRenderer(this.analogClockView);
  }

  _initNixieClock() {
    if (this.nixieClockView) {
      this.nixieRenderer = new NixieRenderer(this.nixieClockView);
    }
  }

  _initNightMode() {
    if (this.nightModeBtn) {
      this.nightModeBtn.addEventListener('click', () => {
        nightModeManager.toggle(true);
      });
    }

    nightModeManager.onStateChange((enabled, color) => {
      if (this.nightModeBtn) {
        this.nightModeBtn.classList.toggle('active', enabled);
      }
      if (this.nightModeDot) {
        this.nightModeDot.classList.toggle('inactive', !enabled);
      }
      if (this.nightModeText) {
        this.nightModeText.textContent = 'Chế độ đêm';
      }
    });
  }

  _initPomodoro() {
    pomodoroEngine.onUpdate((data) => {
      this.pomoTimeDisplay.textContent = data.formattedTime;
      this.pomoSessionDisplay.textContent = `Đã hoàn thành: ${data.completedSessions} phiên`;

      const modeNames = {
        focus: 'Tập Trung Sâu',
        shortBreak: 'Nghỉ Ngắn',
        longBreak: 'Nghỉ Dài',
        flow: 'Dòng Chảy Tự Do'
      };
      this.pomoModeBadge.textContent = modeNames[data.mode] || 'Tập Trung';

      const circumference = 552.92;
      const offset = circumference - (data.progress * circumference);
      this.pomodoroProgressRing.style.strokeDashoffset = offset;

      if (this.activeMode === 'pomodoro') {
        document.title = `(${data.formattedTime}) ZenDesk Clock`;
      }
    });

    this.pomodoroView.addEventListener('click', () => {
      pomodoroEngine.toggle();
    });
  }

  _initTimeEngine() {
    clockEngine.onTick((timeData, isNewSecond) => {
      const currentTheme = this.themes[this.currentThemeIndex];

      if (isNewSecond) {
        this.topDateDisplay.textContent = timeData.dateFormatted;
        if (this.topDateShortDisplay) {
          this.topDateShortDisplay.textContent = timeData.dateShortFormatted;
        }
        this.topWeekDisplay.textContent = `Tuần ${timeData.isoWeek}`;
        // Update Progress Trackers in realtime lockstep
        this._updateProgressTrackers(timeData);

        // Update Event Countdown
        const countdownData = eventCountdownManager.getActiveCountdown();
        if (countdownData) {
          this.eventCountdownText.textContent = countdownData.shortFormatted;
          if (this.eventCountdownCompactText) {
            this.eventCountdownCompactText.textContent = countdownData.compactFormatted;
          }
        }

        if (this.activeMode === 'clock') {
          document.title = `${timeData.hoursStr}:${timeData.minutesStr} — ZenDesk Clock`;
        }
      }

      // Render clock faces
      if (currentTheme === 'theme-nixie') {
        if (this.nixieRenderer) {
          this.nixieRenderer.update(timeData, isNewSecond);
        }
      } else if (currentTheme === 'theme-flip' || currentTheme.startsWith('theme-winter') || currentTheme.startsWith('theme-spring') || currentTheme.startsWith('theme-summer') || currentTheme.startsWith('theme-autumn')) {
        this.flipUnits.hours.flipTo(timeData.hoursStr, isNewSecond);
        this.flipUnits.minutes.flipTo(timeData.minutesStr, isNewSecond);
        this.flipUnits.seconds.flipTo(timeData.secondsStr, false);
      } else if (currentTheme === 'theme-swiss') {
        this.analogRenderer.update(timeData);
      } else {
        if (isNewSecond) {
          this.digitalHours.textContent = timeData.hoursStr;
          this.digitalMinutes.textContent = timeData.minutesStr;
          this.digitalSeconds.textContent = timeData.secondsStr;
          this.digitalAmpm.textContent = timeData.ampm;
        }
      }
    });

    clockEngine.start();
  }

  _updateProgressTrackers(timeData) {
    if (!this.dayProgressBar || !this.yearProgressBar) return;

    // 1. Update progress bar fill widths with high precision
    const dayW = Math.max(0, Math.min(100, timeData.dayProgressRaw || 0));
    const yearW = Math.max(0, Math.min(100, timeData.yearProgressRaw || 0));

    this.dayProgressBar.style.width = `${dayW.toFixed(4)}%`;
    this.yearProgressBar.style.width = `${yearW.toFixed(4)}%`;

    // 2. Update Live Mode Badge & Digits
    const liveBadge = document.getElementById('progressLiveBadge');
    const liveText = document.getElementById('progressLiveText');

    if (this.progressMode === 'countdown') {
      if (liveBadge) liveBadge.className = 'progress-live-badge mode-countdown';
      if (liveText) liveText.textContent = 'ĐẾM NGƯỢC';

      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMsDay = Math.max(0, midnight - now);
      const remHours = Math.floor(diffMsDay / (1000 * 60 * 60));
      const remMins = Math.floor((diffMsDay % (1000 * 60 * 60)) / (1000 * 60));
      const remSecs = Math.floor((diffMsDay % (1000 * 60)) / 1000);
      const pad = (n) => String(n).padStart(2, '0');

      if (this.dayProgressPercent) {
        this.dayProgressPercent.innerHTML = `<span class="prog-countdown">Còn ${pad(remHours)}:${pad(remMins)}:${pad(remSecs)}</span>`;
      }

      const endOfYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
      const diffMsYear = Math.max(0, endOfYear - now);
      const remYearDays = Math.floor(diffMsYear / (1000 * 60 * 60 * 24));
      const remYearHours = Math.floor((diffMsYear % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const remYearMins = Math.floor((diffMsYear % (1000 * 60)) / (1000 * 60));
      const remYearSecs = Math.floor((diffMsYear % (1000 * 60)) / 1000);

      if (this.yearProgressPercent) {
        this.yearProgressPercent.innerHTML = `<span class="prog-countdown">Còn ${remYearDays}n ${pad(remYearHours)}:${pad(remYearMins)}:${pad(remYearSecs)}</span>`;
      }
    } else if (this.progressMode === 'simple_pct') {
      if (liveBadge) liveBadge.className = 'progress-live-badge mode-simple';
      if (liveText) liveText.textContent = 'CHUẨN';

      if (this.dayProgressPercent) {
        this.dayProgressPercent.innerHTML = `<span class="prog-int">${timeData.dayProgressPercent}</span><span class="prog-pct">%</span>`;
      }
      if (this.yearProgressPercent) {
        this.yearProgressPercent.innerHTML = `<span class="prog-int">${timeData.yearProgressPercent}</span><span class="prog-pct">%</span>`;
      }
    } else {
      // Default: 'realtime_pct' (Live High-Precision Ticker)
      if (liveBadge) liveBadge.className = 'progress-live-badge';
      if (liveText) liveText.textContent = 'LIVE';

      if (this.dayProgressPercent) {
        this.dayProgressPercent.innerHTML = `
          <span class="prog-int">${timeData.dayProgressInt || 0}</span><span class="prog-dec">${timeData.dayProgressDec || '.0000'}</span><span class="prog-pct">%</span>
        `;
      }
      if (this.yearProgressPercent) {
        this.yearProgressPercent.innerHTML = `
          <span class="prog-int">${timeData.yearProgressInt || 0}</span><span class="prog-dec">${timeData.yearProgressDec || '.0000'}</span><span class="prog-pct">%</span>
        `;
      }
    }
  }

  _initPiP() {
    pipController.setStateGetter(() => {
      const timeData = clockEngine.getTimeData();
      const pomoFormatted = pomodoroEngine.getFormattedTime();
      const pomoModeLabels = {
        focus: 'TẬP TRUNG',
        shortBreak: 'NGHỈ NGẮN',
        longBreak: 'NGHỈ DÀI',
        flow: 'TỰ DO'
      };
      const pomoMode = pomoModeLabels[pomodoroEngine.mode] || 'TẬP TRUNG';
      return {
        timeStr: `${timeData.hoursStr}:${timeData.minutesStr}:${timeData.secondsStr}`,
        pomoStr: `${pomoMode} ${pomoFormatted}`
      };
    });
  }

  _initWakeLock() {
    wakeLockManager.onStatusChange((active) => {
      if (this.wakeLockBtn) {
        this.wakeLockBtn.classList.toggle('active', active);
      }
      if (this.wakeLockDot) {
        if (active) {
          this.wakeLockDot.classList.remove('inactive');
        } else {
          this.wakeLockDot.classList.add('inactive');
        }
      }
      if (this.wakeLockText) {
        this.wakeLockText.textContent = 'Màn hình bật';
      }
    });

    const enableWake = async () => {
      await wakeLockManager.requestLock();
      window.removeEventListener('click', enableWake);
    };
    window.addEventListener('click', enableWake, { once: true });
  }

  _isAnyModalOrActiveInputOpen() {
    if (window.zenModalManager && window.zenModalManager.hasOpenModal()) {
      return true;
    }

    const openModals = document.querySelectorAll(
      '.modal-overlay.open, .zen-tasks-modal.open, .weather-modal-overlay.open, .sound-mixer-modal.open, .sound-mixer-overlay.open, .zen-scratchpad-drawer.open'
    );
    if (openModals.length > 0) return true;

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return true;
    }

    return false;
  }

  _initIdleDetection() {
    const resetIdle = () => {
      if (this.zenPureMode) return;
      document.body.classList.remove('idle');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        // Never trigger auto-idle if any modal is open, or user is focused/typing in scratchpad/inputs
        if (this._isAnyModalOrActiveInputOpen()) {
          return;
        }
        document.body.classList.add('idle');
      }, 3500);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('mousedown', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    resetIdle();
  }

  _initEventCountdown() {
    eventCountdownManager.onChange((data) => {
      if (data && this.eventCountdownText) {
        this.eventCountdownText.textContent = data.shortFormatted;
        if (this.eventCountdownCompactText) {
          this.eventCountdownCompactText.textContent = data.compactFormatted;
        }
      }
    });

    this.eventCountdownChip.addEventListener('click', () => {
      eventCountdownManager.cycleActiveEvent();
    });
  }

  _initQuotes() {
    const updateQuote = () => {
      const q = getRandomQuote();
      this.quoteText.textContent = `"${q.text}"`;
      this.quoteAuthor.textContent = `— ${q.author}`;
    };

    this.quotesBar.addEventListener('click', updateQuote);
    setInterval(updateQuote, 15 * 60 * 1000);
  }

  _initEventListeners() {
    // Mode Switching
    this.modeClockBtn.addEventListener('click', () => this.setMode('clock'));
    this.modePomoBtn.addEventListener('click', () => this.setMode('pomodoro'));

    // Progress Trackers click-to-cycle between:
    // 1. 'realtime_pct' (Live high-precision % ticking every second)
    // 2. 'countdown' (Live countdown remaining hh:mm:ss)
    // 3. 'simple_pct' (Classic rounded 1-decimal %)
    const progressTrackers = document.getElementById('progressTrackers');
    if (progressTrackers) {
      progressTrackers.addEventListener('click', () => {
        if (this.progressMode === 'realtime_pct') {
          this.progressMode = 'countdown';
        } else if (this.progressMode === 'countdown') {
          this.progressMode = 'simple_pct';
        } else {
          this.progressMode = 'realtime_pct';
        }
        localStorage.setItem('zd_progress_mode', this.progressMode);
        const timeData = clockEngine.getTimeData();
        this._updateProgressTrackers(timeData);
      });
    }

    // Theme Switcher Button
    this.themeSwitchBtn.addEventListener('click', () => this.cycleTheme());

    // Ambient Sound Button -> Opens Sound Mixer
    if (this.ambientSoundBtn) {
      this.ambientSoundBtn.addEventListener('click', () => {
        soundMixer.open();
      });
    }

    // PiP Button
    this.pipBtn.addEventListener('click', async () => {
      await pipController.toggle();
    });

    // Wake Lock Button
    this.wakeLockBtn.addEventListener('click', async () => {
      await wakeLockManager.toggle();
    });

    // Fullscreen Button
    this.fullscreenTopBtn.addEventListener('click', () => this.toggleFullscreen());

    // Donate & Author Socials Modal
    if (this.donateBtn) {
      this.donateBtn.addEventListener('click', () => this.openModal(this.donateModal));
    }
    if (this.openDonateFromSettingsBtn) {
      this.openDonateFromSettingsBtn.addEventListener('click', () => {
        this.closeModal(this.settingsModal);
        this.openModal(this.donateModal);
      });
    }
    if (this.donateModalCloseBtn) {
      this.donateModalCloseBtn.addEventListener('click', () => this.closeModal(this.donateModal));
    }
    if (this.donateModal) {
      this.donateModal.addEventListener('click', (e) => {
        if (e.target === this.donateModal) this.closeModal(this.donateModal);
      });
    }
    if (this.copyDonateBtn) {
      this.copyDonateBtn.addEventListener('click', () => {
        const textToCopy = this.donateAccNumber ? this.donateAccNumber.textContent.trim() : 'btv.dev03@gmail.com';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            this._showToast('Đã sao chép thông tin ủng hộ! Cảm ơn bạn rất nhiều ❤️');
            if (this.copyDonateBtnText) {
              this.copyDonateBtnText.textContent = 'Đã chép!';
              setTimeout(() => {
                if (this.copyDonateBtnText) this.copyDonateBtnText.textContent = 'Sao chép';
              }, 2000);
            }
          }).catch(() => {
            this._showToast('Thông tin ủng hộ: ' + textToCopy);
          });
        } else {
          this._showToast('Thông tin ủng hộ: ' + textToCopy);
        }
      });
    }

    // Settings Modal
    this.settingsBtn.addEventListener('click', () => this.openModal(this.settingsModal));
    this.modalCloseBtn.addEventListener('click', () => this.closeModal(this.settingsModal));
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeModal(this.settingsModal);
    });

    // Manage Events Button
    this.manageEventsBtn.addEventListener('click', () => {
      this.closeModal(this.settingsModal);
      this._renderEventList();
      this.openModal(this.eventModal);
    });

    // Event Modal
    this.eventModalCloseBtn.addEventListener('click', () => this.closeModal(this.eventModal));
    this.eventModal.addEventListener('click', (e) => {
      if (e.target === this.eventModal) this.closeModal(this.eventModal);
    });

    // Event Form Submit
    this.eventAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = this.eventTitleInput.value;
      const date = this.eventDateInput.value;
      const icon = this.eventIconInput.value;

      if (title && date) {
        eventCountdownManager.addCustomEvent(title, date, icon);
        this.eventTitleInput.value = '';
        this.eventDateInput.value = '';
        this._renderEventList();
      }
    });

    // Preferences Controls
    this.format24Toggle.addEventListener('change', (e) => {
      clockEngine.setFormat(e.target.checked);
      localStorage.setItem('zd_format24', e.target.checked);
    });

    this.showSecondsToggle.addEventListener('change', (e) => {
      const show = e.target.checked;
      clockEngine.setShowSeconds(show);
      document.getElementById('flipSeconds').style.display = show ? '' : 'none';
      document.getElementById('flipSecSep').style.display = show ? '' : 'none';
      this.digitalSeconds.style.display = show ? '' : 'none';
      if (this.nixieRenderer && typeof this.nixieRenderer.setShowSeconds === 'function') {
        this.nixieRenderer.setShowSeconds(show);
      }
      localStorage.setItem('zd_show_seconds', show);
    });

    this.volumeSlider.addEventListener('input', (e) => {
      soundEngine.setVolume(parseFloat(e.target.value));
      localStorage.setItem('zd_volume', e.target.value);
    });

    this.focusDurationSelect.addEventListener('change', (e) => {
      const mins = parseInt(e.target.value, 10);
      pomodoroEngine.setDuration('focus', mins);
      localStorage.setItem('zd_focus_mins', mins);
    });

    // Swiss Horology Settings
    if (this.swissStyleSelect) {
      this.swissStyleSelect.addEventListener('change', (e) => {
        if (this.analogRenderer) {
          this.analogRenderer.setStyle(e.target.value);
        }
      });
    }

    if (this.swissMoveSelect) {
      this.swissMoveSelect.addEventListener('change', (e) => {
        if (this.analogRenderer) {
          this.analogRenderer.setMovement(e.target.value);
        }
      });
    }

    if (this.swissGlassToggle) {
      this.swissGlassToggle.addEventListener('change', (e) => {
        if (this.analogRenderer) {
          this.analogRenderer.setGlass(e.target.checked);
        }
      });
    }

    this.particleSelect.addEventListener('change', (e) => {
      this.particlePreference = e.target.value;
      localStorage.setItem('zd_particle_pref', this.particlePreference);
      this._syncParticles();
    });

    // Wallpaper Selection & Custom Upload Controls
    if (this.wallpaperSelect) {
      this.wallpaperSelect.addEventListener('change', async (e) => {
        const mode = e.target.value;
        if (this.sceneryEngine) {
          await this.sceneryEngine.setWallpaperMode(mode);
        }
        // Auto match particle if a photo preset is chosen
        if (PHOTO_PRESETS[mode] && PHOTO_PRESETS[mode].particle && this.particlePreference === 'auto') {
          if (this.particleEngine) {
            this.particleEngine.setMode(PHOTO_PRESETS[mode].particle);
          }
        }
      });
    }

    if (this.uploadWallpaperBtn && this.customWallpaperInput) {
      this.uploadWallpaperBtn.addEventListener('click', () => {
        this.customWallpaperInput.click();
      });

      this.customWallpaperInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            await wallpaperDB.saveCustomWallpaper(file);
            if (this.customWallpaperOption) {
              this.customWallpaperOption.disabled = false;
              this.customWallpaperOption.textContent = `🖼️ Ảnh cá nhân (${file.name.slice(0, 16)}...)`;
            }
            if (this.wallpaperSelect) {
              this.wallpaperSelect.value = 'custom';
            }
            if (this.clearWallpaperBtn) {
              this.clearWallpaperBtn.style.display = 'block';
            }
            if (this.sceneryEngine) {
              await this.sceneryEngine.setWallpaperMode('custom');
            }
          } catch (err) {
            alert('Không thể lưu ảnh: ' + err.message);
          }
        }
      });
    }

    if (this.clearWallpaperBtn) {
      this.clearWallpaperBtn.addEventListener('click', async () => {
        await wallpaperDB.clearCustomWallpaper();
        if (this.customWallpaperOption) {
          this.customWallpaperOption.disabled = true;
          this.customWallpaperOption.textContent = '🖼️ Ảnh cá nhân của bạn (Chưa tải lên)';
        }
        this.clearWallpaperBtn.style.display = 'none';
        if (this.wallpaperSelect) {
          this.wallpaperSelect.value = 'auto_photo';
        }
        if (this.sceneryEngine) {
          await this.sceneryEngine.setWallpaperMode('auto_photo');
        }
      });
    }

    if (this.randomWallpaperBtn) {
      this.randomWallpaperBtn.addEventListener('click', async () => {
        if (this.sceneryEngine) {
          if (this.wallpaperSelect) this.wallpaperSelect.value = 'random_photo';
          this.sceneryEngine.wallpaperMode = 'random_photo';
          localStorage.setItem('zd_wallpaper_mode', 'random_photo');
          await this.sceneryEngine.fetchRandomWallpaper();
        }
      });
    }

    if (this.wallpaperCaptionBadge) {
      this.wallpaperCaptionBadge.addEventListener('click', async () => {
        if (this.sceneryEngine) {
          if (this.wallpaperSelect) this.wallpaperSelect.value = 'random_photo';
          this.sceneryEngine.wallpaperMode = 'random_photo';
          localStorage.setItem('zd_wallpaper_mode', 'random_photo');
          await this.sceneryEngine.fetchRandomWallpaper();
        }
      });
    }

    // Scenery Dimmer & Soft Blur Sliders
    if (this.bgDimmerSlider) {
      this.bgDimmerSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.sceneryEngine) {
          this.sceneryEngine.setDimmer(val);
        }
        if (this.bgDimmerValue) {
          this.bgDimmerValue.textContent = `${Math.round(val * 100)}%`;
        }
      });
    }

    if (this.bgBlurSlider) {
      this.bgBlurSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.sceneryEngine) {
          this.sceneryEngine.setBlur(val);
        }
        if (this.bgBlurValue) {
          this.bgBlurValue.textContent = `${val}px`;
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        (document.activeElement && (
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT' ||
          document.activeElement.isContentEditable
        ))
      ) return;

      const key = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.activeMode !== 'pomodoro') {
          this.setMode('pomodoro');
        }
        pomodoroEngine.toggle();
      } else if (key === 'f') {
        this.toggleFullscreen();
      } else if (key === 't') {
        this.cycleTheme();
      } else if (key === 'b') {
        const isEnabled = zenThreeScene.toggle();
        this._syncThreeControls();
        this._showToast(`Hiệu ứng 3D: ${isEnabled ? 'Bật' : 'Tắt'}`);
      } else if (key === 'd') {
        this.openModal(this.donateModal);
      } else if (key === 'm') {
        soundMixer.open();
      } else if (key === 'n') {
        nightModeManager.toggle(true);
      } else if (key === 'p') {
        pipController.toggle();
      } else if (key === 'h') {
        this.toggleZenPureMode();
      } else if (key === 's') {
        this.openModal(this.settingsModal);
      } else if (key === 'escape') {
        // If zenModalManager didn't close a topmost modal, exit pure mode
        if (this.zenPureMode) this.toggleZenPureMode();
      }
    });

    // Theme Selector dropdown in Settings Modal
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this._applyTheme(e.target.value);
      });
    }
  }

  setMode(mode) {
    this.activeMode = mode;
    if (mode === 'clock') {
      this.modeClockBtn.classList.add('active');
      this.modePomoBtn.classList.remove('active');
      this.pomodoroView.classList.add('hidden');
      this._updateThemeViewVisibility();
    } else {
      this.modePomoBtn.classList.add('active');
      this.modeClockBtn.classList.remove('active');
      this.flipClockView.classList.add('hidden');
      this.digitalClockView.classList.add('hidden');
      this.analogClockView.classList.add('hidden');
      if (this.nixieClockView) this.nixieClockView.classList.add('hidden');
      this.pomodoroView.classList.remove('hidden');
    }
  }

  cycleTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
    this._applyTheme(this.themes[this.currentThemeIndex]);
  }

  _applyTheme(themeName) {
    this.themes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(themeName);

    this.themeNameLabel.textContent = this.themeLabels[themeName] || 'Theme';
    this.currentThemeIndex = this.themes.indexOf(themeName);
    localStorage.setItem('zd_theme', themeName);

    if (this.themeSelect && this.themeSelect.value !== themeName) {
      this.themeSelect.value = themeName;
    }

    if (this.activeMode === 'clock') {
      this._updateThemeViewVisibility();
    }

    this._syncParticles();
    this._syncScenery();
    if (typeof zenThreeScene !== 'undefined' && zenThreeScene.setTheme) {
      zenThreeScene.setTheme(themeName);
    }
  }

  _updateThemeViewVisibility() {
    const currentTheme = this.themes[this.currentThemeIndex];
    this.flipClockView.classList.add('hidden');
    this.digitalClockView.classList.add('hidden');
    this.analogClockView.classList.add('hidden');
    if (this.nixieClockView) this.nixieClockView.classList.add('hidden');

    if (currentTheme === 'theme-swiss') {
      this.analogClockView.classList.remove('hidden');
    } else if (currentTheme === 'theme-nixie') {
      if (this.nixieClockView) this.nixieClockView.classList.remove('hidden');
    } else if (currentTheme === 'theme-oled' || currentTheme === 'theme-matrix' || currentTheme === 'theme-aura') {
      this.digitalClockView.classList.remove('hidden');
    } else {
      this.flipClockView.classList.remove('hidden');
    }
  }

  _syncScenery() {
    if (!this.sceneryEngine) return;

    const currentTheme = this.themes[this.currentThemeIndex];
    switch (currentTheme) {
      case 'theme-winter':
        this.sceneryEngine.setSeason('winter');
        break;
      case 'theme-spring':
        this.sceneryEngine.setSeason('spring');
        break;
      case 'theme-summer':
        this.sceneryEngine.setSeason('summer');
        break;
      case 'theme-autumn':
        this.sceneryEngine.setSeason('autumn');
        break;
      default:
        this.sceneryEngine.setSeason('none');
        break;
    }
  }

  _syncParticles() {
    if (!this.particleEngine) return;

    if (this.particlePreference !== 'auto') {
      this.particleEngine.setMode(this.particlePreference);
      return;
    }

    const currentTheme = this.themes[this.currentThemeIndex];
    switch (currentTheme) {
      case 'theme-winter':
        this.particleEngine.setMode('snow');
        break;
      case 'theme-spring':
        this.particleEngine.setMode('sakura');
        break;
      case 'theme-autumn':
        this.particleEngine.setMode('maple');
        break;
      case 'theme-summer':
        this.particleEngine.setMode('fireflies');
        break;
      default:
        this.particleEngine.setMode('none');
        break;
    }
  }

  cycleSound() {
    this.currentSoundIndex = (this.currentSoundIndex + 1) % this.ambientSounds.length;
    const sound = this.ambientSounds[this.currentSoundIndex];
    soundEngine.playAmbient(sound);

    const labels = {
      none: 'Tắt âm',
      rain: '🌧️ Mưa rơi',
      fire: '🔥 Lò sưởi',
      ocean: '🌊 Sóng biển',
      crickets: '🦗 Tiếng dế',
      birds: '🐦 Chim hót',
      wind: '💨 Gió rít',
      thunder: '⚡ Sấm sét',
      cafe: '☕ Quán cà phê',
      brown: '🪵 Nhiễu nâu',
      pink: '🍃 Nhiễu hồng',
      white: '📻 Nhiễu trắng'
    };

    if (this.soundLabel) {
      this.soundLabel.textContent = labels[sound] || 'Âm thanh';
    }
    if (this.ambientSoundBtn) {
      this.ambientSoundBtn.classList.toggle('active', sound !== 'none');
    }
    if (typeof soundMixer !== 'undefined') {
      soundMixer.syncActiveChannelsWithEngine();
      soundMixer.updateDockStatus();
    }
  }

  _renderEventList() {
    const events = eventCountdownManager.getEvents();
    this.eventList.innerHTML = '';

    events.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'event-card';

      const dateObj = new Date(evt.targetDate);
      const dateStr = dateObj.toLocaleDateString() + ' ' + String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');

      card.innerHTML = `
        <div class="event-card-left">
          <span class="event-icon">${evt.icon}</span>
          <div>
            <div class="event-title">${evt.title}</div>
            <div class="event-date">${dateStr}</div>
          </div>
        </div>
        ${!evt.isBuiltIn ? `<button class="event-delete-btn" data-id="${evt.id}">Xóa</button>` : `<span style="font-size: 0.72rem; color: var(--accent-color);">Cố định</span>`}
      `;

      if (!evt.isBuiltIn) {
        card.querySelector('.event-delete-btn').addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          eventCountdownManager.deleteCustomEvent(id);
          this._renderEventList();
        });
      }

      this.eventList.appendChild(card);
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  toggleZenPureMode() {
    this.zenPureMode = !this.zenPureMode;
    if (this.zenPureMode) {
      document.body.classList.add('idle');
    } else {
      document.body.classList.remove('idle');
    }
  }

  openModal(modal) {
    if (modal) {
      document.body.classList.remove('idle');
      modal.classList.add('open');
      if (window.zenModalManager) {
        window.zenModalManager.push(modal.id, () => this.closeModal(modal));
      }
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('open');
      if (window.zenModalManager) {
        window.zenModalManager.remove(modal.id);
      }
    }
  }

  _loadSavedPreferences() {
    const urlParams = new URLSearchParams(window.location.search);
    let initialTheme = urlParams.get('theme');
    if (initialTheme && !initialTheme.startsWith('theme-')) {
      initialTheme = `theme-${initialTheme}`;
    }

    const savedTheme = initialTheme || localStorage.getItem('zd_theme');
    if (savedTheme && this.themes.includes(savedTheme)) {
      this._applyTheme(savedTheme);
    } else {
      this._applyTheme('theme-flip');
    }

    if (this.themeSelect && savedTheme) {
      this.themeSelect.value = savedTheme;
    }

    const savedFormat24 = localStorage.getItem('zd_format24');
    if (savedFormat24 !== null) {
      const is24 = savedFormat24 === 'true';
      this.format24Toggle.checked = is24;
      clockEngine.setFormat(is24);
    }

    const savedSeconds = localStorage.getItem('zd_show_seconds');
    if (savedSeconds !== null) {
      const show = savedSeconds === 'true';
      this.showSecondsToggle.checked = show;
      clockEngine.setShowSeconds(show);
      document.getElementById('flipSeconds').style.display = show ? '' : 'none';
      document.getElementById('flipSecSep').style.display = show ? '' : 'none';
      this.digitalSeconds.style.display = show ? '' : 'none';
      if (this.nixieRenderer && typeof this.nixieRenderer.setShowSeconds === 'function') {
        this.nixieRenderer.setShowSeconds(show);
      }
    }

    const savedVol = localStorage.getItem('zd_volume');
    if (savedVol !== null) {
      const vol = parseFloat(savedVol);
      this.volumeSlider.value = vol;
      soundEngine.setVolume(vol);
    }

    const savedFocus = localStorage.getItem('zd_focus_mins');
    if (savedFocus !== null) {
      const mins = parseInt(savedFocus, 10);
      this.focusDurationSelect.value = mins;
      pomodoroEngine.setDuration('focus', mins);
    }

    // Load Swiss Analog Preferences
    if (this.analogRenderer) {
      if (this.swissStyleSelect) this.swissStyleSelect.value = this.analogRenderer.style;
      if (this.swissMoveSelect) this.swissMoveSelect.value = this.analogRenderer.movement;
      if (this.swissGlassToggle) this.swissGlassToggle.checked = this.analogRenderer.showGlass;
    }

    const savedParticle = localStorage.getItem('zd_particle_pref');
    if (savedParticle) {
      this.particlePreference = savedParticle;
      this.particleSelect.value = savedParticle;
      this._syncParticles();
    }

    if (this.sceneryEngine) {
      if (this.bgDimmerSlider) {
        this.bgDimmerSlider.value = this.sceneryEngine.dimmer;
        if (this.bgDimmerValue) {
          this.bgDimmerValue.textContent = `${Math.round(this.sceneryEngine.dimmer * 100)}%`;
        }
      }
      if (this.bgBlurSlider) {
        this.bgBlurSlider.value = this.sceneryEngine.blur;
        if (this.bgBlurValue) {
          this.bgBlurValue.textContent = `${this.sceneryEngine.blur}px`;
        }
      }
      this._syncScenery();
    }

    // Check custom wallpaper in IndexedDB
    wallpaperDB.getCustomWallpaperBlob().then(blob => {
      if (blob) {
        if (this.customWallpaperOption) {
          this.customWallpaperOption.disabled = false;
          this.customWallpaperOption.textContent = '🖼️ Ảnh cá nhân của bạn';
        }
        if (this.clearWallpaperBtn) {
          this.clearWallpaperBtn.style.display = 'block';
        }
      }
      if (this.wallpaperSelect && this.sceneryEngine) {
        this.wallpaperSelect.value = this.sceneryEngine.wallpaperMode;
      }
    }).catch(() => {});
  }

  _initWallpaperModal() {
    this.wallpaperModal = document.getElementById('wallpaperModal');
    this.wallpaperModalCloseBtn = document.getElementById('wallpaperModalCloseBtn');
    this.quickRandomWallpaperBtn = document.getElementById('quickRandomWallpaperBtn');
    this.quickBingWallpaperBtn = document.getElementById('quickBingWallpaperBtn');
    this.wallpaperDropzone = document.getElementById('wallpaperDropzone');
    this.modalWallpaperFileInput = document.getElementById('modalWallpaperFileInput');
    this.customWallpaperPreviewBar = document.getElementById('customWallpaperPreviewBar');
    this.customWallpaperThumb = document.getElementById('customWallpaperThumb');
    this.customThumbName = document.getElementById('customThumbName');
    this.removeCustomWallpaperBtn = document.getElementById('removeCustomWallpaperBtn');
    this.wallpaperPresetsGrid = document.getElementById('wallpaperPresetsGrid');
    this.modalDimmerSlider = document.getElementById('modalDimmerSlider');
    this.modalDimmerValue = document.getElementById('modalDimmerValue');
    this.modalBlurSlider = document.getElementById('modalBlurSlider');
    this.modalBlurValue = document.getElementById('modalBlurValue');

    // 1. Open/Close Modal via Badge or Esc
    if (this.wallpaperCaptionBadge) {
      this.wallpaperCaptionBadge.addEventListener('click', () => {
        this.openModal(this.wallpaperModal);
        this._syncWallpaperModalState();
      });
    }

    if (this.wallpaperModalCloseBtn) {
      this.wallpaperModalCloseBtn.addEventListener('click', () => {
        this.closeModal(this.wallpaperModal);
      });
    }

    // 2. Quick Random 4K Action
    if (this.quickRandomWallpaperBtn) {
      this.quickRandomWallpaperBtn.addEventListener('click', async () => {
        if (this.sceneryEngine) {
          if (this.wallpaperSelect) this.wallpaperSelect.value = 'random_photo';
          this.sceneryEngine.wallpaperMode = 'random_photo';
          localStorage.setItem('zd_wallpaper_mode', 'random_photo');
          await this.sceneryEngine.fetchRandomWallpaper();
          this.closeModal(this.wallpaperModal);
        }
      });
    }

    // 3. Quick Bing Daily 4K Action
    if (this.quickBingWallpaperBtn) {
      this.quickBingWallpaperBtn.addEventListener('click', async () => {
        if (this.sceneryEngine) {
          if (this.wallpaperSelect) this.wallpaperSelect.value = 'bing_daily';
          await this.sceneryEngine.setWallpaperMode('bing_daily');
          this.closeModal(this.wallpaperModal);
        }
      });
    }

    // 4. Custom Drag-and-Drop & File Picker
    if (this.wallpaperDropzone && this.modalWallpaperFileInput) {
      this.wallpaperDropzone.addEventListener('click', () => {
        this.modalWallpaperFileInput.click();
      });

      this.wallpaperDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.wallpaperDropzone.classList.add('dragover');
      });

      this.wallpaperDropzone.addEventListener('dragleave', () => {
        this.wallpaperDropzone.classList.remove('dragover');
      });

      this.wallpaperDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        this.wallpaperDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          await this._handleCustomWallpaperUpload(e.dataTransfer.files[0]);
        }
      });

      this.modalWallpaperFileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          await this._handleCustomWallpaperUpload(e.target.files[0]);
        }
      });
    }

    // 5. Remove Custom Wallpaper
    if (this.removeCustomWallpaperBtn) {
      this.removeCustomWallpaperBtn.addEventListener('click', async () => {
        await wallpaperDB.clearCustomWallpaper();
        if (this.customWallpaperPreviewBar) this.customWallpaperPreviewBar.style.display = 'none';
        if (this.customWallpaperOption) {
          this.customWallpaperOption.disabled = true;
          this.customWallpaperOption.textContent = 'Ảnh cá nhân của bạn (Chưa tải lên)';
        }
        if (this.sceneryEngine) {
          await this.sceneryEngine.setWallpaperMode('bing_daily');
        }
      });
    }

    // 6. Curated Presets Grid
    this._renderWallpaperPresetsGrid();

    // 7. Modal Dimmer & Blur Sliders
    if (this.modalDimmerSlider) {
      this.modalDimmerSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.sceneryEngine) this.sceneryEngine.setDimmer(val);
        if (this.modalDimmerValue) this.modalDimmerValue.textContent = `${Math.round(val * 100)}%`;
        if (this.bgDimmerSlider) this.bgDimmerSlider.value = val;
        if (this.bgDimmerValue) this.bgDimmerValue.textContent = `${Math.round(val * 100)}%`;
      });
    }

    if (this.modalBlurSlider) {
      this.modalBlurSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.sceneryEngine) this.sceneryEngine.setBlur(val);
        if (this.modalBlurValue) this.modalBlurValue.textContent = `${val}px`;
        if (this.bgBlurSlider) this.bgBlurSlider.value = val;
        if (this.bgBlurValue) this.bgBlurValue.textContent = `${val}px`;
      });
    }
  }

  async _handleCustomWallpaperUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    try {
      await wallpaperDB.saveCustomWallpaper(file);
      if (this.sceneryEngine) {
        await this.sceneryEngine.setWallpaperMode('custom');
      }
      await this._syncWallpaperModalState();
      this.closeModal(this.wallpaperModal);
    } catch (err) {
      alert('Không thể lưu ảnh cá nhân: ' + err.message);
    }
  }

  async _syncWallpaperModalState() {
    const hasCustom = await wallpaperDB.hasCustomWallpaper();
    if (hasCustom && this.customWallpaperPreviewBar) {
      const blob = await wallpaperDB.getCustomWallpaperBlob();
      if (blob) {
        if (this.customWallpaperThumb) {
          this.customWallpaperThumb.src = URL.createObjectURL(blob);
        }
        if (this.customThumbName) {
          const meta = await wallpaperDB.getCustomWallpaperMeta();
          this.customThumbName.textContent = meta ? meta.name : 'Ảnh cá nhân';
        }
        this.customWallpaperPreviewBar.style.display = 'flex';
      }
    } else if (this.customWallpaperPreviewBar) {
      this.customWallpaperPreviewBar.style.display = 'none';
    }

    if (this.sceneryEngine) {
      if (this.modalDimmerSlider) {
        this.modalDimmerSlider.value = this.sceneryEngine.dimmer || 0.3;
        if (this.modalDimmerValue) {
          this.modalDimmerValue.textContent = `${Math.round((this.sceneryEngine.dimmer || 0.3) * 100)}%`;
        }
      }
      if (this.modalBlurSlider) {
        this.modalBlurSlider.value = this.sceneryEngine.blur || 0;
        if (this.modalBlurValue) {
          this.modalBlurValue.textContent = `${this.sceneryEngine.blur || 0}px`;
        }
      }
    }
  }

  _renderWallpaperPresetsGrid() {
    if (!this.wallpaperPresetsGrid) return;
    this.wallpaperPresetsGrid.innerHTML = '';

    const presets = [
      { key: 'switzerland', name: 'Thụy Sĩ Tuyết', url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=360&auto=format&fit=crop&q=70' },
      { key: 'kyoto_autumn', name: 'Kyoto Thu', url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=360&auto=format&fit=crop&q=70' },
      { key: 'fuji_snow', name: 'Núi Phú Sĩ', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=360&auto=format&fit=crop&q=70' },
      { key: 'nordic_aurora', name: 'Cực Quang', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=360&auto=format&fit=crop&q=70' },
      { key: 'yosemite', name: 'Yosemite', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=360&auto=format&fit=crop&q=70' },
      { key: 'desert_dunes', name: 'Sa Mạc Vàng', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=360&auto=format&fit=crop&q=70' },
      { key: 'rainy_window', name: 'Mưa Chiều', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=360&auto=format&fit=crop&q=70' },
      { key: 'cyber_tokyo', name: 'Tokyo Đêm', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=360&auto=format&fit=crop&q=70' }
    ];

    presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'wallpaper-preset-card';
      card.innerHTML = `
        <img src="${p.url}" alt="${p.name}" class="preset-card-img" loading="lazy">
        <span class="preset-card-title">${p.name}</span>
      `;
      card.addEventListener('click', async () => {
        if (this.sceneryEngine) {
          if (PHOTO_PRESETS[p.key]) {
            await this.sceneryEngine.setWallpaperMode(p.key);
          } else {
            this.sceneryEngine._applyPhotoLayer(p.url, p.name);
          }
          this.closeModal(this.wallpaperModal);
        }
      });
      this.wallpaperPresetsGrid.appendChild(card);
    });
  }
}

// Launch app once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.zenApp = new ZenApp();
  });
} else {
  window.zenApp = new ZenApp();
}
