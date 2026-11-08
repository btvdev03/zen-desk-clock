/**
 * ZenDesk Clock - Seasonal Clock Border & Festive Frame Manager
 * Pure vector SVG & GPU-accelerated CSS decorative frame for Clock Cards
 */

export class SeasonalFrameManager {
  constructor() {
    this.storageEnabledKey = 'zd_clock_border_enabled';
    this.storageSeasonKey = 'zd_clock_border_season';

    this.enabled = localStorage.getItem(this.storageEnabledKey) !== 'false'; // default true
    this.selectedSeason = localStorage.getItem(this.storageSeasonKey) || 'auto'; // 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'

    this.containerEl = null;
    this.clockContainer = null;
    this.activeSeason = 'winter';
    this.initialized = false;
  }

  init(clockContainerId = 'flipClockView') {
    if (this.initialized) return;
    this.initialized = true;

    this.clockContainer = document.getElementById(clockContainerId);
    if (!this.clockContainer) return;

    // Create frame container if not exists
    let frame = document.getElementById('seasonalClockFrame');
    if (!frame) {
      frame = document.createElement('div');
      frame.id = 'seasonalClockFrame';
      frame.className = 'seasonal-clock-frame';
      this.clockContainer.appendChild(frame);
    }
    this.containerEl = frame;

    this.clockContainer.classList.add('has-seasonal-frame');

    this.render();
  }

  getEffectiveSeason() {
    if (this.selectedSeason !== 'auto') {
      return this.selectedSeason;
    }

    // Auto-detect based on calendar month
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn';
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    localStorage.setItem(this.storageEnabledKey, this.enabled ? 'true' : 'false');
    this.render();
  }

  setSeason(season) {
    this.selectedSeason = season;
    localStorage.setItem(this.storageSeasonKey, season);
    this.render();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  render() {
    if (!this.containerEl || !this.clockContainer) return;

    // Clean up existing snow caps on card units
    this._removeSnowCaps();

    if (!this.enabled) {
      this.containerEl.className = 'seasonal-clock-frame hidden';
      this.containerEl.innerHTML = '';
      this.clockContainer.classList.remove('has-seasonal-frame');
      return;
    }

    this.clockContainer.classList.add('has-seasonal-frame');
    const season = this.getEffectiveSeason();
    this.activeSeason = season;

    this.containerEl.className = `seasonal-clock-frame seasonal-frame-${season}`;
    this.containerEl.classList.remove('hidden');

    switch (season) {
      case 'winter':
        this._renderWinter();
        break;
      case 'spring':
        this._renderSpring();
        break;
      case 'summer':
        this._renderSummer();
        break;
      case 'autumn':
        this._renderAutumn();
        break;
      default:
        this._renderWinter();
        break;
    }
  }

  _removeSnowCaps() {
    if (!this.clockContainer) return;
    const existingCaps = this.clockContainer.querySelectorAll('.snow-cap-layer');
    existingCaps.forEach(el => el.remove());
  }

  _renderWinter() {
    // 1. Add delicate Snow Cap layer on each card unit
    const cardUnits = this.clockContainer.querySelectorAll('.flip-card-unit');
    cardUnits.forEach(card => {
      const cap = document.createElement('div');
      cap.className = 'snow-cap-layer';
      cap.innerHTML = `
        <svg class="snow-cap-svg" viewBox="0 0 160 28" preserveAspectRatio="none">
          <path d="M 0 10 Q 15 2, 35 12 Q 55 22, 75 10 Q 95 -2, 115 12 Q 135 24, 150 8 Q 156 2, 160 10 L 160 0 L 0 0 Z" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(186, 230, 253, 0.7))"/>
          <path d="M 12 10 Q 25 24, 38 12 Q 60 20, 72 10 Q 90 22, 108 12 Q 130 22, 148 10" stroke="rgba(224, 242, 254, 0.9)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      `;
      card.appendChild(cap);
    });

    // 2. Evergreen pine garland with fairy lights across the clock
    this.containerEl.innerHTML = `
      <div class="winter-pine-garland">
        <svg class="winter-corner-bell" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          <circle cx="12" cy="3" r="1" fill="#ef4444"></circle>
        </svg>
        <svg class="winter-corner-bell" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          <circle cx="12" cy="3" r="1" fill="#ef4444"></circle>
        </svg>
      </div>
      <div class="fairy-lights-string">
        <span class="fairy-bulb color-gold"></span>
        <span class="fairy-bulb color-red"></span>
        <span class="fairy-bulb color-green"></span>
        <span class="fairy-bulb color-blue"></span>
        <span class="fairy-bulb color-gold"></span>
        <span class="fairy-bulb color-red"></span>
        <span class="fairy-bulb color-green"></span>
        <span class="fairy-bulb color-blue"></span>
        <span class="fairy-bulb color-gold"></span>
      </div>
    `;
  }

  _renderSpring() {
    this.containerEl.innerHTML = `
      <div class="spring-branch-layer">
        <svg class="spring-corner-blossom top-left" viewBox="0 0 36 36">
          <path d="M 0 0 Q 18 10, 32 28" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <circle cx="18" cy="10" r="5" fill="#f472b6"/>
          <circle cx="18" cy="10" r="2.5" fill="#fbcfe8"/>
          <circle cx="28" cy="22" r="6" fill="#f472b6"/>
          <circle cx="28" cy="22" r="3" fill="#fbcfe8"/>
          <circle cx="8" cy="5" r="4" fill="#fb7185"/>
        </svg>
        <svg class="spring-corner-blossom top-right" viewBox="0 0 36 36">
          <path d="M 0 0 Q 18 10, 32 28" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <circle cx="18" cy="10" r="5" fill="#f472b6"/>
          <circle cx="18" cy="10" r="2.5" fill="#fbcfe8"/>
          <circle cx="28" cy="22" r="6" fill="#f472b6"/>
          <circle cx="28" cy="22" r="3" fill="#fbcfe8"/>
          <circle cx="8" cy="5" r="4" fill="#fb7185"/>
        </svg>
        <div class="spring-vine-top">
          <span class="spring-petal-dot"></span>
          <span class="spring-petal-dot" style="animation-delay: 0.6s;"></span>
          <span class="spring-petal-dot" style="animation-delay: 1.2s;"></span>
          <span class="spring-petal-dot" style="animation-delay: 1.8s;"></span>
          <span class="spring-petal-dot" style="animation-delay: 2.4s;"></span>
        </div>
      </div>
    `;
  }

  _renderSummer() {
    this.containerEl.innerHTML = `
      <div class="summer-accent-layer">
        <div class="summer-sun-glow"></div>
        <svg class="summer-corner-leaf top-left" viewBox="0 0 40 40">
          <path d="M 5 35 Q 15 15, 35 5 Q 30 20, 20 28 Z" fill="#10b981"/>
          <path d="M 8 38 Q 22 25, 32 15" stroke="#059669" stroke-width="1.5" fill="none"/>
          <path d="M 2 30 Q 10 18, 25 12" fill="#34d399" opacity="0.8"/>
        </svg>
        <svg class="summer-corner-leaf top-right" viewBox="0 0 40 40">
          <path d="M 5 35 Q 15 15, 35 5 Q 30 20, 20 28 Z" fill="#10b981"/>
          <path d="M 8 38 Q 22 25, 32 15" stroke="#059669" stroke-width="1.5" fill="none"/>
          <path d="M 2 30 Q 10 18, 25 12" fill="#34d399" opacity="0.8"/>
        </svg>
      </div>
    `;
  }

  _renderAutumn() {
    this.containerEl.innerHTML = `
      <div class="autumn-garland-layer">
        <svg class="autumn-corner-maple top-left" viewBox="0 0 36 36">
          <path d="M 18 2 L 21 11 L 30 9 L 24 16 L 31 22 L 21 21 L 18 32 L 15 21 L 5 22 L 12 16 L 6 9 L 15 11 Z" fill="#ea580c"/>
          <circle cx="18" cy="18" r="3" fill="#f97316"/>
        </svg>
        <svg class="autumn-corner-maple top-right" viewBox="0 0 36 36">
          <path d="M 18 2 L 21 11 L 30 9 L 24 16 L 31 22 L 21 21 L 18 32 L 15 21 L 5 22 L 12 16 L 6 9 L 15 11 Z" fill="#eab308"/>
          <circle cx="18" cy="18" r="3" fill="#f59e0b"/>
        </svg>
        <div class="autumn-leaf-string">
          <svg class="mini-maple-leaf" viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
          <svg class="mini-maple-leaf" viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
          <svg class="mini-maple-leaf" viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
          <svg class="mini-maple-leaf" viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
        </div>
      </div>
    `;
  }
}

export const seasonalFrameManager = new SeasonalFrameManager();
