/**
 * ZenDesk Clock - Realistic Multi-Layer Seasonal Scenery & Dynamic Wallpaper Engine
 * Supports:
 * - 🌅 Microsoft Bing Daily 4K Wallpaper API (Auto daily update with 4K UHD photography)
 * - 🎲 Picsum Photos 4K Randomizer API
 * - 🔄 Auto Slideshow rotation (30 minutes)
 * - 🧧 Curated Vietnamese Lunar New Year (Tết) 4K collection
 * - 🌿 4-Season curated Unsplash photography
 * - 🎨 2.5D Vector Parallax SVG
 * - 🖼️ Custom User Wallpaper via IndexedDB
 */

import { wallpaperDB } from './wallpaper-db.js';

export const PHOTO_PRESETS = {
  // --- BỘ SƯU TẬP TẾT VIỆT NAM (LUNAR NEW YEAR) ---
  tet_mai_photo: {
    id: 'tet_mai_photo',
    name: 'Tết: Cành mai vàng phương Nam rực rỡ',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2560&q=80',
    particle: 'mai'
  },
  tet_dao_photo: {
    id: 'tet_dao_photo',
    name: 'Tết: Cành đào hồng Nhật Tân đón xuân',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2560&q=80',
    particle: 'sakura'
  },
  tet_hoian_photo: {
    id: 'tet_hoian_photo',
    name: 'Tết: Phố cổ Hội An giàn lồng đèn đỏ',
    url: 'https://images.unsplash.com/photo-1560113855-2ea616c915ee?auto=format&fit=crop&w=2560&q=80',
    particle: 'mai'
  },
  tet_river_photo: {
    id: 'tet_river_photo',
    name: 'Tết: Thả hoa đăng đêm sông Hoài Hội An',
    url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=2560&q=80',
    particle: 'fireflies'
  },
  tet_lanterns_photo: {
    id: 'tet_lanterns_photo',
    name: 'Tết: Sắc màu lồng đèn chợ đêm xuân',
    url: 'https://images.unsplash.com/photo-1580974852861-c381510bc98a?auto=format&fit=crop&w=2560&q=80',
    particle: 'mai'
  },
  tet_pagoda_photo: {
    id: 'tet_pagoda_photo',
    name: '️ Tết: Đi lễ chùa cổ đầu năm thanh tịnh',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2560&q=80',
    particle: 'sakura'
  },
  tet_fireworks_photo: {
    id: 'tet_fireworks_photo',
    name: 'Tết: Pháo hoa đêm Giao thừa rực sáng',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2560&q=80',
    particle: 'fireflies'
  },

  // --- PHONG CẢNH 4 MÙA & KHÔNG GIAN LÀM VIỆC ---
  winter_photo: {
    id: 'winter_photo',
    name: '️ Mùa đông: Căn nhà gỗ tuyết phủ Emerald Lake',
    url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2560&q=80',
    particle: 'snow'
  },
  summer_photo: {
    id: 'summer_photo',
    name: 'Mùa hạ: Hoàng hôn bờ biển nhiệt đới',
    url: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=2560&q=80',
    particle: 'fireflies'
  },
  autumn_photo: {
    id: 'autumn_photo',
    name: 'Mùa thu: Rừng phong đỏ Kyoto',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=2560&q=80',
    particle: 'maple'
  },
  cafe_photo: {
    id: 'cafe_photo',
    name: 'Không gian: Quán cafe sách ấm cúng',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2560&q=80',
    particle: 'none'
  }
};

// Aliases for compatibility
PHOTO_PRESETS.spring_photo = PHOTO_PRESETS.tet_dao_photo;
PHOTO_PRESETS.spring_mai_photo = PHOTO_PRESETS.tet_mai_photo;

export class SceneryEngine {
  constructor(container) {
    this.container = container;
    this.currentSeason = null;
    this.wallpaperMode = 'bing_daily'; // 'bing_daily', 'random_photo', 'auto_slideshow', 'auto_photo', 'vector', specific preset id, 'custom'
    this.customBlobUrl = null;
    this.dimmer = 0.30;
    this.blur = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.currentMouseX = 0;
    this.currentMouseY = 0;
    this.rafId = null;
    this.slideshowIntervalId = null;
    this.currentRandomUrl = null;

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

  /**
   * Fetches the official Microsoft Bing Daily 4K Wallpaper
   * Uses high-speed cached endpoint with local daily memoization
   */
  async fetchBingDailyWallpaper() {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cacheKey = 'zd_bing_cache';
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === todayStr && parsed.url) {
          return parsed;
        }
      } catch (e) {}
    }

    try {
      // 3840x2160 true 4K UHD Bing Wallpaper API
      const resp = await fetch('https://bing.biturl.top/?resolution=3840&format=json&index=0&mkt=en-US', { cache: 'no-cache' });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.url) {
          let title = data.copyright || 'Microsoft Bing 4K';
          let location = title;
          if (title.includes('(')) {
            location = title.split('(')[0].trim();
          }
          const bingData = {
            date: todayStr,
            url: data.url,
            title: location,
            fullCopyright: data.copyright || ''
          };
          localStorage.setItem(cacheKey, JSON.stringify(bingData));
          return bingData;
        }
      }
    } catch (err) {
      console.warn('Bing API fetch error, fallback to cached or preset', err);
    }

    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    return {
      date: todayStr,
      url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2560&q=80',
      title: 'Hồ Emerald tuyết phủ, Canada',
      fullCopyright: 'Unsplash Photography'
    };
  }

  /**
   * Fetches or updates a random 4K nature/landscape wallpaper
   */
  async fetchRandomWallpaper() {
    const ts = Date.now();
    const url = `https://picsum.photos/2560/1440?random=${ts}`;
    this.currentRandomUrl = url;
    this._applyPhotoLayer(url, 'Ảnh ngẫu nhiên nghệ thuật (Picsum 4K)');
    return url;
  }

  startSlideshow() {
    this.stopSlideshow();
    this.nextSlideshowImage();
    // Rotate every 30 minutes
    this.slideshowIntervalId = setInterval(() => {
      this.nextSlideshowImage();
    }, 30 * 60 * 1000);
  }

  stopSlideshow() {
    if (this.slideshowIntervalId) {
      clearInterval(this.slideshowIntervalId);
      this.slideshowIntervalId = null;
    }
  }

  nextSlideshowImage() {
    const keys = Object.keys(PHOTO_PRESETS);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const preset = PHOTO_PRESETS[randKey];
    if (preset) {
      this._applyPhotoLayer(preset.url, preset.name);
    }
  }

  _applyPhotoLayer(url, caption = '') {
    this.container.innerHTML = `
      <div class="scenery-photo-layer" style="background-image: url('${url}');"></div>
    `;
    this._updateCaptionBadge(caption);
    document.body.classList.add('has-scenery');
  }

  _updateCaptionBadge(caption) {
    const badge = document.getElementById('wallpaperCaptionBadge');
    const textEl = document.getElementById('wallpaperCaptionText');
    if (badge && textEl) {
      if (caption && caption.trim()) {
        textEl.textContent = caption;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  _getCurrentCalendarSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn';
  }

  async applyScene(season) {
    this.stopSlideshow();

    // 1. Microsoft Bing Daily 4K API
    if (this.wallpaperMode === 'bing_daily') {
      const bing = await this.fetchBingDailyWallpaper();
      this._applyPhotoLayer(bing.url, bing.title || 'Ảnh Bing 4K hôm nay');
      return;
    }

    // 2. Random 4K Wallpaper (Picsum API)
    if (this.wallpaperMode === 'random_photo') {
      if (this.currentRandomUrl) {
        this._applyPhotoLayer(this.currentRandomUrl, 'Ảnh ngẫu nhiên nghệ thuật (Picsum 4K)');
      } else {
        await this.fetchRandomWallpaper();
      }
      return;
    }

    // 3. Auto Slideshow (30 minutes rotation)
    if (this.wallpaperMode === 'auto_slideshow') {
      this.startSlideshow();
      return;
    }

    // 4. Custom User Wallpaper via IndexedDB
    if (this.wallpaperMode === 'custom') {
      const blob = await wallpaperDB.getCustomWallpaperBlob();
      if (blob) {
        if (this.customBlobUrl) {
          URL.revokeObjectURL(this.customBlobUrl);
        }
        this.customBlobUrl = URL.createObjectURL(blob);
        this._applyPhotoLayer(this.customBlobUrl, 'Ảnh cá nhân của bạn');
        return;
      }
    }

    // 5. Specific Real Photo Preset
    if (PHOTO_PRESETS[this.wallpaperMode]) {
      const preset = PHOTO_PRESETS[this.wallpaperMode];
      this._applyPhotoLayer(preset.url, preset.name);
      return;
    }

    // 6. Auto Real Photo according to Season
    if (this.wallpaperMode === 'auto_photo') {
      const currentSeason = (season && season !== 'none') ? season : this._getCurrentCalendarSeason();
      const seasonToPhoto = {
        winter: PHOTO_PRESETS.winter_photo,
        spring: PHOTO_PRESETS.spring_photo,
        summer: PHOTO_PRESETS.summer_photo,
        autumn: PHOTO_PRESETS.autumn_photo
      };

      const preset = seasonToPhoto[currentSeason] || PHOTO_PRESETS.tet_mai_photo;
      this._applyPhotoLayer(preset.url, preset.name);
      return;
    }

    // 7. Vector 2.5D SVG Parallax
    if (this.wallpaperMode === 'vector') {
      const currentSeason = (season && season !== 'none') ? season : this._getCurrentCalendarSeason();
      this.container.innerHTML = this._getScenerySVG(currentSeason);
      this._updateCaptionBadge('🎨 Tranh nghệ thuật Vector Parallax');
      document.body.classList.add('has-scenery');
      return;
    }

    // If season is explicitly none and no wallpaper chosen
    if (!season || season === 'none') {
      this.container.innerHTML = '';
      this._updateCaptionBadge('');
      document.body.classList.remove('has-scenery');
      return;
    }

    this.container.innerHTML = this._getScenerySVG(season);
  }

  _getScenerySVG(season) {
    switch (season) {
      case 'winter':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="winSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#070d18" />
                <stop offset="60%" stop-color="#111f38" />
                <stop offset="100%" stop-color="#1e3458" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#winSky)" />
            <g class="winter-stars" fill="#ffffff" opacity="0.8">
              <circle cx="150" cy="80" r="1.5" />
              <circle cx="340" cy="140" r="1" />
              <circle cx="580" cy="60" r="2" />
              <circle cx="820" cy="110" r="1.2" />
              <circle cx="1200" cy="90" r="1.8" />
              <circle cx="1540" cy="130" r="1.4" />
              <circle cx="1780" cy="70" r="2.2" />
            </g>
            <g id="layerDistant" class="parallax-layer" data-depth="0.08">
              <path d="M 0,650 L 320,380 L 680,680 L 1100,340 L 1520,620 L 1920,400 L 1920,1080 L 0,1080 Z" fill="#152642" />
              <path d="M 280,415 L 320,380 L 360,425 L 340,440 L 320,415 L 300,435 Z" fill="#ffffff" opacity="0.9" />
              <path d="M 1060,375 L 1100,340 L 1145,385 L 1125,405 L 1100,380 L 1080,395 Z" fill="#ffffff" opacity="0.9" />
            </g>
            <g id="layerMid" class="parallax-layer" data-depth="0.18">
              <path d="M 0,720 L 450,560 L 980,740 L 1480,540 L 1920,700 L 1920,1080 L 0,1080 Z" fill="#1a3254" />
            </g>
            <g id="layerFore" class="parallax-layer" data-depth="0.32">
              <path d="M 0,840 Q 480,780 960,860 T 1920,830 L 1920,1080 L 0,1080 Z" fill="#24426e" />
              <path d="M 0,900 Q 520,850 1020,920 T 1920,890 L 1920,1080 L 0,1080 Z" fill="#e8f1f8" />
            </g>
          </svg>
        `;

      case 'spring':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sprSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1a0c1e" />
                <stop offset="45%" stop-color="#3b1b36" />
                <stop offset="85%" stop-color="#6e2d4d" />
                <stop offset="100%" stop-color="#9d425f" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#sprSky)" />
            <circle cx="1450" cy="380" r="140" fill="#fdf2f4" opacity="0.85" filter="drop-shadow(0 0 35px rgba(253, 242, 244, 0.4))" />
            <g id="layerDistant" class="parallax-layer" data-depth="0.08">
              <path d="M 0,700 L 520,580 L 1050,720 L 1520,560 L 1920,680 L 1920,1080 L 0,1080 Z" fill="#301529" opacity="0.75" />
            </g>
            <g id="layerMid" class="parallax-layer" data-depth="0.18">
              <path d="M 0,820 Q 560,740 1120,840 T 1920,810 L 1920,1080 L 0,1080 Z" fill="#200d1c" />
            </g>
            <g id="layerFore" class="parallax-layer spring-branch-layer" data-depth="0.32">
              <path d="M 1920,0 Q 1550,120 1320,80 Q 1180,60 1060,140" stroke="#23121b" stroke-width="14" fill="none" stroke-linecap="round" />
            </g>
          </svg>
        `;

      case 'summer':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sumSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#040b17" />
                <stop offset="50%" stop-color="#0c2340" />
                <stop offset="100%" stop-color="#143e66" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#sumSky)" />
            <g id="layerDistant" class="parallax-layer" data-depth="0.06">
              <path d="M 0,780 Q 480,772 960,780 T 1920,776 L 1920,1080 L 0,1080 Z" fill="#081a2f" />
            </g>
            <g id="layerMid" class="parallax-layer" data-depth="0.16">
              <path d="M 0,860 Q 480,848 960,860 T 1920,854 L 1920,1080 L 0,1080 Z" fill="#0c2744" />
            </g>
            <g id="layerFore" class="parallax-layer" data-depth="0.28">
              <path d="M 0,940 Q 520,915 1020,945 T 1920,930 L 1920,1080 L 0,1080 Z" fill="#10365c" />
            </g>
          </svg>
        `;

      case 'autumn':
        return `
          <svg class="scenery-svg" id="scenerySVG" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="autSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1a0a06" />
                <stop offset="45%" stop-color="#3d180a" />
                <stop offset="85%" stop-color="#732f14" />
                <stop offset="100%" stop-color="#a8471c" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#autSky)" />
            <g id="layerDistant" class="parallax-layer" data-depth="0.08">
              <path d="M 0,690 L 460,540 L 980,710 L 1460,510 L 1920,660 L 1920,1080 L 0,1080 Z" fill="#2d130a" />
            </g>
            <g id="layerMid" class="parallax-layer" data-depth="0.18">
              <path d="M 0,790 Q 520,720 1040,810 T 1920,780 L 1920,1080 L 0,1080 Z" fill="#210c05" />
            </g>
            <g id="layerFore" class="parallax-layer" data-depth="0.32">
              <path d="M 0,900 Q 560,860 1120,920 T 1920,890 L 1920,1080 L 0,1080 Z" fill="#150702" />
            </g>
          </svg>
        `;

      default:
        return '';
    }
  }

  _initMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      this.targetMouseX = (e.clientX - centerX) / centerX;
      this.targetMouseY = (e.clientY - centerY) / centerY;
    });

    const animateParallax = () => {
      this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.05;
      this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.05;

      const layers = this.container.querySelectorAll('.parallax-layer');
      layers.forEach((layer) => {
        const depth = parseFloat(layer.getAttribute('data-depth')) || 0.1;
        const moveX = this.currentMouseX * depth * 40;
        const moveY = this.currentMouseY * depth * 25;
        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });

      this.rafId = requestAnimationFrame(animateParallax);
    };

    animateParallax();
  }
}
