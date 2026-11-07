/**
 * ZenDesk Clock - Vintage Nixie Tube (IN-12 / IN-14) Renderer
 * 
 * Masterwork Horological Simulation of Cold Cathode Vacuum Tubes:
 * - 6 Vacuum glass tubes (HH:MM:SS) + 2 INS-1 miniature neon indicator colon tubes
 * - Stacked 0-9 wire cathode filaments with realistic unlit depth
 * - Neon plasma glow with micro-flicker, ignition flash, and gas discharge halos
 * - Anti-Cathode-Poisoning slot machine roulette cycle with authentic staggered settling
 * - Built-in procedural Web Audio cathode discharge & relay click synthesis (zero latency)
 * - Full responsive 12h/24h and show/hide seconds compatibility
 */

export class NixieRenderer {
  /**
   * @param {HTMLElement} container
   * @param {Object} [options]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.isBuilt = false;

    // Load persisted settings or apply defaults
    this.showSeconds = options.showSeconds !== undefined ? options.showSeconds : (localStorage.getItem('zd_nixie_seconds') !== 'false');
    this.is24Hour = options.is24Hour !== undefined ? options.is24Hour : (localStorage.getItem('zd_clock_format') !== '12h');
    this.color = options.color || localStorage.getItem('zd_nixie_color') || 'amber'; // 'amber' | 'crimson' | 'cyan'
    this.glowMode = options.glowMode || localStorage.getItem('zd_nixie_glow') || 'turbo'; // 'dim' | 'normal' | 'turbo'
    this.soundEnabled = options.soundEnabled !== undefined ? options.soundEnabled : (localStorage.getItem('zd_nixie_sound') !== 'false');
    this.autoSpinCycle = options.autoSpinCycle !== undefined ? options.autoSpinCycle : true;

    // Internal state tracking
    this.currentDigits = {
      h1: -1,
      h2: -1,
      m1: -1,
      m2: -1,
      s1: -1,
      s2: -1
    };

    this.isSpinning = false;
    this.spinInterval = null;
    this.lastMinuteForCycle = -1;

    // DOM references cache
    this.tubes = {};
    this.colonDots = [];
    this.chassisWrapper = null;

    // Audio Context (Procedural neon clicks)
    this.audioCtx = null;

    this.build();
  }

  /* ========================================================
     BUILD & DOM GENERATION
     ======================================================== */
  build() {
    this.container.innerHTML = `
      <div class="nixie-clock-container nixie-glow-${this.glowMode} nixie-color-${this.color}" id="nixieMasterWrapper">
        <!-- Rack of 6 Vacuum Tubes + 2 Colon Tubes -->
        <div class="nixie-tubes-rack">
          <!-- Hours Tubes -->
          <div class="nixie-tube" data-tube="h1" title="Giờ (chục)"></div>
          <div class="nixie-tube" data-tube="h2" title="Giờ (đơn vị)"></div>

          <!-- Colon 1 (INS-1 Neon Indicator Tube) -->
          <div class="nixie-tube nixie-colon-tube" data-tube="c1" title="Dấu hai chấm neon">
            <div class="nixie-glass-envelope">
              <div class="nixie-glass-glare"></div>
              <div class="nixie-glass-dome-sheen"></div>
              <div class="nixie-anode-mesh"></div>
              <div class="nixie-plasma-glow"></div>
              <div class="nixie-colon-dots">
                <div class="nixie-dot" data-dot="c1-top"></div>
                <div class="nixie-dot" data-dot="c1-bot"></div>
              </div>
            </div>
            <div class="nixie-socket-base"></div>
          </div>

          <!-- Minutes Tubes -->
          <div class="nixie-tube" data-tube="m1" title="Phút (chục)"></div>
          <div class="nixie-tube" data-tube="m2" title="Phút (đơn vị)"></div>

          <!-- Colon 2 (Seconds Separator) -->
          <div class="nixie-tube nixie-colon-tube nixie-seconds-tube ${this.showSeconds ? '' : 'hidden'}" data-tube="c2" title="Dấu giây neon">
            <div class="nixie-glass-envelope">
              <div class="nixie-glass-glare"></div>
              <div class="nixie-glass-dome-sheen"></div>
              <div class="nixie-anode-mesh"></div>
              <div class="nixie-plasma-glow"></div>
              <div class="nixie-colon-dots">
                <div class="nixie-dot" data-dot="c2-top"></div>
                <div class="nixie-dot" data-dot="c2-bot"></div>
              </div>
            </div>
            <div class="nixie-socket-base"></div>
          </div>

          <!-- Seconds Tubes -->
          <div class="nixie-tube nixie-seconds-tube ${this.showSeconds ? '' : 'hidden'}" data-tube="s1" title="Giây (chục)"></div>
          <div class="nixie-tube nixie-seconds-tube ${this.showSeconds ? '' : 'hidden'}" data-tube="s2" title="Giây (đơn vị)"></div>
        </div>

        <!-- Solid Hardwood & Machined Brass Chassis Plinth -->
        <div class="nixie-chassis-deck">
          <div class="nixie-chassis-reflection"></div>
          <div class="nixie-plinth">
            <div class="nixie-brass-badge">IN-14 COLD CATHODE GLOW DISCHARGE</div>
            <div class="nixie-brass-badge">VINTAGE CHRONOMETER • 170V DC</div>
          </div>
        </div>

        <!-- Interactive Quick Control Pill -->
        <div class="nixie-control-pill" id="nixieControlPill">
          <button class="nixie-pill-btn" id="nixieRouletteBtn" title="Chạy chu trình chống ngộ độc cathode">
            <span>🎰</span> Roulette Spin
          </button>
          <div class="nixie-pill-divider"></div>
          <button class="nixie-pill-btn ${this.showSeconds ? 'active' : ''}" id="nixieToggleSecBtn" title="Bật/Tắt bóng giây">
            <span>⏱️</span> Giây
          </button>
          <div class="nixie-pill-divider"></div>
          <button class="nixie-pill-btn" id="nixieColorBtn" title="Đổi màu ánh sáng Neon">
            <span>💡</span> <span id="nixieColorLabel">${this._getColorLabel(this.color)}</span>
          </button>
          <div class="nixie-pill-divider"></div>
          <button class="nixie-pill-btn" id="nixieGlowBtn" title="Điều chỉnh cường độ phát sáng">
            <span>⚡</span> <span id="nixieGlowLabel">${this._getGlowLabel(this.glowMode)}</span>
          </button>
        </div>
      </div>
    `;

    this.chassisWrapper = this.container.querySelector('#nixieMasterWrapper');

    // Build internal elements for each numeric tube (H1, H2, M1, M2, S1, S2)
    const numericKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
    numericKeys.forEach(key => {
      const tubeEl = this.container.querySelector(`.nixie-tube[data-tube="${key}"]`);
      if (tubeEl) {
        this._buildTubeInner(tubeEl, key);
      }
    });

    // Cache colon dots
    this.colonDots = Array.from(this.container.querySelectorAll('.nixie-dot'));

    // Bind event listeners
    this._bindEvents();

    this.isBuilt = true;
  }

  /**
   * Builds the internal structure for a single IN-14 vacuum tube
   * Generates 10 stacked physical wire cathodes (0-9) inside the glass envelope
   */
  _buildTubeInner(tubeEl, key) {
    tubeEl.innerHTML = `
      <div class="nixie-glass-envelope">
        <div class="nixie-glass-glare"></div>
        <div class="nixie-glass-dome-sheen"></div>
        <div class="nixie-anode-mesh"></div>
        <div class="nixie-plasma-glow"></div>
        <div class="nixie-digits-stack">
          ${Array.from({ length: 10 }, (_, i) => `<span class="nixie-digit unlit" data-digit="${i}">${i}</span>`).join('')}
        </div>
      </div>
      <div class="nixie-socket-base"></div>
    `;

    // Cache digit DOM elements for fast access
    const digitsMap = {};
    tubeEl.querySelectorAll('.nixie-digit').forEach(el => {
      digitsMap[el.getAttribute('data-digit')] = el;
    });

    this.tubes[key] = {
      el: tubeEl,
      digits: digitsMap,
      currentDigit: -1
    };

    // Clicking any tube triggers an instant tactile ignition & roulette spin
    tubeEl.addEventListener('click', () => {
      this.triggerDePoisoning(1400);
    });
  }

  /* ========================================================
     INTERACTIVE EVENTS & CONTROLS
     ======================================================== */
  _bindEvents() {
    const rouletteBtn = this.container.querySelector('#nixieRouletteBtn');
    if (rouletteBtn) {
      rouletteBtn.addEventListener('click', () => this.triggerDePoisoning(1800));
    }

    const toggleSecBtn = this.container.querySelector('#nixieToggleSecBtn');
    if (toggleSecBtn) {
      toggleSecBtn.addEventListener('click', () => {
        this.setShowSeconds(!this.showSeconds);
        toggleSecBtn.classList.toggle('active', this.showSeconds);
      });
    }

    const colorBtn = this.container.querySelector('#nixieColorBtn');
    if (colorBtn) {
      colorBtn.addEventListener('click', () => {
        const colors = ['amber', 'crimson', 'cyan'];
        const nextIndex = (colors.indexOf(this.color) + 1) % colors.length;
        this.setColor(colors[nextIndex]);
      });
    }

    const glowBtn = this.container.querySelector('#nixieGlowBtn');
    if (glowBtn) {
      glowBtn.addEventListener('click', () => {
        const glowModes = ['normal', 'turbo', 'dim'];
        const nextIndex = (glowModes.indexOf(this.glowMode) + 1) % glowModes.length;
        this.setGlow(glowModes[nextIndex]);
      });
    }
  }

  /* ========================================================
     CLOCK UPDATE TICK (Called on each frame/second)
     ======================================================== */
  /**
   * @param {Object} timeData (from clockEngine)
   * @param {boolean} isNewSecond
   */
  update(timeData, isNewSecond) {
    if (!this.isBuilt || this.isSpinning) return;

    const hours = timeData.hoursStr;
    const minutes = timeData.minutesStr;
    const seconds = timeData.secondsStr;

    const h1 = parseInt(hours[0], 10);
    const h2 = parseInt(hours[1], 10);
    const m1 = parseInt(minutes[0], 10);
    const m2 = parseInt(minutes[1], 10);
    const s1 = parseInt(seconds[0], 10);
    const s2 = parseInt(seconds[1], 10);

    // Update individual tube digits with ignition flash when changing
    this._setTubeDigit('h1', h1);
    this._setTubeDigit('h2', h2);
    this._setTubeDigit('m1', m1);
    this._setTubeDigit('m2', m2);

    if (this.showSeconds) {
      this._setTubeDigit('s1', s1);
      this._setTubeDigit('s2', s2);
    }

    // Pulse neon colon dots on every second
    if (isNewSecond) {
      this.colonDots.forEach(dot => {
        dot.classList.remove('dot-dim');
      });

      // Play soft cathode micro-click on second tick (if enabled)
      if (this.soundEnabled && this.showSeconds) {
        this._playCathodeTick(0.015, 800, 0.05);
      }

      // Dim colon at half-second point
      setTimeout(() => {
        if (!this.isSpinning) {
          this.colonDots.forEach(dot => dot.classList.add('dot-dim'));
        }
      }, 500);

      // Automatic Anti-Cathode-Poisoning slot cycle every 10 minutes (at minute :00, :10, :20...)
      if (this.autoSpinCycle && timeData.minutesRaw !== this.lastMinuteForCycle) {
        this.lastMinuteForCycle = timeData.minutesRaw;
        if (timeData.minutesRaw % 10 === 0 && timeData.secondsRaw === 0) {
          this.triggerDePoisoning(2000);
        }
      }
    }
  }

  /**
   * Activates the specific cathode digit inside a tube
   */
  _setTubeDigit(tubeKey, targetDigit, forceIgnition = false) {
    const tubeData = this.tubes[tubeKey];
    if (!tubeData) return;

    if (tubeData.currentDigit === targetDigit && !forceIgnition) return;

    const oldDigit = tubeData.currentDigit;
    tubeData.currentDigit = targetDigit;

    // Turn off old digit
    if (oldDigit >= 0 && tubeData.digits[oldDigit]) {
      const oldEl = tubeData.digits[oldDigit];
      oldEl.classList.remove('active', 'ignite');
      oldEl.classList.add('unlit');
    }

    // Turn on target digit
    if (targetDigit >= 0 && tubeData.digits[targetDigit]) {
      const newEl = tubeData.digits[targetDigit];
      newEl.classList.remove('unlit');
      newEl.classList.add('active');

      // Add ignition strike-in flash
      newEl.classList.remove('ignite');
      void newEl.offsetWidth; // DOM reflow
      newEl.classList.add('ignite');
    }
  }

  /* ========================================================
     ANTI-CATHODE-POISONING ROULETTE / SLOT MACHINE CYCLE
     ======================================================== */
  /**
   * Cycles all tubes in high-speed roulette spin to prevent cathode poisoning
   * Recreates the iconic retro slot machine effect with staggered stops.
   * @param {number} duration Total duration in ms (default 1800ms)
   */
  triggerDePoisoning(duration = 1800) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    this._initAudio();

    const tubeKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
    tubeKeys.forEach(key => {
      if (this.tubes[key]) {
        this.tubes[key].el.classList.add('spinning');
      }
    });

    // High frequency spinning loop (30fps random digit changes)
    let tickCount = 0;
    this.spinInterval = setInterval(() => {
      tubeKeys.forEach(key => {
        if (this.tubes[key]) {
          const randomDigit = Math.floor(Math.random() * 10);
          this._setTubeDigit(key, randomDigit, false);
        }
      });

      // Play soft roulette spin tick
      if (this.soundEnabled && tickCount % 2 === 0) {
        this._playCathodeTick(0.02, 1200 + Math.random() * 400, 0.08);
      }
      tickCount++;
    }, 45);

    // Staggered settling sequence for each tube (left to right)
    const staggerDelay = duration / 6;

    tubeKeys.forEach((key, index) => {
      setTimeout(() => {
        if (this.tubes[key]) {
          this.tubes[key].el.classList.remove('spinning');
          // Play settle relay thud
          if (this.soundEnabled) {
            this._playRelayLatch();
          }
        }
      }, duration - (6 - index) * (staggerDelay * 0.7));
    });

    // Final completion & restore real time
    setTimeout(() => {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
      this.isSpinning = false;

      // Force immediate refresh to actual current clock time
      const now = new Date();
      let hours = now.getHours();
      if (!this.is24Hour) {
        hours = hours % 12 || 12;
      }
      const pad = n => String(n).padStart(2, '0');
      const hStr = pad(hours);
      const mStr = pad(now.getMinutes());
      const sStr = pad(now.getSeconds());

      this._setTubeDigit('h1', parseInt(hStr[0], 10), true);
      this._setTubeDigit('h2', parseInt(hStr[1], 10), true);
      this._setTubeDigit('m1', parseInt(mStr[0], 10), true);
      this._setTubeDigit('m2', parseInt(mStr[1], 10), true);
      if (this.showSeconds) {
        this._setTubeDigit('s1', parseInt(sStr[0], 10), true);
        this._setTubeDigit('s2', parseInt(sStr[1], 10), true);
      }
    }, duration);
  }

  /* ========================================================
     THEME & APPEARANCE CONFIGURATION
     ======================================================== */
  setShowSeconds(show) {
    this.showSeconds = Boolean(show);
    localStorage.setItem('zd_nixie_seconds', this.showSeconds);

    const secondsElements = this.container.querySelectorAll('.nixie-seconds-tube');
    secondsElements.forEach(el => {
      if (this.showSeconds) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    const toggleSecBtn = this.container.querySelector('#nixieToggleSecBtn');
    if (toggleSecBtn) {
      toggleSecBtn.classList.toggle('active', this.showSeconds);
    }
  }

  setFormat(is24Hour) {
    this.is24Hour = Boolean(is24Hour);
  }

  setColor(colorName) {
    const validColors = ['amber', 'crimson', 'cyan'];
    if (!validColors.includes(colorName)) colorName = 'amber';

    this.color = colorName;
    localStorage.setItem('zd_nixie_color', colorName);

    if (this.chassisWrapper) {
      this.chassisWrapper.classList.remove('nixie-color-amber', 'nixie-color-crimson', 'nixie-color-cyan');
      this.chassisWrapper.classList.add(`nixie-color-${colorName}`);
    }

    const label = this.container.querySelector('#nixieColorLabel');
    if (label) {
      label.textContent = this._getColorLabel(colorName);
    }
  }

  setGlow(glowMode) {
    const validModes = ['dim', 'normal', 'turbo'];
    if (!validModes.includes(glowMode)) glowMode = 'turbo';

    this.glowMode = glowMode;
    localStorage.setItem('zd_nixie_glow', glowMode);

    if (this.chassisWrapper) {
      this.chassisWrapper.classList.remove('nixie-glow-dim', 'nixie-glow-normal', 'nixie-glow-turbo');
      this.chassisWrapper.classList.add(`nixie-glow-${glowMode}`);
    }

    const label = this.container.querySelector('#nixieGlowLabel');
    if (label) {
      label.textContent = this._getGlowLabel(glowMode);
    }
  }

  _getColorLabel(color) {
    switch (color) {
      case 'crimson': return 'Đỏ Soviet';
      case 'cyan': return 'Hồ Quang Lam';
      case 'amber':
      default: return 'Cam Hổ Phách';
    }
  }

  _getGlowLabel(glow) {
    switch (glow) {
      case 'dim': return 'Dịu Mắt';
      case 'normal': return 'Tiêu Chuẩn';
      case 'turbo':
      default: return 'Rực Rỡ';
    }
  }

  /* ========================================================
     PROCEDURAL WEB AUDIO SYNTHESIS (NEON CLICKS & RELAYS)
     ======================================================== */
  _initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Procedural cathode gas ignition click
   */
  _playCathodeTick(duration = 0.015, freq = 950, volume = 0.06) {
    if (!this.soundEnabled) return;
    this._initAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + duration);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // Audio autoplay policy or silent fallback
    }
  }

  /**
   * Procedural heavy relay latch sound on tube settling
   */
  _playRelayLatch() {
    if (!this.soundEnabled) return;
    this._initAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {
      // Fallback
    }
  }

  /* ========================================================
     TEARDOWN / CLEANUP
     ======================================================== */
  destroy() {
    if (this.spinInterval) {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    this.container.innerHTML = '';
    this.isBuilt = false;
  }
}
