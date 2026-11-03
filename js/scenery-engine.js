/**
 * ZenDesk Clock - Realistic Multi-Layer Seasonal Scenery Engine
 * Supports 2.5D Vector Parallax, Curated 4K Real Photography Presets,
 * and Custom User Local Wallpaper via IndexedDB.
 */

import { wallpaperDB } from './wallpaper-db.js';

export const PHOTO_PRESETS = {
  winter_photo: {
    id: 'winter_photo',
    name: '❄️ Căn nhà gỗ tuyết phủ (Winter Cabin)',
    url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2560&q=80',
    particle: 'snow'
  },
  spring_photo: {
    id: 'spring_photo',
    name: '🌸 Cành đào hồng ngày xuân (Peach Blossom)',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2560&q=80',
    particle: 'sakura'
  },
  spring_mai_photo: {
    id: 'spring_mai_photo',
    name: '🧧 Cành mai vàng rực rỡ (Golden Blossom)',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2560&q=80',
    particle: 'mai'
  },
  summer_photo: {
    id: 'summer_photo',
    name: '🌊 Hoàng hôn biển nhiệt đới (Sunset Beach)',
    url: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=2560&q=80',
    particle: 'fireflies'
  },
  autumn_photo: {
    id: 'autumn_photo',
    name: '🍁 Rừng phong đỏ Kyoto (Autumn Maple)',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=2560&q=80',
    particle: 'maple'
  },
  cafe_photo: {
    id: 'cafe_photo',
    name: '☕ Quán cafe ấm cúng (Cozy Cafe)',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2560&q=80',
    particle: 'none'
  }
};

export class SceneryEngine {
  constructor(container) {
    this.container = container;
    this.currentSeason = null;
    this.wallpaperMode = 'auto_photo'; // 'auto_photo', 'vector', specific photo preset id, or 'custom'
    this.customBlobUrl = null;
    this.dimmer = 0.30;
    this.blur = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.currentMouseX = 0;
    this.currentMouseY = 0;
    this.rafId = null;

    this._initMouseParallax();
    this._loadSavedPreferences();
  }

  async _loadSavedPreferences() {
    const savedDimmer = localStorage.getItem('zd_bg_dimmer');
    if (savedDimmer !== null) {
      this.setDimmer(parseFloat(savedDimmer));
    }
    const savedBlur = localStorage.getItem('zd_bg_blur');
    if (savedBlur !== null) {
      this.setBlur(parseInt(savedBlur, 10));
    }
    const savedMode = localStorage.getItem('zd_wallpaper_mode');
    if (savedMode) {
      this.wallpaperMode = savedMode;
    }
  }

  setDimmer(val) {
    this.dimmer = Math.max(0, Math.min(0.9, val));
    document.documentElement.style.setProperty('--bg-dimmer', this.dimmer);
    localStorage.setItem('zd_bg_dimmer', this.dimmer);
  }

  setBlur(px) {
    this.blur = Math.max(0, Math.min(30, px));
    document.documentElement.style.setProperty('--bg-blur', `${this.blur}px`);
    localStorage.setItem('zd_bg_blur', this.blur);
  }

  async setWallpaperMode(mode) {
    this.wallpaperMode = mode;
    localStorage.setItem('zd_wallpaper_mode', mode);
    await this.refresh();
  }

  async refresh() {
    await this.applyScene(this.currentSeason);
  }

  async setSeason(season) {
    this.currentSeason = season;
    await this.applyScene(season);
  }

  async applyScene(season) {
    if (!season || season === 'none') {
      this.container.innerHTML = '';
      return;
    }

    // 1. Custom User Wallpaper
    if (this.wallpaperMode === 'custom') {
      const blob = await wallpaperDB.getCustomWallpaperBlob();
      if (blob) {
        if (this.customBlobUrl) {
          URL.revokeObjectURL(this.customBlobUrl);
        }
        this.customBlobUrl = URL.createObjectURL(blob);
        this.container.innerHTML = `
          <div class="scenery-photo-layer" style="background-image: url('${this.customBlobUrl}');"></div>
        `;
        return;
      }
    }

    // 2. Specific Real Photo Preset
    if (PHOTO_PRESETS[this.wallpaperMode]) {
      const preset = PHOTO_PRESETS[this.wallpaperMode];
      this.container.innerHTML = `
        <div class="scenery-photo-layer" style="background-image: url('${preset.url}');"></div>
      `;
      return;
    }

    // 3. Auto Real Photo according to Season (Default for realistic feel!)
    if (this.wallpaperMode === 'auto_photo') {
      const seasonToPhoto = {
        winter: PHOTO_PRESETS.winter_photo.url,
        spring: PHOTO_PRESETS.spring_photo.url,
        summer: PHOTO_PRESETS.summer_photo.url,
        autumn: PHOTO_PRESETS.autumn_photo.url
      };

      const photoUrl = seasonToPhoto[season];
      if (photoUrl) {
        this.container.innerHTML = `
          <div class="scenery-photo-layer" style="background-image: url('${photoUrl}');"></div>
          ${season === 'winter' ? '<div class="winter-fire-glow"></div>' : ''}
        `;
        return;
      }
    }

    // 4. Vector 2.5D SVG Parallax
    if (this.wallpaperMode === 'vector') {
      this.container.innerHTML = this._getScenerySVG(season);
      return;
    }

    // Default fallback
    this.container.innerHTML = this._getScenerySVG(season);
  }

  _getScenerySVG(season) {
    switch (season) {
      case 'winter':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="winSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#040711" />
                <stop offset="60%" stop-color="#0e172a" />
                <stop offset="100%" stop-color="#192843" />
              </linearGradient>
              <linearGradient id="winMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1d283c" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#090f19" stop-opacity="0.95" />
              </linearGradient>
              <linearGradient id="cabinWood" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#110b07" />
                <stop offset="50%" stop-color="#1c120c" />
                <stop offset="100%" stop-color="#0d0805" />
              </linearGradient>
            </defs>

            <!-- Sky & Moon -->
            <rect width="1920" height="1080" fill="url(#winSky)" />
            <circle cx="1480" cy="200" r="48" fill="#e2e8f0" opacity="0.85" filter="drop-shadow(0 0 35px rgba(226, 232, 240, 0.45))" />

            <!-- Distant Snowy Mountain Ridges -->
            <path d="M0,740 L280,480 L620,680 L960,430 L1350,660 L1680,490 L1920,630 L1920,1080 L0,1080 Z" fill="url(#winMtn)" opacity="0.65" class="parallax-back" />

            <!-- Pine Forest Midground -->
            <g fill="#070c15" opacity="0.88" class="parallax-mid">
              <polygon points="120,780 150,670 180,780" />
              <polygon points="170,790 210,640 250,790" />
              <polygon points="340,770 380,660 420,770" />
              <polygon points="760,780 810,620 860,780" />
              <polygon points="840,790 890,650 940,790" />
              <polygon points="1200,790 1250,640 1300,790" />
              <polygon points="1440,770 1480,660 1520,770" />
              <polygon points="1720,780 1760,650 1800,780" />
            </g>
            <g fill="#bae6fd" opacity="0.55">
              <path d="M150,670 L142,695 Q150,688 158,695 Z" />
              <path d="M210,640 L198,670 Q210,660 222,670 Z" />
              <path d="M810,620 L796,655 Q810,645 824,655 Z" />
              <path d="M1250,640 L1238,670 Q1250,660 1262,670 Z" />
            </g>

            <!-- Cabin Window Frame -->
            <g class="parallax-front" fill="url(#cabinWood)">
              <rect x="0" y="0" width="1920" height="38" />
              <rect x="0" y="1035" width="1920" height="45" />
              <rect x="0" y="0" width="45" height="1080" />
              <rect x="1875" y="0" width="45" height="1080" />
              <rect x="945" y="0" width="30" height="1080" />
              <rect x="0" y="525" width="1920" height="25" />
              <line x1="0" y1="1035" x2="1920" y2="1035" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
            </g>
          </svg>
          <div class="winter-fire-glow"></div>
        `;

      case 'spring':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sprSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#140409" />
                <stop offset="55%" stop-color="#2a0d17" />
                <stop offset="100%" stop-color="#4a1523" />
              </linearGradient>
              <linearGradient id="sprMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#3d1421" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#18040b" stop-opacity="0.95" />
              </linearGradient>
              <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffedd5" />
                <stop offset="40%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#991b1b" />
              </radialGradient>
            </defs>

            <!-- Misty Dawn Sky & Gentle Sunrise Sun -->
            <rect width="1920" height="1080" fill="url(#sprSky)" />
            <circle cx="960" cy="620" r="280" fill="#f43f5e" opacity="0.12" filter="blur(60px)" />

            <!-- Mountain Silhouettes -->
            <path d="M0,760 C320,620 540,740 820,640 C1100,540 1450,720 1920,620 L1920,1080 L0,1080 Z" fill="url(#sprMtn)" opacity="0.65" class="parallax-back" />
            <path d="M0,840 C420,750 780,880 1200,780 C1550,700 1780,830 1920,770 L1920,1080 L0,1080 Z" fill="#1b060d" opacity="0.85" class="parallax-mid" />
            <path d="M280,730 L320,705 L360,730 L350,730 L355,750 L285,750 L290,730 Z" fill="#140309" opacity="0.9" />

            <!-- Blooming Branches & Lanterns -->
            <g class="spring-branch-layer parallax-front">
              <path d="M1920,20 Q1680,40 1520,160 T1280,240 Q1120,300 980,260" fill="none" stroke="#220c06" stroke-width="14" stroke-linecap="round" />
              <path d="M1540,150 Q1420,110 1340,140" fill="none" stroke="#220c06" stroke-width="8" stroke-linecap="round" />
              <path d="M1320,230 Q1240,320 1150,340" fill="none" stroke="#220c06" stroke-width="6" stroke-linecap="round" />

              <circle cx="1000" cy="265" r="14" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
              <circle cx="985" cy="255" r="10" fill="#f43f5e" />
              <circle cx="1160" cy="340" r="16" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
              <circle cx="1250" cy="245" r="18" fill="#f43f5e" filter="drop-shadow(0 0 8px #e11d48)" />
              <circle cx="1350" cy="140" r="14" fill="#fbbf24" />
              <circle cx="1440" cy="115" r="15" fill="#f43f5e" />
              <circle cx="1520" cy="165" r="20" fill="#f43f5e" filter="drop-shadow(0 0 10px #e11d48)" />
              <circle cx="1660" cy="65" r="16" fill="#fbbf24" />

              <g class="spring-lantern-layer" style="transform-origin: 1300px 230px;">
                <line x1="1300" y1="230" x2="1300" y2="350" stroke="#d97706" stroke-width="2.5" />
                <ellipse cx="1300" cy="405" rx="34" ry="46" fill="url(#lanternGlow)" class="lantern-glow" />
                <rect x="1282" y="350" width="36" height="10" rx="3" fill="#f59e0b" />
                <rect x="1282" y="450" width="36" height="10" rx="3" fill="#f59e0b" />
                <text x="1300" y="415" font-family="sans-serif" font-weight="900" font-size="22" fill="#fef08a" text-anchor="middle">春</text>
                <line x1="1300" y1="460" x2="1300" y2="520" stroke="#f59e0b" stroke-width="3" />
              </g>

              <g class="spring-lantern-layer" style="transform-origin: 1560px 160px; animation-delay: -1.8s;">
                <line x1="1560" y1="160" x2="1560" y2="260" stroke="#d97706" stroke-width="2" />
                <ellipse cx="1560" cy="305" rx="26" ry="36" fill="url(#lanternGlow)" class="lantern-glow" />
                <rect x="1546" y="260" width="28" height="8" rx="2" fill="#f59e0b" />
                <rect x="1546" y="340" width="28" height="8" rx="2" fill="#f59e0b" />
                <text x="1560" y="312" font-family="sans-serif" font-weight="900" font-size="16" fill="#fef08a" text-anchor="middle">福</text>
                <line x1="1560" y1="348" x2="1560" y2="400" stroke="#f59e0b" stroke-width="2.5" />
              </g>
            </g>
          </svg>
        `;

      case 'summer':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sumSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0c071d" />
                <stop offset="35%" stop-color="#3d123b" />
                <stop offset="65%" stop-color="#932b3f" />
                <stop offset="85%" stop-color="#dd6b20" />
                <stop offset="100%" stop-color="#fbd38d" />
              </linearGradient>
              <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#14283c" />
                <stop offset="50%" stop-color="#0b1827" />
                <stop offset="100%" stop-color="#040b13" />
              </linearGradient>
            </defs>

            <rect width="1920" height="660" fill="url(#sumSky)" />
            <circle cx="960" cy="655" r="70" fill="#fffaf0" filter="drop-shadow(0 0 45px #f6ad55)" />
            <rect y="660" width="1920" height="420" fill="url(#oceanGrad)" />

            <g fill="#fbd38d" opacity="0.65" class="summer-waves-layer">
              <ellipse cx="960" cy="670" rx="90" ry="3" />
              <ellipse cx="960" cy="690" rx="140" ry="4" />
              <ellipse cx="960" cy="720" rx="190" ry="5" />
              <ellipse cx="960" cy="760" rx="250" ry="6" opacity="0.5" />
              <ellipse cx="960" cy="815" rx="330" ry="8" opacity="0.35" />
              <ellipse cx="960" cy="885" rx="420" ry="10" opacity="0.2" />
            </g>

            <g class="summer-palm-layer parallax-front" fill="#040a12">
              <path d="M0,0 Q180,80 220,380" stroke="#040a12" stroke-width="26" fill="none" stroke-linecap="round" />
              <path d="M220,380 Q380,360 480,480 Q380,440 220,380 Z" />
              <path d="M220,380 Q450,280 560,320 Q440,330 220,380 Z" />
              <path d="M220,380 Q360,220 460,180 Q350,250 220,380 Z" />
              <path d="M220,380 Q250,160 300,90 Q220,220 220,380 Z" />
              <path d="M220,380 Q140,240 80,180 Q160,280 220,380 Z" />
              <path d="M220,380 Q260,460 280,580 Q220,480 220,380 Z" />
            </g>
          </svg>
        `;

      case 'autumn':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="autSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#120803" />
                <stop offset="50%" stop-color="#2d1408" />
                <stop offset="100%" stop-color="#4f2008" />
              </linearGradient>
              <linearGradient id="autMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#361506" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#140602" stop-opacity="0.95" />
              </linearGradient>
            </defs>

            <rect width="1920" height="1080" fill="url(#autSky)" />
            <path d="M0,720 Q480,620 960,700 T1920,640 L1920,1080 L0,1080 Z" fill="url(#autMtn)" opacity="0.65" class="parallax-back" />

            <g fill="#160802" opacity="0.85" class="parallax-mid">
              <path d="M160,780 Q200,600 240,780 Z" />
              <circle cx="200" cy="620" r="85" fill="#2d1306" />
              <circle cx="230" cy="600" r="65" fill="#451c08" opacity="0.8" />
              <path d="M820,790 Q870,580 920,790 Z" />
              <circle cx="870" cy="600" r="95" fill="#301407" />
              <circle cx="895" cy="580" r="75" fill="#58240a" opacity="0.75" />
              <path d="M1520,780 Q1570,620 1620,780 Z" />
              <circle cx="1570" cy="630" r="80" fill="#2d1306" />
            </g>

            <rect y="640" width="1920" height="220" fill="#f97316" opacity="0.08" filter="blur(45px)" class="autumn-mist-layer" />

            <g class="parallax-front">
              <rect x="0" y="1030" width="1920" height="50" fill="#140803" />
              <line x1="0" y1="1030" x2="1920" y2="1030" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
              <path d="M1740,970 L1750,1030 L1810,1030 L1820,970 Z" fill="#1e0c05" stroke="#331408" stroke-width="2" />
              <path d="M1815,980 Q1840,995 1812,1015" fill="none" stroke="#1e0c05" stroke-width="6" stroke-linecap="round" />
              <path d="M1775,960 Q1765,940 1775,920 T1785,890" fill="none" stroke="rgba(254, 215, 170, 0.45)" stroke-width="3" stroke-linecap="round" class="autumn-steam" />
            </g>
          </svg>
        `;

      default:
        return '';
    }
  }

  _initMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;

      if (!this.rafId) {
        this._startParallaxLoop();
      }
    });
  }

  _startParallaxLoop() {
    const loop = () => {
      this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.05;
      this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.05;

      const back = this.container.querySelectorAll('.parallax-back');
      const mid = this.container.querySelectorAll('.parallax-mid');
      const front = this.container.querySelectorAll('.parallax-front');

      back.forEach(el => {
        el.style.transform = `translate3d(${this.currentMouseX * 5}px, ${this.currentMouseY * 3}px, 0)`;
      });
      mid.forEach(el => {
        el.style.transform = `translate3d(${this.currentMouseX * 12}px, ${this.currentMouseY * 6}px, 0)`;
      });
      front.forEach(el => {
        el.style.transform = `translate3d(${this.currentMouseX * -4}px, ${this.currentMouseY * -2}px, 0)`;
      });

      if (Math.abs(this.targetMouseX - this.currentMouseX) > 0.001 || Math.abs(this.targetMouseY - this.currentMouseY) > 0.001) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }
}
