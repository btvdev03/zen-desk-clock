/**
 * ZenDesk Clock - Ambient Multi-Sound Mixer & Binaural Beats Controller
 *
 * Features:
 *  - Multi-track procedural sound mixing with independent channel volume controls
 *  - True stereo Binaural Beats brainwave generator (Alpha 10Hz, Theta 6Hz, Gamma 40Hz)
 *  - Sleep Timer with smooth 30s auto-fadeout (15m, 30m, 45m, 60m, Off)
 *  - Built-in Curated Presets: "Cà phê ngày mưa", "Rừng đêm tĩnh lặng", "Sóng biển hoàng hôn", "Tập trung tuyệt đối"
 *  - Custom user preset creation, saving, and deletion to LocalStorage
 *  - Luxury Glassmorphic responsive modal & equalizer soundwave animations
 *  - Zero dependency on external audio files - 100% Web Audio API
 */

import { soundEngine } from './audio-synth.js';

export const TRACKS_CONFIG = [
  {
    id: 'rain',
    name: 'Mưa Rào',
    icon: '🌧️',
    desc: 'Mưa rào êm ả, hạt nước rơi tí tách',
    category: 'nature',
    defaultVol: 0.60
  },
  {
    id: 'fire',
    name: 'Lửa Trại',
    icon: '🔥',
    desc: 'Lửa sưởi bập bùng, tiếng nổ lép bép ấm áp',
    category: 'nature',
    defaultVol: 0.50
  },
  {
    id: 'ocean',
    name: 'Sóng Biển',
    icon: '🌊',
    desc: 'Sóng vỗ bờ dào dạt theo chu kỳ thở 10 giây',
    category: 'nature',
    defaultVol: 0.60
  },
  {
    id: 'crickets',
    name: 'Dế Đêm Mùa Hạ',
    icon: '🦗',
    desc: 'Tiếng dế râm ran đồng quê đêm hè thanh bình',
    category: 'nature',
    defaultVol: 0.40
  },
  {
    id: 'birds',
    name: 'Chim Ban Mai',
    icon: '🐦',
    desc: 'Tiếng chim rừng líu lo trong trẻo ban sớm',
    category: 'nature',
    defaultVol: 0.35
  },
  {
    id: 'cafe',
    name: 'Quán Cà Phê',
    icon: '☕',
    desc: 'Không gian ấm cúng, tiếng thìa gõ tách và hơi nước',
    category: 'ambient',
    defaultVol: 0.45
  },
  {
    id: 'binaural',
    name: 'Sóng Não Binaural',
    icon: '🧠',
    desc: 'Cộng hưởng tần số sóng não stereo hai tai',
    category: 'brainwave',
    defaultVol: 0.35,
    isBinaural: true
  },
  {
    id: 'brown',
    name: 'Nhiễu Nâu (Brown)',
    icon: '🪵',
    desc: 'Âm trầm sâu khử tạp âm văn phòng, thư giãn sâu',
    category: 'noise',
    defaultVol: 0.50
  },
  {
    id: 'pink',
    name: 'Nhiễu Hồng (Pink)',
    icon: '🌸',
    desc: 'Cân bằng các dải tần, dễ ngủ & đọc sách tập trung',
    category: 'noise',
    defaultVol: 0.40
  },
  {
    id: 'white',
    name: 'Nhiễu Trắng (White)',
    icon: '📻',
    desc: 'Dải tần đồng đều che lấp tiếng ồn ngoại cảnh',
    category: 'noise',
    defaultVol: 0.30
  }
];

export const BUILTIN_PRESETS = [
  {
    id: 'rain_cafe',
    name: 'Cà phê ngày mưa',
    icon: '☕',
    description: 'Mưa rào bên ngoài quán cafe ấm áp',
    tracks: {
      rain: 0.60,
      cafe: 0.40
    }
  },
  {
    id: 'quiet_forest',
    name: 'Rừng đêm tĩnh lặng',
    icon: '🌲',
    description: 'Lửa trại ấm cúng, tiếng dế đêm & sóng não Alpha',
    tracks: {
      fire: 0.50,
      crickets: 0.40,
      binaural: 0.30
    },
    binauralMode: 'alpha'
  },
  {
    id: 'ocean_sunset',
    name: 'Sóng biển hoàng hôn',
    icon: '🌅',
    description: 'Sóng biển vỗ bờ êm ả cùng tiếng chim phương xa',
    tracks: {
      ocean: 0.70,
      birds: 0.25
    }
  },
  {
    id: 'deep_focus',
    name: 'Tập trung tuyệt đối',
    icon: '🧠',
    description: 'Nhiễu nâu trầm khử ồn kết hợp sóng não Alpha 10Hz',
    tracks: {
      brown: 0.50,
      binaural: 0.40
    },
    binauralMode: 'alpha'
  },
  {
    id: 'zen_meditation',
    name: 'Thiền định sâu lắng',
    icon: '🧘',
    description: 'Sóng não Theta 6Hz kết hợp tiếng sóng biển êm dịu',
    tracks: {
      binaural: 0.45,
      ocean: 0.45
    },
    binauralMode: 'theta'
  }
];

const STORAGE_KEY = 'zendesk_sound_mixer_state_v1';
const CUSTOM_PRESETS_KEY = 'zendesk_sound_mixer_custom_presets_v1';

export class SoundMixerController {
  constructor(synth = soundEngine) {
    this.synth = synth;
    this.modalEl = null;
    this.isOpen = false;
    this.activePresetId = null;
    this.sleepTimerMinutes = 0; // 0 = off

    // Channel state cache
    this.channels = {};
    TRACKS_CONFIG.forEach(t => {
      this.channels[t.id] = {
        enabled: false,
        volume: t.defaultVol
      };
    });

    this.customPresets = [];
    this.loadPersistedState();
  }

  /**
   * Load saved settings and custom presets from localStorage
   */
  loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.channels) {
          Object.keys(parsed.channels).forEach(id => {
            if (this.channels[id]) {
              this.channels[id].volume = parsed.channels[id].volume ?? this.channels[id].volume;
            }
          });
        }
        if (typeof parsed.masterVolume === 'number') {
          this.synth.setVolume(parsed.masterVolume);
        }
        if (parsed.binauralMode) {
          this.synth.setBinauralBeat(parsed.binauralMode);
        }
      }

      const savedPresets = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (savedPresets) {
        this.customPresets = JSON.parse(savedPresets);
      }
    } catch (e) {
      console.warn('[SoundMixer] Failed to load state from localStorage:', e);
    }
  }

  savePersistedState() {
    try {
      const state = {
        masterVolume: this.synth.getVolume(),
        binauralMode: this.synth.binauralMode,
        channels: {}
      };
      Object.keys(this.channels).forEach(id => {
        state.channels[id] = {
          volume: this.channels[id].volume
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(this.customPresets));
    } catch (e) {
      console.warn('[SoundMixer] Failed to save state to localStorage:', e);
    }
  }

  /**
   * Initialize mixer DOM & attach listeners
   */
  init() {
    if (this.modalEl) return;

    this._injectModalDOM();
    this._attachKeyboardShortcuts();
    this._attachDockTrigger();
    this._setupSleepTimerCallbacks();
    this.syncActiveChannelsWithEngine();
  }

  /**
   * Inject Glassmorphic Sound Mixer Modal into document.body
   */
  _injectModalDOM() {
    let existing = document.getElementById('soundMixerModal');
    if (existing) {
      this.modalEl = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay sound-mixer-overlay';
    modal.id = 'soundMixerModal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="modal-card sound-mixer-card" role="dialog" aria-modal="true" aria-labelledby="soundMixerTitle">
        <!-- HEADER -->
        <div class="modal-header sound-mixer-header">
          <div class="sound-mixer-title-wrap">
            <div class="sound-mixer-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>
              </svg>
            </div>
            <div>
              <h2 class="modal-title" id="soundMixerTitle">Bộ Trộn Âm Thanh & Sóng Não</h2>
              <p class="sound-mixer-subtitle">Trộn nhiều âm thanh thiên nhiên cùng lúc & Kích thích não bộ Stereo</p>
            </div>
          </div>
          <button class="modal-close-btn" id="soundMixerCloseBtn" title="Đóng (Esc)">&times;</button>
        </div>

        <div class="modal-body sound-mixer-body">

          <!-- MASTER CONTROL STRIP -->
          <div class="mixer-master-strip">
            <div class="master-vol-group">
              <button class="mixer-btn-icon" id="mixerMasterMuteBtn" title="Tắt / Bật tiếng tổng">
                <svg id="mixerMuteIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
              <div class="master-vol-label">Âm lượng chính:</div>
              <input type="range" id="mixerMasterVolume" class="styled-range mixer-range" min="0" max="1" step="0.01" value="${this.synth.getVolume()}">
              <span class="mixer-badge-vol" id="mixerMasterVolBadge">${Math.round(this.synth.getVolume() * 100)}%</span>
            </div>

            <div class="master-actions-group">
              <button class="mixer-btn-action" id="mixerStopAllBtn" title="Dừng tất cả âm thanh đang phát">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                </svg>
                <span>Tắt Hết</span>
              </button>
              <button class="mixer-btn-action mixer-btn-highlight" id="mixerSavePresetBtn" title="Lưu tổ hợp âm thanh đang nghe">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Lưu Phối Âm</span>
              </button>
            </div>
          </div>

          <!-- PRESETS BAR -->
          <div class="mixer-section-group">
            <div class="mixer-section-title">
              <span>✨ Phối Âm Tuyển Chọn (Presets)</span>
              <span class="mixer-section-hint">Nhấp để áp dụng ngay</span>
            </div>
            <div class="mixer-presets-scroll" id="mixerPresetsContainer">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- SLEEP TIMER BAR -->
          <div class="mixer-section-group mixer-sleep-group">
            <div class="mixer-section-title">
              <span>⏱️ Hẹn Giờ Tắt Âm Tự Động (Sleep Timer)</span>
              <span class="mixer-sleep-badge hidden" id="mixerSleepBadge">⏳ 00:00</span>
            </div>
            <div class="mixer-timer-options" id="mixerTimerOptions">
              <button class="mixer-timer-btn active" data-minutes="0">Tắt</button>
              <button class="mixer-timer-btn" data-minutes="15">15 Phút</button>
              <button class="mixer-timer-btn" data-minutes="30">30 Phút</button>
              <button class="mixer-timer-btn" data-minutes="45">45 Phút</button>
              <button class="mixer-timer-btn" data-minutes="60">60 Phút</button>
            </div>
          </div>

          <!-- CHANNELS GRID -->
          <div class="mixer-section-group">
            <div class="mixer-section-title">
              <span>🎚️ Kênh Âm Thanh Đa Kênh (Multi-Channels)</span>
              <span class="mixer-active-count" id="mixerActiveCount">Đang phát: 0</span>
            </div>

            <div class="mixer-channels-grid" id="mixerChannelsGrid">
              <!-- Channels dynamically injected -->
            </div>
          </div>

        </div>

        <!-- FOOTER -->
        <div class="modal-footer sound-mixer-footer">
          <div class="sound-mixer-status-tip">
            💡 <span>Gợi ý: Nhấn <kbd>Shift + M</kbd> để bật/tắt nhanh bộ trộn này bất kỳ lúc nào.</span>
          </div>
          <button class="setting-btn-primary" id="soundMixerDoneBtn">Hoàn Tất</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this._renderPresets();
    this._renderChannels();
    this._bindDOMEvents();
  }

  /**
   * Render Preset buttons (Built-in and User Custom)
   */
  _renderPresets() {
    const container = document.getElementById('mixerPresetsContainer');
    if (!container) return;

    container.innerHTML = '';

    // Built-in presets
    BUILTIN_PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = `mixer-preset-chip ${this.activePresetId === preset.id ? 'active' : ''}`;
      btn.dataset.presetId = preset.id;
      btn.title = preset.description;
      btn.innerHTML = `
        <span class="preset-icon">${preset.icon}</span>
        <span class="preset-name">${preset.name}</span>
      `;
      btn.addEventListener('click', () => this.applyPreset(preset));
      container.appendChild(btn);
    });

    // Custom user presets
    if (this.customPresets.length > 0) {
      const sep = document.createElement('div');
      sep.className = 'preset-chip-divider';
      container.appendChild(sep);

      this.customPresets.forEach((preset, idx) => {
        const btn = document.createElement('div');
        btn.className = `mixer-preset-chip custom ${this.activePresetId === preset.id ? 'active' : ''}`;
        btn.innerHTML = `
          <span class="preset-icon">⭐</span>
          <span class="preset-name">${preset.name}</span>
          <button class="preset-del-btn" title="Xóa phối âm này" data-idx="${idx}">&times;</button>
        `;

        btn.addEventListener('click', (e) => {
          if (e.target.classList.contains('preset-del-btn')) {
            e.stopPropagation();
            this.deleteCustomPreset(idx);
            return;
          }
          this.applyPreset(preset);
        });

        container.appendChild(btn);
      });
    }
  }

  /**
   * Render channel cards
   */
  _renderChannels() {
    const grid = document.getElementById('mixerChannelsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    TRACKS_CONFIG.forEach(track => {
      const isPlaying = this.synth.isTrackPlaying(track.id);
      const vol = Math.round((this.channels[track.id]?.volume ?? track.defaultVol) * 100);

      const card = document.createElement('div');
      card.className = `mixer-channel-card ${isPlaying ? 'active' : ''} ${track.isBinaural ? 'channel-binaural' : ''}`;
      card.id = `channelCard_${track.id}`;

      let binauralSubHtml = '';
      if (track.isBinaural) {
        const currentMode = this.synth.binauralMode;
        binauralSubHtml = `
          <div class="binaural-controls-panel">
            <div class="binaural-headphone-tip">
              <span>🎧</span>
              <span>Stereo Headphones: Âm thanh lệch pha độc lập tai trái & tai phải.</span>
            </div>
            <div class="binaural-modes-row">
              <button class="binaural-mode-pill ${currentMode === 'alpha' ? 'active' : ''}" data-mode="alpha" title="10Hz: Thư giãn, tập trung sáng suốt, trạng thái dòng chảy">
                <span class="pill-freq">10 Hz</span>
                <span class="pill-name">Alpha Tập Trung</span>
              </button>
              <button class="binaural-mode-pill ${currentMode === 'theta' ? 'active' : ''}" data-mode="theta" title="6Hz: Thiền định sâu, sáng tạo, giải phóng căng thẳng">
                <span class="pill-freq">6 Hz</span>
                <span class="pill-name">Theta Thiền Định</span>
              </button>
              <button class="binaural-mode-pill ${currentMode === 'gamma' ? 'active' : ''}" data-mode="gamma" title="40Hz: Siêu tập trung, xử lý thông tin phức tạp đỉnh cao">
                <span class="pill-freq">40 Hz</span>
                <span class="pill-name">Gamma Đỉnh Cao</span>
              </button>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="channel-main-row">
          <div class="channel-left">
            <span class="channel-icon">${track.icon}</span>
            <div class="channel-info">
              <div class="channel-title-row">
                <span class="channel-name">${track.name}</span>
                <div class="sound-wave-bars ${isPlaying ? 'playing' : ''}" id="wave_${track.id}" aria-hidden="true">
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                </div>
              </div>
              <div class="channel-desc">${track.desc}</div>
            </div>
          </div>

          <div class="channel-right">
            <button class="channel-power-btn ${isPlaying ? 'active' : ''}" id="powerBtn_${track.id}" title="${isPlaying ? 'Tắt kênh này' : 'Bật kênh này'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="channel-slider-row">
          <svg class="slider-vol-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <input type="range" class="styled-range channel-range" id="volSlider_${track.id}" min="0" max="1" step="0.01" value="${(this.channels[track.id]?.volume ?? track.defaultVol)}">
          <span class="channel-vol-badge" id="volBadge_${track.id}">${vol}%</span>
        </div>

        ${binauralSubHtml}
      `;

      grid.appendChild(card);
    });

    this._bindChannelEvents();
  }

  /**
   * Bind event listeners for channel cards
   */
  _bindChannelEvents() {
    TRACKS_CONFIG.forEach(track => {
      const powerBtn = document.getElementById(`powerBtn_${track.id}`);
      const volSlider = document.getElementById(`volSlider_${track.id}`);
      const volBadge = document.getElementById(`volBadge_${track.id}`);
      const card = document.getElementById(`channelCard_${track.id}`);
      const wave = document.getElementById(`wave_${track.id}`);

      if (powerBtn) {
        powerBtn.addEventListener('click', () => {
          this.toggleTrack(track.id);
        });
      }

      if (volSlider) {
        volSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.setTrackVolume(track.id, val);
          if (volBadge) volBadge.textContent = `${Math.round(val * 100)}%`;
        });
      }

      // Binaural mode pills
      if (track.isBinaural && card) {
        const pills = card.querySelectorAll('.binaural-mode-pill');
        pills.forEach(pill => {
          pill.addEventListener('click', () => {
            const mode = pill.dataset.mode;
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            this.synth.setBinauralBeat(mode);
            this.savePersistedState();
          });
        });
      }
    });
  }

  /**
   * Bind modal controls (Master volume, mute, presets, timer)
   */
  _bindDOMEvents() {
    // Close button
    const closeBtn = document.getElementById('soundMixerCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const doneBtn = document.getElementById('soundMixerDoneBtn');
    if (doneBtn) doneBtn.addEventListener('click', () => this.close());

    // Click outside modal card to close
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) this.close();
      });
    }

    // Master volume slider
    const masterVolSlider = document.getElementById('mixerMasterVolume');
    const masterVolBadge = document.getElementById('mixerMasterVolBadge');
    if (masterVolSlider) {
      masterVolSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.synth.setVolume(val);
        if (masterVolBadge) masterVolBadge.textContent = `${Math.round(val * 100)}%`;
        this.savePersistedState();
      });
    }

    // Master Mute
    const muteBtn = document.getElementById('mixerMasterMuteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.synth.toggleMute();
        muteBtn.classList.toggle('muted', isMuted);
      });
    }

    // Stop All button
    const stopAllBtn = document.getElementById('mixerStopAllBtn');
    if (stopAllBtn) {
      stopAllBtn.addEventListener('click', () => this.stopAll());
    }

    // Save Preset button
    const savePresetBtn = document.getElementById('mixerSavePresetBtn');
    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', () => this.promptSaveCustomPreset());
    }

    // Sleep Timer pills
    const timerContainer = document.getElementById('mixerTimerOptions');
    if (timerContainer) {
      const btns = timerContainer.querySelectorAll('.mixer-timer-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const minutes = parseInt(btn.dataset.minutes, 10);
          this.setSleepTimer(minutes);
        });
      });
    }
  }

  /**
   * Setup keyboard shortcuts: Shift + M to toggle Mixer
   */
  _attachKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger when user is typing in inputs or textareas
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key.toLowerCase() === 'm' && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Enhance existing ambientSoundBtn or inject dedicated sound mixer trigger
   */
  _attachDockTrigger() {
    const dock = document.querySelector('.bottom-dock');
    const existingAmbientBtn = document.getElementById('ambientSoundBtn');

    // Right-click or long-press on ambientSoundBtn opens mixer
    if (existingAmbientBtn) {
      existingAmbientBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.open();
      });

      // Also add tiny mixer badge icon to ambient sound button
      let triggerPill = existingAmbientBtn.querySelector('.mixer-quick-pill');
      if (!triggerPill) {
        triggerPill = document.createElement('span');
        triggerPill.className = 'mixer-quick-pill';
        triggerPill.title = 'Mở Trình Trộn Đa Âm Thanh (Shift + M)';
        triggerPill.innerHTML = `🎚️`;
        triggerPill.addEventListener('click', (e) => {
          e.stopPropagation();
          this.open();
        });
        existingAmbientBtn.appendChild(triggerPill);
      }
    }

    // If dock exists, inject dedicated button if not present
    if (dock && !document.getElementById('mixerDockBtn')) {
      const btn = document.createElement('button');
      btn.className = 'control-btn mixer-dock-btn';
      btn.id = 'mixerDockBtn';
      btn.title = 'Trình Trộn Âm Thanh & Sóng Não (Shift + M)';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>Bộ Trộn</span>
      `;
      btn.addEventListener('click', () => this.toggle());

      // Insert right after ambientSoundBtn or at end before settingsBtn
      if (existingAmbientBtn && existingAmbientBtn.nextSibling) {
        dock.insertBefore(btn, existingAmbientBtn.nextSibling);
      } else {
        dock.appendChild(btn);
      }
    }
  }

  /**
   * Sleep Timer Tick & Completion handling
   */
  _setupSleepTimerCallbacks() {
    this.synth.sleepTimerTickCallbacks.add((rem, tot) => {
      this._updateSleepBadge(rem, tot);
    });

    this.synth.sleepTimerCompleteCallbacks.add(() => {
      this.syncActiveChannelsWithEngine();
      this.updateDockStatus();
      this._updateSleepBadge(0, 0);

      // Reset timer UI pills
      const timerContainer = document.getElementById('mixerTimerOptions');
      if (timerContainer) {
        const btns = timerContainer.querySelectorAll('.mixer-timer-btn');
        btns.forEach(b => {
          b.classList.toggle('active', b.dataset.minutes === '0');
        });
      }
    });
  }

  _updateSleepBadge(rem, tot) {
    const badge = document.getElementById('mixerSleepBadge');
    if (!badge) return;

    if (rem > 0) {
      badge.classList.remove('hidden');
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      badge.textContent = `⏳ Tắt sau: ${timeStr}`;
      if (rem <= 30) {
        badge.classList.add('fading');
        badge.textContent = `⏳ Đang nhỏ dần: ${timeStr}`;
      } else {
        badge.classList.remove('fading');
      }
    } else {
      badge.classList.add('hidden');
    }
  }

  setSleepTimer(minutes) {
    this.sleepTimerMinutes = minutes;
    this.synth.startSleepTimer(minutes);
  }

  // =========================================================================
  // ACTIONS: TRACKS & PRESETS
  // =========================================================================

  toggleTrack(trackId) {
    const isNowPlaying = this.synth.toggleTrack(trackId);
    this.channels[trackId].enabled = isNowPlaying;
    this._updateTrackCardUI(trackId, isNowPlaying);
    this.updateDockStatus();
    this.savePersistedState();
  }

  setTrackVolume(trackId, volume) {
    this.channels[trackId].volume = volume;
    this.synth.setTrackVolume(trackId, volume);
    this.savePersistedState();
  }

  _updateTrackCardUI(trackId, isPlaying) {
    const card = document.getElementById(`channelCard_${trackId}`);
    const powerBtn = document.getElementById(`powerBtn_${trackId}`);
    const wave = document.getElementById(`wave_${trackId}`);

    if (card) card.classList.toggle('active', isPlaying);
    if (powerBtn) {
      powerBtn.classList.toggle('active', isPlaying);
      powerBtn.title = isPlaying ? 'Tắt kênh này' : 'Bật kênh này';
    }
    if (wave) wave.classList.toggle('playing', isPlaying);

    this.updateActiveCountBadge();
  }

  /**
   * Apply a preset configuration
   */
  applyPreset(preset) {
    this.activePresetId = preset.id;
    this.synth.stopAllTracks();

    // Configure binaural mode if specified
    if (preset.binauralMode) {
      this.synth.setBinauralBeat(preset.binauralMode);
    }

    // Activate preset tracks
    Object.keys(preset.tracks).forEach(trackId => {
      const vol = preset.tracks[trackId];
      this.channels[trackId].volume = vol;
      this.synth.setTrackVolume(trackId, vol);
      this.synth.startTrack(trackId, vol);
    });

    this.syncActiveChannelsWithEngine();
    this._renderPresets();
    this.updateDockStatus();
    this.savePersistedState();
  }

  /**
   * Save current mix as a custom preset
   */
  promptSaveCustomPreset() {
    const active = this.synth.getActiveTracks();
    if (active.length === 0) {
      alert('Vui lòng bật ít nhất một âm thanh trước khi lưu phối âm!');
      return;
    }

    const defaultName = `Phối âm cá nhân ${this.customPresets.length + 1}`;
    const name = prompt('Đặt tên cho phối âm mới của bạn:', defaultName);
    if (!name || !name.trim()) return;

    const newPreset = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      icon: '⭐',
      tracks: {},
      binauralMode: this.synth.binauralMode
    };

    active.forEach(id => {
      newPreset.tracks[id] = this.channels[id]?.volume ?? this.synth.getTrackVolume(id);
    });

    this.customPresets.push(newPreset);
    this.activePresetId = newPreset.id;
    this.savePersistedState();
    this._renderPresets();
  }

  deleteCustomPreset(index) {
    if (confirm('Bạn có chắc chắn muốn xóa phối âm này không?')) {
      this.customPresets.splice(index, 1);
      this.savePersistedState();
      this._renderPresets();
    }
  }

  stopAll() {
    this.synth.stopAllTracks();
    this.activePresetId = null;
    this.syncActiveChannelsWithEngine();
    this._renderPresets();
    this.updateDockStatus();
  }

  /**
   * Sync UI state with synth active tracks
   */
  syncActiveChannelsWithEngine() {
    const activeList = this.synth.getActiveTracks();

    TRACKS_CONFIG.forEach(t => {
      const isPlaying = activeList.includes(t.id);
      this.channels[t.id].enabled = isPlaying;
      this._updateTrackCardUI(t.id, isPlaying);

      // Sync slider value
      const volSlider = document.getElementById(`volSlider_${t.id}`);
      const volBadge = document.getElementById(`volBadge_${t.id}`);
      const currentVol = this.channels[t.id].volume;

      if (volSlider) volSlider.value = currentVol;
      if (volBadge) volBadge.textContent = `${Math.round(currentVol * 100)}%`;
    });

    this.updateActiveCountBadge();
  }

  updateActiveCountBadge() {
    const badge = document.getElementById('mixerActiveCount');
    if (!badge) return;
    const count = this.synth.getActiveTracks().length;
    badge.textContent = `Đang phát: ${count}`;
    badge.classList.toggle('has-active', count > 0);
  }

  /**
   * Update bottom dock ambient button label to reflect active tracks
   */
  updateDockStatus() {
    const soundLabel = document.getElementById('soundLabel');
    const ambientSoundBtn = document.getElementById('ambientSoundBtn');
    const mixerDockBtn = document.getElementById('mixerDockBtn');
    const active = this.synth.getActiveTracks();

    if (ambientSoundBtn) {
      ambientSoundBtn.classList.toggle('active', active.length > 0);
    }
    if (mixerDockBtn) {
      mixerDockBtn.classList.toggle('active', active.length > 0);
    }

    if (soundLabel) {
      if (active.length === 0) {
        soundLabel.textContent = 'Tắt âm';
      } else if (active.length === 1) {
        const trk = TRACKS_CONFIG.find(t => t.id === active[0]);
        soundLabel.textContent = trk ? `${trk.icon} ${trk.name}` : 'Âm thanh';
      } else {
        const first = TRACKS_CONFIG.find(t => t.id === active[0]);
        const icon = first ? first.icon : '🎚️';
        soundLabel.textContent = `${icon} Phối ${active.length} kênh`;
      }
    }
  }

  // =========================================================================
  // MODAL VISIBILITY
  // =========================================================================

  open() {
    this.init();
    if (!this.modalEl) return;

    this.syncActiveChannelsWithEngine();
    this.modalEl.classList.add('open');
    this.modalEl.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

export const soundMixer = new SoundMixerController();

// Auto-initialize when document is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => soundMixer.init());
  } else {
    soundMixer.init();
  }
}
