/**
 * ZenDesk Clock - Apple StandBy Red Night Mode Controller
 * 
 * Recreates the Apple Watch Ultra & iOS StandBy Night Display:
 * - Ultra-low photopic luminance, zero blue-light emission
 * - Monochromatic Night Red (#ff2a2a) and Warm Amber (#ff7700)
 * - Global keyboard shortcut: 'N'
 * - Automated Circadian Schedule (22:00 - 06:00) with real-time clock monitoring
 * - Seamless integration across all 5 clock engines: Nixie, Swiss, Flip, OLED, Pomodoro
 * - Persistent configuration in localStorage
 * - Zero external dependencies, pure vanilla ES6+
 */

export class NightModeManager {
  constructor(options = {}) {
    // Load persisted settings or apply defaults
    // Explicit user preference takes absolute priority
    const savedActive = localStorage.getItem('zd_night_mode_active');
    this.enabled = savedActive === 'true';
    this.color = localStorage.getItem('zd_night_mode_color') || 'red'; // 'red' | 'amber'
    this.autoSchedule = localStorage.getItem('zd_night_mode_auto') === 'true'; // default false to prevent unexpected hijacking
    this.startHour = parseInt(localStorage.getItem('zd_night_mode_start') || '22', 10); // 22:00 (10 PM)
    this.endHour = parseInt(localStorage.getItem('zd_night_mode_end') || '6', 10);     // 06:00 (6 AM)
    this.soundFeedback = options.soundFeedback !== undefined ? options.soundFeedback : true;

    // Toast element reference
    this.toastEl = null;
    this.toastTimer = null;
    this.scheduleTimer = null;
    this.audioCtx = null;

    // Listeners for state change
    this.listeners = [];

    this.init();
  }

  /* ========================================================
     INITIALIZATION
     ======================================================== */
  init() {
    this._injectToast();
    this._bindKeyboard();
    this._startScheduleMonitor();

    // Always strictly respect saved user preference
    const savedActive = localStorage.getItem('zd_night_mode_active');
    if (savedActive !== null) {
      this.enabled = savedActive === 'true';
      this._applyDOMState(this.enabled, false);
      return;
    }

    // Only if user has never manually toggled night mode AND autoSchedule is explicitly true
    if (this.autoSchedule) {
      this._checkSchedule();
    } else {
      this.enabled = false;
      this._applyDOMState(false, false);
    }
  }

  /* ========================================================
     DOM STATE & STYLING APPLICATION
     ======================================================== */
  _applyDOMState(isActive, showToast = true) {
    const body = document.body;
    if (!body) return;

    if (isActive) {
      body.classList.add('apple-standby-active');
      if (this.color === 'amber') {
        body.classList.add('standby-color-amber');
      } else {
        body.classList.remove('standby-color-amber');
      }

      if (showToast) {
        const colorName = this.color === 'amber' ? 'Hổ Phách' : 'Đỏ Monochromatic';
        this.showToast(`StandBy: ${colorName}`, 'N');
      }
    } else {
      body.classList.remove('apple-standby-active', 'standby-color-amber');

      if (showToast) {
        this.showToast('StandBy: Đã Tắt', 'N');
      }
    }

    // Play feedback tone
    if (showToast && this.soundFeedback) {
      this._playToggleTone(isActive);
    }

    // Notify registered event listeners
    this._notifyListeners();
  }

  /* ========================================================
     PUBLIC API
     ======================================================== */
  toggle(triggerToast = true) {
    this.enabled = !this.enabled;
    localStorage.setItem('zd_night_mode_active', this.enabled ? 'true' : 'false');
    localStorage.setItem('zd_night_mode_manual_override', 'true');
    this._applyDOMState(this.enabled, triggerToast);
    return this.enabled;
  }

  enable(triggerToast = true) {
    this.enabled = true;
    localStorage.setItem('zd_night_mode_active', 'true');
    localStorage.setItem('zd_night_mode_manual_override', 'true');
    this._applyDOMState(true, triggerToast);
  }

  disable(triggerToast = true) {
    this.enabled = false;
    localStorage.setItem('zd_night_mode_active', 'false');
    localStorage.setItem('zd_night_mode_manual_override', 'true');
    this._applyDOMState(false, triggerToast);
  }

  isEnabled() {
    return this.enabled;
  }

  setColor(colorName) {
    if (colorName !== 'red' && colorName !== 'amber') colorName = 'red';
    this.color = colorName;
    localStorage.setItem('zd_night_mode_color', colorName);

    if (this.enabled) {
      this._applyDOMState(true, false);
      const colorLabel = colorName === 'amber' ? 'Cam Hổ Phách' : 'Đỏ Monochromatic';
      this.showToast(`🎨 StandBy Đổi Màu: ${colorLabel}`);
    }
  }

  getColor() {
    return this.color;
  }

  setAutoSchedule(enabled, startHour = 22, endHour = 6) {
    this.autoSchedule = Boolean(enabled);
    this.startHour = startHour;
    this.endHour = endHour;

    localStorage.setItem('zd_night_mode_auto', this.autoSchedule);
    localStorage.setItem('zd_night_mode_start', this.startHour);
    localStorage.setItem('zd_night_mode_end', this.endHour);

    if (this.autoSchedule) {
      this._checkSchedule();
    }
  }

  /**
   * Register state change callback
   * @param {Function} callback (enabled, color, state)
   */
  onStateChange(callback) {
    this.onChange(callback);
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      // Immediately notify caller of current active state
      try {
        callback(this.enabled, this.color, { enabled: this.enabled, color: this.color });
      } catch (e) {
        console.error(e);
      }
    }
  }

  _notifyListeners() {
    const state = { enabled: this.enabled, color: this.color };
    this.listeners.forEach(fn => {
      try {
        fn(this.enabled, this.color, state);
      } catch (e) {
        console.error(e);
      }
    });

    // Also dispatch a window CustomEvent for cross-module communication
    window.dispatchEvent(new CustomEvent('standby-night-mode-change', { detail: state }));
  }

  /* ========================================================
     AUTOMATIC TIME SCHEDULE (Circadian Rhythm 22:00 - 06:00)
     ======================================================== */
  _startScheduleMonitor() {
    // Check every 30 seconds
    this.scheduleTimer = setInterval(() => {
      if (this.autoSchedule) {
        this._checkSchedule();
      }
    }, 30000);
  }

  _checkSchedule() {
    // If user has ever manually set or toggled night mode, NEVER override their choice!
    if (localStorage.getItem('zd_night_mode_manual_override') === 'true' || localStorage.getItem('zd_night_mode_active') !== null) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();

    let isNightTime = false;
    if (this.startHour > this.endHour) {
      isNightTime = (currentHour >= this.startHour || currentHour < this.endHour);
    } else {
      isNightTime = (currentHour >= this.startHour && currentHour < this.endHour);
    }

    if (isNightTime && !this.enabled) {
      this.enable(false);
    } else if (!isNightTime && this.enabled) {
      this.disable(false);
    }
  }

  /* ========================================================
     KEYBOARD SHORTCUT & UI HELPERS
     ======================================================== */
  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Check key 'N' or 'n'
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          this.toggle(true);
        }
      }
    });
  }

  _injectToast() {
    let existingToast = document.getElementById('standbyToast');
    if (!existingToast) {
      existingToast = document.createElement('div');
      existingToast.id = 'standbyToast';
      existingToast.className = 'standby-toast';
      existingToast.setAttribute('aria-live', 'polite');
      document.body.appendChild(existingToast);
    }
    this.toastEl = existingToast;
  }

  showToast(message, kbdKey = null) {
    if (!this.toastEl) return;

    if (kbdKey) {
      this.toastEl.innerHTML = `<span>${message}</span> <span class="standby-toast-kbd">${kbdKey}</span>`;
    } else {
      this.toastEl.innerHTML = `<span>${message}</span>`;
    }

    this.toastEl.classList.add('show');

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      if (this.toastEl) {
        this.toastEl.classList.remove('show');
      }
    }, 2400);
  }

  /**
   * Creates and mounts an Apple StandBy quick toggle button into any parent container
   * @param {HTMLElement} targetParent
   * @returns {HTMLElement} The created button
   */
  mountQuickToggle(targetParent) {
    if (!targetParent) return null;

    const btn = document.createElement('button');
    btn.className = 'standby-toggle-btn';
    btn.id = 'standbyQuickToggleBtn';
    btn.title = 'Bật/Tắt Apple StandBy Red Night Mode (Phím N)';
    btn.innerHTML = `
      <svg class="standby-moon-icon" viewBox="0 0 24 24">
        <path d="M12.3 2a10 10 0 0 0-.19 2 10 10 0 0 0 10 10c.68 0 1.35-.07 2-.19A10 10 0 1 1 12.3 2z"/>
      </svg>
      <span>Night Mode</span>
    `;

    btn.addEventListener('click', () => {
      this.toggle(true);
      btn.classList.toggle('active', this.enabled);
    });

    targetParent.appendChild(btn);
    return btn;
  }

  /* ========================================================
     WEB AUDIO PROCEDURAL TOGGLE TONE
     ======================================================== */
  _initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  _playToggleTone(isEnabling) {
    this._initAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      if (isEnabling) {
        // Deep nocturnal tone dropping gently
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
      } else {
        // Soft dawn tone rising
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);
      }

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {
      // Silently catch audio policy blocks
    }
  }

  destroy() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    if (this.toastEl && this.toastEl.parentNode) {
      this.toastEl.parentNode.removeChild(this.toastEl);
    }
  }
}

// Export singleton instance for immediate plug-and-play convenience
export const nightModeManager = new NightModeManager();
