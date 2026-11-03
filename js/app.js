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

class ZenApp {
  constructor() {
    this.currentThemeIndex = 0;
    this.themes = [
      'theme-flip',
      'theme-oled',
      'theme-matrix',
      'theme-aura',
      'theme-swiss',
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
      'theme-winter': '❄️ Mùa Đông',
      'theme-spring': '🌸 Mùa Xuân',
      'theme-summer': '🌊 Mùa Hạ',
      'theme-autumn': '🍁 Mùa Thu'
    };

    this.activeMode = 'clock'; // 'clock' | 'pomodoro'
    this.ambientSounds = ['none', 'rain', 'fire', 'ocean', 'crickets', 'birds', 'brown', 'pink', 'white'];
    this.currentSoundIndex = 0; // starts at none
    this.particlePreference = 'auto'; // 'auto', 'snow', 'sakura', 'maple', 'fireflies', 'none'
    this.idleTimer = null;
    this.zenPureMode = false;

    this.flipUnits = {};
    this.analogRenderer = null;
    this.particleEngine = null;
    this.sceneryEngine = null;

    this.init();
  }

  init() {
    this._cacheDOM();
    this._initScenery();
    this._initParticles();
    this._initFlipClock();
    this._initAnalogClock();
    this._initPomodoro();
    this._initTimeEngine();
    this._initPiP();
    this._initWakeLock();
    this._initIdleDetection();
    this._initEventCountdown();
    this._initEventListeners();
    this._initQuotes();
    this._loadSavedPreferences();
  }

  _cacheDOM() {
    // Views
    this.flipClockView = document.getElementById('flipClockView');
    this.digitalClockView = document.getElementById('digitalClockView');
    this.analogClockView = document.getElementById('analogClockView');
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
    this.settingsBtn = document.getElementById('settingsBtn');

    // Settings Modal elements
    this.settingsModal = document.getElementById('settingsModal');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
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
        this.dayProgressBar.style.width = `${timeData.dayProgressPercent}%`;
        this.dayProgressPercent.textContent = `${timeData.dayProgressPercent}%`;
        this.yearProgressBar.style.width = `${timeData.yearProgressPercent}%`;
        this.yearProgressPercent.textContent = `${timeData.yearProgressPercent}%`;

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
      if (currentTheme === 'theme-flip' || currentTheme.startsWith('theme-winter') || currentTheme.startsWith('theme-spring') || currentTheme.startsWith('theme-summer') || currentTheme.startsWith('theme-autumn')) {
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
      if (active) {
        this.wakeLockDot.classList.remove('inactive');
        this.wakeLockText.textContent = 'Màn hình luôn sáng';
      } else {
        this.wakeLockDot.classList.add('inactive');
        this.wakeLockText.textContent = 'Chế độ nghỉ tự nhiên';
      }
    });

    const enableWake = async () => {
      await wakeLockManager.requestLock();
      window.removeEventListener('click', enableWake);
    };
    window.addEventListener('click', enableWake, { once: true });
  }

  _initIdleDetection() {
    const resetIdle = () => {
      if (this.zenPureMode) return;
      document.body.classList.remove('idle');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
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

    // Theme Switcher Button
    this.themeSwitchBtn.addEventListener('click', () => this.cycleTheme());

    // Ambient Sound Button
    this.ambientSoundBtn.addEventListener('click', () => this.cycleSound());

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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

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
      } else if (key === 'm') {
        this.cycleSound();
      } else if (key === 'p') {
        pipController.toggle();
      } else if (key === 'h') {
        this.toggleZenPureMode();
      } else if (key === 's') {
        this.openModal(this.settingsModal);
      } else if (key === 'escape') {
        this.closeModal(this.settingsModal);
        this.closeModal(this.eventModal);
        if (this.zenPureMode) this.toggleZenPureMode();
      }
    });
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

    if (this.activeMode === 'clock') {
      this._updateThemeViewVisibility();
    }

    this._syncParticles();
    this._syncScenery();
  }

  _updateThemeViewVisibility() {
    const currentTheme = this.themes[this.currentThemeIndex];
    this.flipClockView.classList.add('hidden');
    this.digitalClockView.classList.add('hidden');
    this.analogClockView.classList.add('hidden');

    if (currentTheme === 'theme-swiss') {
      this.analogClockView.classList.remove('hidden');
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
      brown: '🪵 Nhiễu nâu',
      pink: '🍃 Nhiễu hồng',
      white: '💨 Nhiễu trắng'
    };

    this.soundLabel.textContent = labels[sound] || 'Âm thanh';
    this.ambientSoundBtn.classList.toggle('active', sound !== 'none');
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
    if (modal) modal.classList.add('open');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('open');
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
}

// Launch app once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.zenApp = new ZenApp();
  });
} else {
  window.zenApp = new ZenApp();
}
