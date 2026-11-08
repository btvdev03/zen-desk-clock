/**
 * ZenDesk Clock - Real-Time Weather Widget
 * Open-Meteo API (Free, zero API key required)
 * Features:
 * - GPS Geolocation with IP Fallback (ipwho.is / ipapi.co) & Hanoi default (21.0285, 105.8542)
 * - WMO Weather Code Vietnamese mapping with day/night dynamic icons
 * - 15-Minute LocalStorage caching to avoid API rate limits & instant loading
 * - Top Bar Chip integration & Interactive Glassmorphism Detailed Modal
 * - Current Apparent Temp, Humidity, Wind Speed, 5-Day Forecast & City Presets
 */

export const WMO_WEATHER_MAP = {
  0: { label: 'Trời quang', icon: '☀️', nightIcon: '🌙', desc: 'Trời trong xanh quang đãng' },
  1: { label: 'Ít mây', icon: '🌤️', nightIcon: '🌤️', desc: 'Chủ yếu quang mây' },
  2: { label: 'Mây rải rác', icon: '⛅', nightIcon: '⛅', desc: 'Mây che phủ từng phần' },
  3: { label: 'Nhiều mây', icon: '☁️', nightIcon: '☁️', desc: 'Trời u ám nhiều mây' },
  45: { label: 'Sương mù', icon: '🌫️', nightIcon: '🌫️', desc: 'Sương mù tầm nhìn hạn chế' },
  48: { label: 'Sương muối', icon: '🌫️', nightIcon: '🌫️', desc: 'Sương muối buốt giá' },
  51: { label: 'Mưa phùn nhẹ', icon: '🌦️', nightIcon: '🌦️', desc: 'Mưa phùn lất phất' },
  53: { label: 'Mưa phùn vừa', icon: '🌦️', nightIcon: '🌦️', desc: 'Mưa phùn hạt nhỏ đều' },
  55: { label: 'Mưa phùn dầy', icon: '🌧️', nightIcon: '🌧️', desc: 'Mưa phùn dày hạt' },
  56: { label: 'Mưa phùn lạnh', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa phùn lạnh buốt giá' },
  57: { label: 'Mưa phùn băng', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa phùn đóng băng' },
  61: { label: 'Mưa rào nhẹ', icon: '🌦️', nightIcon: '🌦️', desc: 'Mưa rào hạt nhỏ' },
  63: { label: 'Mưa vừa', icon: '🌧️', nightIcon: '🌧️', desc: 'Mưa rào đều hạt' },
  65: { label: 'Mưa to xối xả', icon: '🌧️', nightIcon: '🌧️', desc: 'Mưa rất to xối xả' },
  66: { label: 'Mưa đá nhẹ', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa lạnh buốt giá' },
  67: { label: 'Mưa đá lớn', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa đá dầy hạt' },
  71: { label: 'Tuyết nhẹ', icon: '❄️', nightIcon: '❄️', desc: 'Bông tuyết bay nhẹ' },
  73: { label: 'Tuyết vừa', icon: '❄️', nightIcon: '❄️', desc: 'Tuyết rơi đều đặn' },
  75: { label: 'Bão tuyết to', icon: '❄️', nightIcon: '❄️', desc: 'Tuyết rơi dày đặc' },
  77: { label: 'Hạt tuyết', icon: '❄️', nightIcon: '❄️', desc: 'Mưa lẫn hạt tuyết' },
  80: { label: 'Mưa rào ngắt quãng', icon: '🌦️', nightIcon: '🌦️', desc: 'Mưa rào rải rác từng cơn' },
  81: { label: 'Mưa rào diện rộng', icon: '🌧️', nightIcon: '🌧️', desc: 'Mưa rào liên tục' },
  82: { label: 'Mưa rào dữ dội', icon: '⛈️', nightIcon: '⛈️', desc: 'Mưa như trút nước' },
  85: { label: 'Mưa tuyết nhẹ', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa rào lẫn tuyết nhỏ' },
  86: { label: 'Mưa tuyết dày', icon: '🌨️', nightIcon: '🌨️', desc: 'Mưa tuyết rào dày' },
  95: { label: 'Mưa dông sấm sét', icon: '⛈️', nightIcon: '⛈️', desc: 'Dông bão kèm theo sấm sét' },
  96: { label: 'Dông mưa đá nhẹ', icon: '⛈️', nightIcon: '⛈️', desc: 'Sấm sét dông kèm mưa đá' },
  99: { label: 'Dông bão đá cực mạnh', icon: '⛈️', nightIcon: '⛈️', desc: 'Dông bão dữ dội mưa đá lớn' }
};

export const QUICK_CITIES = [
  { id: 'auto', name: '📍 Tự động (GPS/IP)', isAuto: true },
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'paris', name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { id: 'newyork', name: 'New York', lat: 40.7128, lon: -74.0060 }
];

export class WeatherWidget {
  constructor(options = {}) {
    this.storageCacheKey = options.storageCacheKey || 'zd_weather_cache_v1';
    this.storageLocationKey = options.storageLocationKey || 'zd_weather_location_v1';
    this.cacheTtl = options.cacheTtl || 15 * 60 * 1000; // 15 mins TTL
    this.defaultLocation = {
      lat: 21.0285,
      lon: 105.8542,
      city: 'Hà Nội',
      isAuto: true
    };

    this.currentLocation = null;
    this.weatherData = null;
    this.isLoading = false;
    this.isOpen = false;
    this.initialized = false;

    // DOM references
    this.chipEl = null;
    this.modalEl = null;
    this.chipIconEl = null;
    this.chipTempEl = null;
    this.chipCityEl = null;
  }

  /**
   * Initializes the widget: injects/binds DOM elements, attaches events, and loads weather.
   */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    this._ensureDOM();
    this._bindEvents();

    // Load saved or auto location
    this.currentLocation = this._getSavedLocation();

    // Fetch and render
    try {
      await this.fetchWeather(false);
    } catch (e) {
      console.warn('WeatherWidget initial load caught:', e);
    }

    // Periodically update weather every 15 minutes in background
    setInterval(() => {
      this.fetchWeather(false).catch(e => console.warn('Background weather update caught:', e));
    }, this.cacheTtl);
  }

  /**
   * Ensures that Top Bar Chip and Modal HTML elements exist in the document.
   * If not already present in the HTML, dynamically injects them.
   */
  _ensureDOM() {
    // 1. Top Bar Chip
    let chip = document.getElementById('weatherChip');
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'weatherChip';
      chip.className = 'top-bar-chip weather-chip';
      chip.title = 'Xem thông tin thời tiết & nhiệt độ chi tiết';
      chip.setAttribute('aria-label', 'Thời tiết hiện tại');
      chip.innerHTML = `
        <span class="weather-chip-icon" id="weatherChipIcon">🌤️</span>
        <span class="weather-chip-temp" id="weatherChipTemp">--°C</span>
        <span class="weather-chip-city" id="weatherChipCity">Hà Nội</span>
      `;

      // Try inserting into .top-bar-left or .top-bar-right
      const topBarLeft = document.querySelector('.top-bar-left');
      if (topBarLeft) {
        topBarLeft.appendChild(chip);
      } else {
        const topBarRight = document.querySelector('.top-bar-right');
        if (topBarRight) {
          topBarRight.insertBefore(chip, topBarRight.firstChild);
        } else {
          document.body.appendChild(chip);
        }
      }
    }

    this.chipEl = chip;
    this.chipIconEl = document.getElementById('weatherChipIcon') || chip.querySelector('.weather-chip-icon');
    this.chipTempEl = document.getElementById('weatherChipTemp') || chip.querySelector('.weather-chip-temp');
    this.chipConditionEl = document.getElementById('weatherChipCondition') || chip.querySelector('.weather-chip-condition');
    this.chipCityEl = document.getElementById('weatherChipCity') || chip.querySelector('.weather-chip-city');

    // 2. Weather Details Modal Overlay
    let modal = document.getElementById('weatherModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'weatherModal';
      modal.className = 'weather-modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Chi tiết thời tiết');
      modal.innerHTML = `
        <div class="weather-modal-card">
          <div class="weather-modal-header">
            <div class="weather-modal-title-group">
              <span class="weather-modal-title-icon" id="wmHeaderIcon">🌤️</span>
              <div class="weather-modal-heading">
                <span>Thời Tiết & Khí Hậu</span>
                <div class="weather-modal-subtitle">
                  <span>📍</span>
                  <span class="weather-location-badge" id="wmLocationBadge">Hà Nội</span>
                  <span>•</span>
                  <span id="wmUpdateTime">Đang tải...</span>
                </div>
              </div>
            </div>
            <div class="weather-header-actions">
              <button class="weather-action-btn weather-refresh-btn" id="wmRefreshBtn" title="Làm mới dữ liệu thời tiết">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
              <button class="weather-action-btn weather-close-btn" id="wmCloseBtn" title="Đóng (Esc)">&times;</button>
            </div>
          </div>

          <div class="weather-modal-body">
            <!-- Hero Weather Current -->
            <div class="weather-hero-card" id="wmHeroCard">
              <div class="weather-hero-left">
                <div class="weather-hero-temp-row">
                  <span class="weather-hero-temp" id="wmHeroTemp">--</span>
                  <span class="weather-hero-unit">°C</span>
                </div>
                <div class="weather-hero-condition" id="wmHeroCondition">Đang lấy dữ liệu...</div>
                <div class="weather-hero-range" id="wmHeroRange">
                  <span>▲ Cao: <span class="weather-range-high" id="wmHighTemp">--°</span></span>
                  <span>▼ Thấp: <span class="weather-range-low" id="wmLowTemp">--°</span></span>
                </div>
              </div>
              <div class="weather-hero-right">
                <div class="weather-hero-big-icon" id="wmHeroIcon">🌤️</div>
              </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="weather-metrics-grid">
              <div class="weather-metric-card">
                <div class="weather-metric-label">🌡️ Cảm nhận</div>
                <div class="weather-metric-value" id="wmMetricApparent">--°C</div>
                <div class="weather-metric-desc" id="wmMetricApparentDesc">Nhiệt độ thực</div>
              </div>
              <div class="weather-metric-card">
                <div class="weather-metric-label">💧 Độ ẩm</div>
                <div class="weather-metric-value" id="wmMetricHumidity">--%</div>
                <div class="weather-metric-desc" id="wmMetricHumidityDesc">Độ ẩm tương đối</div>
              </div>
              <div class="weather-metric-card">
                <div class="weather-metric-label">💨 Tốc độ gió</div>
                <div class="weather-metric-value" id="wmMetricWind">-- km/h</div>
                <div class="weather-metric-desc" id="wmMetricWindDesc">Tốc độ gió 10m</div>
              </div>
              <div class="weather-metric-card">
                <div class="weather-metric-label">🌐 Trạng thái</div>
                <div class="weather-metric-value" id="wmMetricStatus" style="font-size: 0.95rem;">--</div>
                <div class="weather-metric-desc" id="wmMetricStatusDesc">Mã WMO</div>
              </div>
            </div>

            <!-- 5-Day Forecast -->
            <div class="weather-forecast-container">
              <div class="weather-section-title">
                <span>📅 Dự Báo 5 Ngày Tới</span>
              </div>
              <div class="weather-forecast-list" id="wmForecastList">
                <!-- Injected via JavaScript -->
              </div>
            </div>

            <!-- Quick City Selector -->
            <div class="weather-city-selector-wrap">
              <div class="weather-section-title">
                <span>🌍 Đổi Thành Phố Nhanh</span>
              </div>
              <div class="weather-city-chips-scroll" id="wmCityChips">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Footer Note -->
            <div class="weather-modal-footer">
              <span>Dữ liệu thời gian thực bởi <a href="https://open-meteo.com/" target="_blank" rel="noopener" class="weather-footer-link">Open-Meteo</a> (Không quảng cáo, không khóa API)</span>
              <span id="wmTtlInfo">Tự cập nhật 15p</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    this.modalEl = modal;
  }

  /**
   * Attaches event listeners for chip clicks, modal actions, and keyboard shortcuts.
   */
  _bindEvents() {
    if (this.chipEl) {
      this.chipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal();
      });
    }

    const closeBtn = document.getElementById('wmCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    const refreshBtn = document.getElementById('wmRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (this.isLoading) return;
        const startT = Date.now();
        this._setLoadingState(true);
        try {
          await this.fetchWeather(true);
        } catch (err) {
          console.warn('Weather refresh failed:', err);
        } finally {
          const elapsed = Date.now() - startT;
          const minSpin = 650; // Smooth visual rotation feedback
          if (elapsed < minSpin) {
            setTimeout(() => {
              this._setLoadingState(false);
            }, minSpin - elapsed);
          } else {
            this._setLoadingState(false);
          }
        }
      });
    }

    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.closeModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key && e.key.toLowerCase() === 'escape' && this.isOpen) {
        this.closeModal();
      }
    });

    this._renderCityChips();
  }

  /**
   * Renders the horizontal city switcher chips.
   */
  _renderCityChips() {
    const container = document.getElementById('wmCityChips');
    if (!container) return;

    container.innerHTML = '';
    const currentCity = this.currentLocation ? this.currentLocation.city : 'Hà Nội';
    const isAuto = this.currentLocation ? this.currentLocation.isAuto : true;

    QUICK_CITIES.forEach((item) => {
      const chip = document.createElement('button');
      chip.className = 'weather-city-chip';
      if (item.isAuto && isAuto) {
        chip.classList.add('active');
      } else if (!item.isAuto && !isAuto && item.name.toLowerCase() === currentCity.toLowerCase()) {
        chip.classList.add('active');
      }

      chip.textContent = item.name;
      chip.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          if (item.isAuto) {
            localStorage.removeItem(this.storageLocationKey);
            this.currentLocation = await this.getUserCoordinates();
          } else {
            this.currentLocation = {
              lat: item.lat,
              lon: item.lon,
              city: item.name,
              isAuto: false
            };
            this._saveLocation(this.currentLocation);
          }
          this._renderCityChips();
          await this.fetchWeather(true);
        } catch (err) {
          console.warn('Weather city switch caught error:', err);
        }
      });

      container.appendChild(chip);
    });
  }

  /**
   * Resolves coordinates:
   * 1. Check navigator.geolocation
   * 2. Fallback to IP Geolocation (ipwho.is -> ipapi.co)
   * 3. Fallback to Hanoi default
   */
  async getUserCoordinates() {
    const saved = this._getSavedLocation();
    if (saved && !saved.isAuto) {
      return saved;
    }

    // 1. Try Browser Geolocation
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 300000,
            enableHighAccuracy: false
          });
        });

        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        const cityName = await this._reverseGeocode(lat, lon);

        const loc = {
          lat,
          lon,
          city: cityName || 'Vị trí hiện tại',
          isAuto: true
        };
        this._saveLocation(loc);
        return loc;
      } catch (err) {
        console.warn('WeatherWidget: Geolocation unavailable or denied, falling back to IP detection.', err?.message || err);
      }
    }

    // 2. Fallback to IP Geolocation
    try {
      const ipLoc = await this._fetchLocationByIp();
      if (ipLoc) {
        this._saveLocation(ipLoc);
        return ipLoc;
      }
    } catch (ipErr) {
      console.warn('WeatherWidget: IP Geolocation failed, using default Hanoi.', ipErr);
    }

    // 3. Fallback to default Hanoi
    return { ...this.defaultLocation };
  }

  /**
   * Reverse geocodes coordinates to a friendly Vietnamese location name.
   */
  async _reverseGeocode(lat, lon) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`,
        { signal: ctrl.signal }
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        return data.city || data.locality || data.principalSubdivision || null;
      }
    } catch (e) {
      // ignore lookup error
    }
    return null;
  }

  /**
   * Attempts to determine user location from IP address.
   */
  async _fetchLocationByIp() {
    // Attempt 1: ipwho.is (fast, generous free tier)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.latitude && data.longitude) {
          return {
            lat: parseFloat(data.latitude.toFixed(4)),
            lon: parseFloat(data.longitude.toFixed(4)),
            city: data.city || data.region || 'Vị trí mạng',
            isAuto: true
          };
        }
      }
    } catch (e) {
      // fallback
    }

    // Attempt 2: ipapi.co
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.latitude && data.longitude) {
          return {
            lat: parseFloat(data.latitude.toFixed(4)),
            lon: parseFloat(data.longitude.toFixed(4)),
            city: data.city || data.region || 'Vị trí mạng',
            isAuto: true
          };
        }
      }
    } catch (e) {
      // fallback
    }

    return null;
  }

  /**
   * Fetches weather data from Open-Meteo. Uses local cache if within TTL.
   * @param {boolean} forceRefresh - If true, ignores cache and requests fresh API data.
   */
  async fetchWeather(forceRefresh = false) {
    if (this.isLoading) return;

    // Check cache
    if (!forceRefresh) {
      const cached = this._getCache();
      if (cached && (Date.now() - cached.timestamp < this.cacheTtl)) {
        this.currentLocation = cached.location;
        this.weatherData = cached.weather;
        this.render();
        return this.weatherData;
      }
    }

    this.isLoading = true;
    this._setLoadingState(true);

    try {
      if (!this.currentLocation) {
        this.currentLocation = await this.getUserCoordinates();
      }

      const { lat, lon } = this.currentLocation;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP error: ${res.status}`);
      }

      const data = await res.json();
      this.weatherData = data;

      // Save to localStorage cache
      this._setCache({
        timestamp: Date.now(),
        location: this.currentLocation,
        weather: data
      });

      this.render();
      return this.weatherData;
    } catch (err) {
      console.warn('WeatherWidget fetchWeather caught error:', err);
      // If error occurred but we have stale cache, keep showing it
      const stale = this._getCache();
      if (stale && stale.weather) {
        this.currentLocation = stale.location;
        this.weatherData = stale.weather;
        this.render();
        const updateTime = document.getElementById('wmUpdateTime');
        if (updateTime) {
          updateTime.textContent = 'Dữ liệu đã lưu (Ngoại tuyến)';
        }
      } else {
        this._renderError(err?.message || 'Không thể kết nối máy chủ thời tiết');
      }
    } finally {
      this.isLoading = false;
      this._setLoadingState(false);
    }
  }

  /**
   * Helper to retrieve weather code metadata (Vietnamese label, icon, description).
   */
  /**
   * Return clean minimalist vector SVG for weather conditions
   */
  getWeatherSvg(code, isDay = 1, size = 15) {
    let p = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>'; // cloud default
    if (!isDay && (code === 0 || code === 1)) {
      p = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else if (code === 0) {
      p = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
    } else if (code === 1 || code === 2) {
      p = '<path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2"/><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>';
    } else if (code >= 51 && code <= 67) {
      p = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><line x1="8" y1="19" x2="6" y2="22"/><line x1="12" y1="19" x2="10" y2="22"/><line x1="16" y1="19" x2="14" y2="22"/>';
    } else if (code >= 71 && code <= 86) {
      p = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><circle cx="8" cy="21" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="16" cy="21" r="1"/>';
    } else if (code >= 95) {
      p = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><polygon points="13 14 10 18 13 18 11 22 16 16 13 16 15 14"/>';
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  }

  getWeatherMeta(code, isDay = 1) {
    const meta = WMO_WEATHER_MAP[code] || {
      label: 'Thời tiết ổn định',
      icon: '🌤️',
      nightIcon: '🌙',
      desc: 'Điều kiện thời tiết bình thường'
    };

    let label = meta.label;
    if (code === 0) {
      label = isDay ? 'Nắng ráo' : 'Trời quang';
    }

    const icon = (!isDay && meta.nightIcon) ? meta.nightIcon : meta.icon;
    return {
      ...meta,
      label,
      icon
    };
  }

  /**
   * Renders both the Top Bar Chip and the Details Modal with current weatherData.
   */
  render() {
    if (!this.weatherData || !this.weatherData.current) return;

    this._renderChip();
    this._renderModal();
  }

  /**
   * Updates Top Bar Chip display.
   */
  _renderChip() {
    if (!this.chipEl || !this.weatherData) return;

    const current = this.weatherData.current;
    const isDay = current.is_day !== undefined ? current.is_day : 1;
    const meta = this.getWeatherMeta(current.weather_code, isDay);
    const tempRounded = Math.round(current.temperature_2m);
    const rawCity = this.currentLocation ? this.currentLocation.city : 'Hà Nội';
    const shortCity = rawCity.replace(/^Thành phố\s+/i, 'TP. ').replace(/Hồ Chí Minh/i, 'HCM');

    const svgEl = document.getElementById('weatherChipSvg');
    if (svgEl) {
      svgEl.innerHTML = this.getWeatherSvg(current.weather_code, isDay, 15).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    } else if (this.chipIconEl) {
      this.chipIconEl.innerHTML = this.getWeatherSvg(current.weather_code, isDay, 15);
    }
    if (this.chipTempEl) this.chipTempEl.textContent = `${tempRounded}°C`;
    if (this.chipConditionEl) {
      this.chipConditionEl.textContent = meta.label;
    }
    if (this.chipCityEl) {
      this.chipCityEl.textContent = shortCity;
    }

    this.chipEl.title = `${rawCity}: ${meta.label}, ${tempRounded}°C (Cảm nhận ${Math.round(current.apparent_temperature)}°C). Nhấp để xem dự báo 5 ngày chi tiết.`;
  }

  /**
   * Updates Modal content display with rich metrics and 5-day forecast.
   */
  _renderModal() {
    if (!this.modalEl || !this.weatherData) return;

    const current = this.weatherData.current;
    const daily = this.weatherData.daily;
    const isDay = current.is_day !== undefined ? current.is_day : 1;
    const meta = this.getWeatherMeta(current.weather_code, isDay);
    const city = this.currentLocation ? this.currentLocation.city : 'Hà Nội';

    // Header info
    const locationBadge = document.getElementById('wmLocationBadge');
    if (locationBadge) locationBadge.textContent = city;

    const headerIcon = document.getElementById('wmHeaderIcon');
    if (headerIcon) headerIcon.textContent = meta.icon;

    const updateTime = document.getElementById('wmUpdateTime');
    if (updateTime) {
      const now = new Date();
      updateTime.textContent = `Cập nhật lúc ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // Hero section
    const heroTemp = document.getElementById('wmHeroTemp');
    if (heroTemp) heroTemp.textContent = Math.round(current.temperature_2m);

    const heroIcon = document.getElementById('wmHeroIcon');
    if (heroIcon) heroIcon.textContent = meta.icon;

    const heroCondition = document.getElementById('wmHeroCondition');
    if (heroCondition) heroCondition.textContent = meta.label;

    if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
      const highEl = document.getElementById('wmHighTemp');
      const lowEl = document.getElementById('wmLowTemp');
      if (highEl) highEl.textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
      if (lowEl) lowEl.textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
    }

    // Key metrics
    const appTemp = current.apparent_temperature;
    const metricApparent = document.getElementById('wmMetricApparent');
    const metricApparentDesc = document.getElementById('wmMetricApparentDesc');
    if (metricApparent) metricApparent.textContent = `${appTemp.toFixed(1)}°C`;
    if (metricApparentDesc) {
      const diff = appTemp - current.temperature_2m;
      if (diff > 1.5) metricApparentDesc.textContent = 'Cảm giác nóng hơn';
      else if (diff < -1.5) metricApparentDesc.textContent = 'Cảm giác lạnh hơn';
      else metricApparentDesc.textContent = 'Gần tương đương nhiệt độ';
    }

    const humidity = current.relative_humidity_2m;
    const metricHumidity = document.getElementById('wmMetricHumidity');
    const metricHumidityDesc = document.getElementById('wmMetricHumidityDesc');
    if (metricHumidity) metricHumidity.textContent = `${humidity}%`;
    if (metricHumidityDesc) {
      if (humidity > 85) metricHumidityDesc.textContent = 'Rất ẩm ướt';
      else if (humidity > 65) metricHumidityDesc.textContent = 'Độ ẩm cao';
      else if (humidity > 40) metricHumidityDesc.textContent = 'Thoáng đãng, dễ chịu';
      else metricHumidityDesc.textContent = 'Khô hanh';
    }

    const wind = current.wind_speed_10m;
    const metricWind = document.getElementById('wmMetricWind');
    const metricWindDesc = document.getElementById('wmMetricWindDesc');
    if (metricWind) metricWind.textContent = `${wind.toFixed(1)} km/h`;
    if (metricWindDesc) {
      if (wind < 5) metricWindDesc.textContent = 'Gió lặng';
      else if (wind < 20) metricWindDesc.textContent = 'Gió nhẹ hiu hiu';
      else if (wind < 40) metricWindDesc.textContent = 'Gió thổi vừa';
      else metricWindDesc.textContent = 'Gió mạnh';
    }

    const metricStatus = document.getElementById('wmMetricStatus');
    const metricStatusDesc = document.getElementById('wmMetricStatusDesc');
    if (metricStatus) metricStatus.textContent = meta.label;
    if (metricStatusDesc) metricStatusDesc.textContent = meta.desc;

    // 5-Day Forecast List
    this._renderForecastList(daily);
  }

  /**
   * Renders the 5-day forecast with proportional temperature range bars.
   */
  _renderForecastList(daily) {
    const listEl = document.getElementById('wmForecastList');
    if (!listEl || !daily || !daily.time) return;

    listEl.innerHTML = '';
    const dayCount = Math.min(5, daily.time.length);

    // Calculate global range across the 5 days for the relative bar
    const sliceMin = daily.temperature_2m_min.slice(0, dayCount);
    const sliceMax = daily.temperature_2m_max.slice(0, dayCount);
    const globalMin = Math.min(...sliceMin);
    const globalMax = Math.max(...sliceMax);
    const range = Math.max(1, globalMax - globalMin);

    for (let i = 0; i < dayCount; i++) {
      const dateStr = daily.time[i];
      const code = daily.weather_code[i];
      const minTemp = daily.temperature_2m_min[i];
      const maxTemp = daily.temperature_2m_max[i];
      const meta = this.getWeatherMeta(code, 1);

      let dayLabel = 'Hôm nay';
      if (i === 1) dayLabel = 'Ngày mai';
      else if (i > 1) {
        const d = new Date(dateStr);
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayOfWeek = days[d.getDay()];
        const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        dayLabel = `${dayOfWeek}, ${dateFormatted}`;
      }

      const leftPercent = Math.max(0, Math.min(92, ((minTemp - globalMin) / range) * 100));
      const widthPercent = Math.max(8, Math.min(100 - leftPercent, ((maxTemp - minTemp) / range) * 100));

      const row = document.createElement('div');
      row.className = 'weather-forecast-item';
      row.innerHTML = `
        <span class="weather-forecast-day">${dayLabel}</span>
        <div class="weather-forecast-cond" title="${meta.desc}">
          <span class="weather-forecast-icon">${meta.icon}</span>
          <span>${meta.label}</span>
        </div>
        <div class="weather-forecast-bar-wrap">
          <span class="weather-temp-min">${Math.round(minTemp)}°</span>
          <div class="weather-temp-bar-bg">
            <div class="weather-temp-bar-fill" style="left: ${leftPercent.toFixed(1)}%; width: ${widthPercent.toFixed(1)}%;"></div>
          </div>
          <span class="weather-temp-max">${Math.round(maxTemp)}°</span>
        </div>
      `;
      listEl.appendChild(row);
    }
  }

  /**
   * Sets loading animation states on chip and modal refresh button.
   */
  _setLoadingState(loading) {
    if (this.chipEl) {
      if (loading) this.chipEl.classList.add('is-loading');
      else this.chipEl.classList.remove('is-loading');
    }
    const refreshBtn = document.getElementById('wmRefreshBtn');
    if (refreshBtn) {
      if (loading) refreshBtn.classList.add('spinning');
      else refreshBtn.classList.remove('spinning');
    }
  }

  /**
   * Renders an error state in the chip and modal gracefully with fallback UI.
   */
  _renderError(message) {
    const msgStr = String(message || '');
    const isOffline = !navigator.onLine || msgStr.includes('Failed to fetch') || msgStr.includes('network') || msgStr.includes('CORS');
    const displayMsg = isOffline ? 'Mất kết nối mạng' : 'Không có dữ liệu';

    if (this.chipTempEl) this.chipTempEl.textContent = '--°C';
    if (this.chipIconEl) this.chipIconEl.textContent = '☁️';
    if (this.chipCityEl && !this.chipCityEl.textContent) {
      this.chipCityEl.textContent = this.currentLocation ? this.currentLocation.city : 'Hà Nội';
    }
    if (this.chipEl) this.chipEl.title = `Thời tiết: ${displayMsg}. Bấm để làm mới.`;

    const heroTemp = document.getElementById('wmHeroTemp');
    if (heroTemp) heroTemp.textContent = '--';

    const heroIcon = document.getElementById('wmHeroIcon');
    if (heroIcon) heroIcon.textContent = '☁️';

    const heroCondition = document.getElementById('wmHeroCondition');
    if (heroCondition) heroCondition.textContent = `${displayMsg} (Nhấp nút làm mới ↻)`;

    const updateTime = document.getElementById('wmUpdateTime');
    if (updateTime) updateTime.textContent = 'Chưa thể cập nhật';

    const metricStatus = document.getElementById('wmMetricStatus');
    if (metricStatus) metricStatus.textContent = 'Ngoại tuyến';

    const metricStatusDesc = document.getElementById('wmMetricStatusDesc');
    if (metricStatusDesc) metricStatusDesc.textContent = 'Kiểm tra Wi-Fi / 4G';

    const listEl = document.getElementById('wmForecastList');
    if (listEl && !listEl.children.length) {
      listEl.innerHTML = `<div class="weather-error-hint" style="text-align: center; color: #94a3b8; font-size: 0.84rem; padding: 1.5rem 0.5rem; line-height: 1.5;">Không thể kết nối máy chủ thời tiết.<br>Vui lòng kiểm tra kết nối mạng và nhấn nút làm mới ↻ góc trên.</div>`;
    }
  }

  /**
   * Opens the Weather Details Modal with smooth transition and accessibility state.
   */
  openModal() {
    if (!this.modalEl) return;
    document.body.classList.remove('idle');
    this.modalEl.classList.add('open');
    this.modalEl.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    if (window.zenModalManager) {
      window.zenModalManager.push('weatherModal', () => this.closeModal());
    }
    this._renderCityChips();
  }

  /**
   * Closes the Weather Details Modal smoothly.
   */
  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    if (window.zenModalManager) {
      window.zenModalManager.remove('weatherModal');
    }
  }

  /**
   * Toggles modal open/closed state.
   */
  toggleModal() {
    if (this.isOpen) this.closeModal();
    else this.openModal();
  }

  /**
   * LocalStorage Cache helpers
   */
  _getCache() {
    try {
      const raw = localStorage.getItem(this.storageCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  _setCache(data) {
    try {
      localStorage.setItem(this.storageCacheKey, JSON.stringify(data));
    } catch (e) {
      // quota exceeded or private browsing
    }
  }

  _getSavedLocation() {
    try {
      const raw = localStorage.getItem(this.storageLocationKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  _saveLocation(loc) {
    try {
      localStorage.setItem(this.storageLocationKey, JSON.stringify(loc));
    } catch (e) {
      // ignore
    }
  }
}

// Singleton Instance
export const weatherWidget = new WeatherWidget();
export default weatherWidget;

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  window.weatherWidget = weatherWidget;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => weatherWidget.init());
  } else {
    weatherWidget.init();
  }
}
