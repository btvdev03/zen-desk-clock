/**
 * ZenDesk Clock - Iconic Swiss Railway Clock (SBB CFF FFS) & Bauhaus Luxury Analog Renderer
 * Inspired by Hans Hilfiker's 1944 masterpiece for the Swiss Federal Railways.
 *
 * Features:
 * - 100% Vector SVG Precision Geometry with exact Hilfiker proportions.
 * - Authentic "stop2go" movement: 58.5s sweep + 1.5s freeze at 12 o'clock + mechanical minute jump.
 * - Clean rectangular baton hour & minute hands anchored at pivot (no unwanted rear stubs).
 * - Iconic red lollipop second hand with counterweight tail and central rivet.
 * - 3 Distinct Horology Styles: SBB Classic White, SBB Night Obsidian, and Bauhaus Max Bill Minimal.
 * - Multi-layer 3D brushed metallic bezel, inner rehault depth, and curved crystal glass reflection.
 * - Consistent screen-space drop shadows and quick interactive horology control pill.
 */

export class AnalogRenderer {
  constructor(container) {
    this.container = container;
    this.isBuilt = false;

    // Load saved preferences with authentic defaults or URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryStyle = urlParams.get('style');
    let initStyle = localStorage.getItem('zd_swiss_style') || 'sbb_classic';
    if (queryStyle === 'dark' || queryStyle === 'sbb_dark') initStyle = 'sbb_dark';
    else if (queryStyle === 'bauhaus') initStyle = 'bauhaus';
    else if (queryStyle === 'classic' || queryStyle === 'sbb_classic') initStyle = 'sbb_classic';

    this.style = initStyle;
    this.movement = urlParams.get('move') || localStorage.getItem('zd_swiss_movement') || 'stop2go'; // 'stop2go' | 'smooth' | 'step'
    this.showGlass = localStorage.getItem('zd_swiss_glass') !== 'false'; // true | false

    // Cached SVG DOM elements
    this.svgEl = null;
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.glassEl = null;
    this.ticksGroup = null;
    this.brandText = null;
    this.subBrandText = null;
    this.quickStyleName = null;
    this.quickMovementName = null;

    // Minute tracking for mechanical snap in stop2go mode
    this.lastMinute = -1;
    this.isSnappingMinute = false;
    this.minuteSnapTimer = null;

    this.build();
  }

  build() {
    this.container.innerHTML = `
      <div class="analog-clock-wrapper style-${this.style}" id="analogClockWrapper">
        <svg class="analog-svg" viewBox="0 0 400 400" width="100%" height="100%" aria-label="Mặt đồng hồ kim Thụy Sĩ">
          <defs>
            <!-- SBB Classic Enamel White Dial Gradient -->
            <radialGradient id="dialGradientClassic" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="85%" stop-color="#f8f9fa" />
              <stop offset="100%" stop-color="#eaedf0" />
            </radialGradient>

            <!-- SBB Dark Obsidian Night Dial Gradient -->
            <radialGradient id="dialGradientDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#191c22" />
              <stop offset="80%" stop-color="#101115" />
              <stop offset="100%" stop-color="#08090b" />
            </radialGradient>

            <!-- Bauhaus Vintage Ivory Dial Gradient -->
            <radialGradient id="dialGradientBauhaus" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fffefb" />
              <stop offset="85%" stop-color="#f8f4ec" />
              <stop offset="100%" stop-color="#ede7db" />
            </radialGradient>

            <!-- Brushed Titanium & Steel Bezel Gradient -->
            <linearGradient id="bezelGradientSteel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4a4f5b" />
              <stop offset="20%" stop-color="#24272f" />
              <stop offset="45%" stop-color="#5a606d" />
              <stop offset="70%" stop-color="#1f2228" />
              <stop offset="100%" stop-color="#3b3f49" />
            </linearGradient>

            <!-- Dark Obsidian Bezel Gradient -->
            <linearGradient id="bezelGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#282a30" />
              <stop offset="30%" stop-color="#141518" />
              <stop offset="60%" stop-color="#363942" />
              <stop offset="100%" stop-color="#18191d" />
            </linearGradient>

            <!-- Soft Curved Crystal Glass Reflection Gradient -->
            <linearGradient id="glassReflectionGradient" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stop-color="rgba(255, 255, 255, 0.35)" />
              <stop offset="40%" stop-color="rgba(255, 255, 255, 0.08)" />
              <stop offset="70%" stop-color="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          <!-- Outer 3D Watch Casing -->
          <circle cx="200" cy="200" r="195" class="swiss-case-bezel" fill="url(#bezelGradientSteel)" stroke="#111317" stroke-width="2" />
          <circle cx="200" cy="200" r="185" class="swiss-case-rehault" fill="none" stroke="rgba(0, 0, 0, 0.2)" stroke-width="4.5" />

          <!-- Dial Enamel Face -->
          <circle cx="200" cy="200" r="183" class="swiss-dial-base" id="swissDialBase" fill="url(#dialGradientClassic)" />

          <!-- Hour & Minute Ticks Container -->
          <g class="swiss-ticks" id="swissTicksGroup"></g>

          <!-- Micro-Typography at 6 O'clock -->
          <text x="200" y="278" text-anchor="middle" class="swiss-brand" id="swissBrandText">SWISS DESIGN</text>
          <text x="200" y="290" text-anchor="middle" class="swiss-sub-brand" id="swissSubBrandText">SBB CFF FFS</text>

          <!-- Hour Hand (Hilfiker Rectangular Baton starting at center pivot) -->
          <g id="swissHourHand" class="swiss-hand-group swiss-hour-group">
            <rect id="swissHourBar" x="193.5" y="82" width="13" height="124" rx="2.5" class="swiss-hour-hand" fill="#111114" />
          </g>

          <!-- Minute Hand (Hilfiker Rectangular Baton starting at center pivot) -->
          <g id="swissMinuteHand" class="swiss-hand-group swiss-minute-group">
            <rect id="swissMinuteBar" x="195.25" y="38" width="9.5" height="168" rx="2" class="swiss-minute-hand" fill="#111114" />
          </g>

          <!-- Second Hand (Iconic Red Lollipop Baton with Counterweight Tail) -->
          <g id="swissSecondHand" class="swiss-hand-group swiss-second-group">
            <!-- Red Straight Shaft from y=32 to y=236 (36px tail past center) -->
            <rect id="swissSecondStem" x="198.4" y="32" width="3.2" height="204" rx="1.6" class="swiss-second-stem" fill="#e3001b" />
            <!-- Iconic Red Signaling Disc (Kelle) at y=68 (132px from center) -->
            <circle id="swissSecondDisc" cx="200" cy="68" r="14.5" class="swiss-second-disc" fill="#e3001b" />
            <!-- Center Pivot Rivet attached to the second hand -->
            <circle cx="200" cy="200" r="8.5" class="swiss-pin-outer" id="swissPinOuter" fill="#e3001b" />
            <circle cx="200" cy="200" r="3.2" class="swiss-pin-inner" id="swissPinInner" fill="#111114" />
          </g>

          <!-- Domed Crystal Glass Optical Reflection Overlay -->
          <ellipse id="swissGlassReflection" cx="190" cy="115" rx="160" ry="85"
                   fill="url(#glassReflectionGradient)" class="swiss-glass" pointer-events="none" />
        </svg>
      </div>
    `;

    // Cache elements
    this.wrapper = this.container.querySelector('#analogClockWrapper');
    this.svgEl = this.container.querySelector('.analog-svg');
    this.hourHand = this.container.querySelector('#swissHourHand');
    this.minuteHand = this.container.querySelector('#swissMinuteHand');
    this.secondHand = this.container.querySelector('#swissSecondHand');
    this.glassEl = this.container.querySelector('#swissGlassReflection');
    this.ticksGroup = this.container.querySelector('#swissTicksGroup');
    this.dialBase = this.container.querySelector('#swissDialBase');
    this.brandText = this.container.querySelector('#swissBrandText');
    this.subBrandText = this.container.querySelector('#swissSubBrandText');

    // Build dialect ticks & apply initial style
    this._renderDialMarkers();
    this._applyStyleVisuals();
    this._setupClockEvents();

    this.isBuilt = true;
  }

  _renderDialMarkers() {
    this.ticksGroup.innerHTML = '';
    const isBauhaus = this.style === 'bauhaus';

    for (let i = 0; i < 60; i++) {
      const isMajor = i % 5 === 0;

      if (isBauhaus) {
        // Bauhaus Max Bill style: fine minimal hairlines + micro dots
        if (isMajor) {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '198.8');
          rect.setAttribute('y', '24');
          rect.setAttribute('width', '2.4');
          rect.setAttribute('height', '18');
          rect.setAttribute('rx', '1.2');
          rect.setAttribute('class', 'tick-major bauhaus-tick');
          rect.setAttribute('transform', `rotate(${i * 6} 200 200)`);
          this.ticksGroup.appendChild(rect);

          // Subtle hour dot at radius 146
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', '200');
          dot.setAttribute('cy', '48');
          dot.setAttribute('r', '2.2');
          dot.setAttribute('class', 'tick-dot bauhaus-dot');
          dot.setAttribute('transform', `rotate(${i * 6} 200 200)`);
          this.ticksGroup.appendChild(dot);
        } else {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '199.3');
          rect.setAttribute('y', '24');
          rect.setAttribute('width', '1.4');
          rect.setAttribute('height', '9');
          rect.setAttribute('rx', '0.7');
          rect.setAttribute('class', 'tick-minor bauhaus-tick');
          rect.setAttribute('transform', `rotate(${i * 6} 200 200)`);
          this.ticksGroup.appendChild(rect);
        }
      } else {
        // Iconic Hans Hilfiker SBB Railway Clock: Bold rectangular blocks
        if (isMajor) {
          // Major hour tick: 11px wide x 34px long
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '194.5');
          rect.setAttribute('y', '22');
          rect.setAttribute('width', '11');
          rect.setAttribute('height', '34');
          rect.setAttribute('rx', '1.5');
          rect.setAttribute('class', 'tick-major sbb-tick');
          rect.setAttribute('transform', `rotate(${i * 6} 200 200)`);
          this.ticksGroup.appendChild(rect);
        } else {
          // Minor minute tick: 3.6px wide x 12px long
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '198.2');
          rect.setAttribute('y', '22');
          rect.setAttribute('width', '3.6');
          rect.setAttribute('height', '12');
          rect.setAttribute('rx', '0.8');
          rect.setAttribute('class', 'tick-minor sbb-tick');
          rect.setAttribute('transform', `rotate(${i * 6} 200 200)`);
          this.ticksGroup.appendChild(rect);
        }
      }
    }
  }

  _applyStyleVisuals() {
    this.wrapper.className = `analog-clock-wrapper style-${this.style}`;

    // Update Dial Base gradient
    if (this.style === 'sbb_dark') {
      this.dialBase.setAttribute('fill', 'url(#dialGradientDark)');
      this.brandText.textContent = 'SWISS DESIGN';
      this.subBrandText.textContent = 'SBB CFF FFS';
    } else if (this.style === 'bauhaus') {
      this.dialBase.setAttribute('fill', 'url(#dialGradientBauhaus)');
      this.brandText.textContent = 'CH-BAUHAUS';
      this.subBrandText.textContent = 'MAX BILL 1961';
    } else {
      // sbb_classic
      this.dialBase.setAttribute('fill', 'url(#dialGradientClassic)');
      this.brandText.textContent = 'SWISS DESIGN';
      this.subBrandText.textContent = 'SBB CFF FFS';
    }

    // Glass reflection
    if (this.glassEl) {
      this.glassEl.style.display = this.showGlass ? '' : 'none';
    }

    // Quick Bar Labels
    if (this.quickStyleName) {
      const styleLabels = {
        sbb_classic: 'SBB Cổ Điển',
        sbb_dark: 'SBB Dạ Quang',
        bauhaus: 'Bauhaus Max Bill'
      };
      this.quickStyleName.textContent = styleLabels[this.style] || 'SBB Cổ Điển';
    }

    if (this.quickMovementName) {
      const moveLabels = {
        stop2go: 'Stop2Go (1.5s)',
        smooth: 'Trôi Mượt (60fps)',
        step: 'Nhảy Giây'
      };
      this.quickMovementName.textContent = moveLabels[this.movement] || 'Stop2Go';
    }
  }

  _setupClockEvents() {
    if (this.wrapper) {
      this.wrapper.style.cursor = 'pointer';
      this.wrapper.setAttribute('title', 'Nhấp vào mặt đồng hồ để đổi phong cách: SBB Cổ Điển / SBB Dạ Quang / Bauhaus');
      this.wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleStyle(true);
      });
    }
  }

  showToast(message) {
    let toast = document.getElementById('swissToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'swissToast';
      toast.className = 'swiss-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 1800);
  }

  cycleStyle(showNotification = false) {
    const styles = ['sbb_classic', 'sbb_dark', 'bauhaus'];
    const curIdx = styles.indexOf(this.style);
    const nextStyle = styles[(curIdx + 1) % styles.length];
    this.setStyle(nextStyle);

    if (showNotification) {
      const names = {
        sbb_classic: '🇨🇭 SBB Cổ Điển (Hans Hilfiker 1944)',
        sbb_dark: '🌑 SBB Dạ Quang (Night Obsidian)',
        bauhaus: '📐 Bauhaus Max Bill (1961 Minimal)'
      };
      this.showToast(names[nextStyle] || nextStyle);
    }
  }

  cycleMovement() {
    const moves = ['stop2go', 'smooth', 'step'];
    const curIdx = moves.indexOf(this.movement);
    const nextMove = moves[(curIdx + 1) % moves.length];
    this.setMovement(nextMove);
  }

  setStyle(styleName) {
    this.style = styleName;
    localStorage.setItem('zd_swiss_style', styleName);
    this._renderDialMarkers();
    this._applyStyleVisuals();

    // Sync settings modal dropdown if open
    const modalSelect = document.getElementById('swissStyleSelect');
    if (modalSelect && modalSelect.value !== styleName) {
      modalSelect.value = styleName;
    }
  }

  setMovement(movementName) {
    this.movement = movementName;
    localStorage.setItem('zd_swiss_movement', movementName);
    this._applyStyleVisuals();

    // Sync settings modal dropdown if open
    const modalSelect = document.getElementById('swissMoveSelect');
    if (modalSelect && modalSelect.value !== movementName) {
      modalSelect.value = movementName;
    }
  }

  setGlass(show) {
    this.showGlass = !!show;
    localStorage.setItem('zd_swiss_glass', String(this.showGlass));
    if (this.glassEl) {
      this.glassEl.style.display = this.showGlass ? '' : 'none';
    }

    const modalToggle = document.getElementById('swissGlassToggle');
    if (modalToggle && modalToggle.checked !== this.showGlass) {
      modalToggle.checked = this.showGlass;
    }
  }

  /**
   * Continuous high-frequency update loop called on requestAnimationFrame
   */
  update(timeData) {
    if (!this.isBuilt) return;

    const { hoursRaw, minutesRaw, secondsRaw, millisRaw } = timeData;

    let secondDeg = 0;
    let minuteDeg = 0;
    let hourDeg = 0;

    if (this.movement === 'stop2go') {
      // ========================================================
      // AUTHENTIC SWISS RAILWAY CLOCK (SBB CFF FFS "stop2go")
      // - Second hand takes 58.5s to sweep 360 degrees (0 -> 58500ms).
      // - Pauses dead at 12 o'clock for 1.5 seconds (58500 -> 60000ms).
      // - Exactly at millisecond 0 of the new minute, minute hand
      //   jumps forward by 1 minute with a sharp mechanical click!
      // ========================================================
      const totalMillis = secondsRaw * 1000 + millisRaw;
      const RUN_DURATION_MS = 58500; // 58.5s

      if (totalMillis < RUN_DURATION_MS) {
        // Sweeping smoothly across 58.5s
        secondDeg = (totalMillis / RUN_DURATION_MS) * 360;
      } else {
        // Paused at 12 o'clock (0 / 360 deg) waiting for impulse
        secondDeg = 0;
      }

      // Detect minute rollover for mechanical jump
      if (this.lastMinute !== -1 && this.lastMinute !== minutesRaw) {
        this._triggerMinuteSnap();
      }
      this.lastMinute = minutesRaw;

      // Minute hand stays steady at exact integer minute
      minuteDeg = minutesRaw * 6;

      // Hour hand moves gradually with minute progression
      hourDeg = ((hoursRaw % 12) + minutesRaw / 60) * 30;

    } else if (this.movement === 'smooth') {
      // ========================================================
      // CONTINUOUS 60FPS SWEEP (Gliding Ultra-Smooth Motion)
      // ========================================================
      const exactSecond = secondsRaw + millisRaw / 1000;
      const exactMinute = minutesRaw + exactSecond / 60;
      const exactHour = (hoursRaw % 12) + exactMinute / 60;

      secondDeg = exactSecond * 6;
      minuteDeg = exactMinute * 6;
      hourDeg = exactHour * 30;

    } else {
      // ========================================================
      // STEPPING QUARTZ (Classic 1-second ticks)
      // ========================================================
      secondDeg = secondsRaw * 6;
      minuteDeg = (minutesRaw + secondsRaw / 60) * 6;
      hourDeg = ((hoursRaw % 12) + minutesRaw / 60) * 30;
    }

    // Apply exact SVG rotational transforms around center (200, 200)
    this.secondHand.setAttribute('transform', `rotate(${secondDeg.toFixed(2)} 200 200)`);
    this.minuteHand.setAttribute('transform', `rotate(${minuteDeg.toFixed(2)} 200 200)`);
    this.hourHand.setAttribute('transform', `rotate(${hourDeg.toFixed(2)} 200 200)`);
  }

  /**
   * Applies realistic electro-mechanical snap effect when minute hand advances
   */
  _triggerMinuteSnap() {
    if (this.isSnappingMinute) return;
    this.isSnappingMinute = true;

    // Apply snappy spring curve for 180ms
    this.minuteHand.classList.add('minute-mechanical-snap');

    if (this.minuteSnapTimer) clearTimeout(this.minuteSnapTimer);
    this.minuteSnapTimer = setTimeout(() => {
      this.minuteHand.classList.remove('minute-mechanical-snap');
      this.isSnappingMinute = false;
    }, 220);
  }
}
