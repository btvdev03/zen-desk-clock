/**
 * ZenDesk Clock - Advanced Web Audio Procedural Multi-Track Sound Engine & Binaural Beats
 * Zero external audio files, 100% offline, zero latency, seamless infinite ambient soundscapes.
 *
 * Supported Multi-Track Ambient Sounds:
 *  - Rain: Mưa rào êm dịu, giọt nước rơi
 *  - Fire: Lửa trại bập bùng, tiếng nổ lép bép
 *  - Ocean: Sóng biển hoàng hôn, chu kỳ thở 10s
 *  - Crickets: Tiếng dế đêm mùa hạ
 *  - Birds: Tiếng chim rừng ban sớm
 *  - Cafe: Quán cà phê ấm cúng (muffled chatter + tiếng lách cách tách trà + espresso hiss)
 *  - White Noise: Tiếng ồn trắng tĩnh tâm
 *  - Pink Noise: Tiếng ồn hồng êm dịu
 *  - Brown Noise: Tiếng ồn nâu trầm sâu
 *  - Binaural Beats: True stereo sóng não (Alpha 10Hz, Theta 6Hz, Gamma 40Hz) via ChannelMergerNode
 *
 * Backward-compatible with single-sound ZenDesk Clock API.
 */

export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGainNode = null;
    this.currentSound = 'none'; // Legacy compatibility: 'none', 'rain', 'fire', etc.
    this.volume = 0.5; // Master volume (0 to 1)
    this.isMuted = false;

    // Multi-track state management
    this.activeTracks = {}; // map of trackId -> { id, gainNode, nodes, intervals, cleanup }
    this.trackVolumes = {
      rain: 0.6,
      fire: 0.5,
      ocean: 0.6,
      crickets: 0.4,
      birds: 0.35,
      cafe: 0.45,
      wind: 0.45,
      thunder: 0.4,
      brown: 0.5,
      pink: 0.4,
      white: 0.3,
      binaural: 0.35
    };

    // Binaural Beats configuration
    this.binauralMode = 'alpha'; // 'alpha' (10Hz), 'theta' (6Hz), 'gamma' (40Hz), 'custom'
    this.binauralBaseFreq = 200; // Carrier base frequency (Hz)
    this.binauralBeatFreq = 10;  // Offset frequency (Hz)
    this.binauralNodes = null;   // Active oscillators reference for dynamic frequency shifts

    // Sleep Timer
    this.sleepTimerInterval = null;
    this.sleepTimerSecondsTotal = 0;
    this.sleepTimerSecondsRemaining = 0;
    this.sleepTimerTickCallbacks = new Set();
    this.sleepTimerCompleteCallbacks = new Set();
    this.isSleepTimerFading = false;

    // Legacy single-sound support references
    this.sourceNode = null;
    this.gainNode = null; // points to masterGainNode
    this.lfoNode = null;
    this.auxInterval = null;
  }

  /**
   * Initialize or resume the Web Audio context and master gain bus
   */
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.masterGainNode) {
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);
      this.gainNode = this.masterGainNode; // legacy alias
    }
  }

  /**
   * Autoplay Policy Unlock: resume suspended AudioContext on user interaction
   */
  unlockAudioContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // =========================================================================
  // MASTER CONTROLS
  // =========================================================================

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && !this.isMuted && !this.isSleepTimerFading) {
      this.masterGainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  getVolume() {
    return this.volume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGainNode) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  // =========================================================================
  // MULTI-TRACK AMBIENT MIXER API
  // =========================================================================

  /**
   * Start an individual sound track concurrently with other active tracks.
   * @param {string} trackId - 'rain', 'fire', 'ocean', 'crickets', 'birds', 'cafe', 'wind', 'thunder', 'brown', 'pink', 'white', 'binaural'
   * @param {number} [volume] - Optional track volume (0-1). Defaults to trackVolumes[trackId] or 0.5.
   */
  startTrack(trackId, volume = null) {
    this.initContext();

    if (volume !== null) {
      this.trackVolumes[trackId] = Math.max(0, Math.min(1, volume));
    }
    const trackVol = this.trackVolumes[trackId] ?? 0.5;

    // If track is in progress of stopping, destroy immediately and recreate cleanly
    if (this.activeTracks[trackId]) {
      if (this.activeTracks[trackId]._stopping) {
        if (this.activeTracks[trackId]._stoppingTimer) {
          clearTimeout(this.activeTracks[trackId]._stoppingTimer);
        }
        this._destroyTrack(this.activeTracks[trackId]);
        delete this.activeTracks[trackId];
      } else {
        this.setTrackVolume(trackId, trackVol);
        return;
      }
    }

    // Create a dedicated GainNode for this track
    const trackGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    trackGain.gain.setValueAtTime(0.001, now);
    trackGain.gain.linearRampToValueAtTime(trackVol, now + 0.08);
    trackGain.connect(this.masterGainNode);

    const trackObj = {
      id: trackId,
      gainNode: trackGain,
      nodes: [],
      intervals: [],
      cleanup: null
    };

    switch (trackId) {
      case 'white':
        this._buildNoiseTrack(trackObj, 'white');
        break;
      case 'pink':
        this._buildNoiseTrack(trackObj, 'pink');
        break;
      case 'brown':
        this._buildNoiseTrack(trackObj, 'brown');
        break;
      case 'rain':
        this._buildRainTrack(trackObj);
        break;
      case 'fire':
        this._buildFireTrack(trackObj);
        break;
      case 'ocean':
        this._buildOceanTrack(trackObj);
        break;
      case 'crickets':
        this._buildCricketsTrack(trackObj);
        break;
      case 'birds':
        this._buildBirdsTrack(trackObj);
        break;
      case 'cafe':
        this._buildCafeTrack(trackObj);
        break;
      case 'wind':
        this._buildWindTrack(trackObj);
        break;
      case 'thunder':
        this._buildThunderTrack(trackObj);
        break;
      case 'binaural':
        this._buildBinauralTrack(trackObj);
        break;
      default:
        console.warn(`[AudioSynthesizer] Unknown track ID: ${trackId}`);
        trackGain.disconnect();
        return;
    }

    this.activeTracks[trackId] = trackObj;
    this.currentSound = trackId; // Reflect last triggered sound
  }

  /**
   * Internal helper: Disconnect and stop all nodes of a track completely
   */
  _destroyTrack(track) {
    if (!track) return;

    if (track.intervals) {
      track.intervals.forEach(id => {
        clearInterval(id);
        clearTimeout(id);
      });
      track.intervals = [];
    }

    if (track.nodes) {
      track.nodes.forEach(node => {
        try {
          if (typeof node.stop === 'function') node.stop();
          node.disconnect();
        } catch (e) {
          // Ignored
        }
      });
      track.nodes = [];
    }

    if (track.cleanup) {
      try { track.cleanup(); } catch (e) {}
      track.cleanup = null;
    }

    if (track.gainNode) {
      try { track.gainNode.disconnect(); } catch (e) {}
      track.gainNode = null;
    }

    if (track.id === 'binaural') {
      this.binauralNodes = null;
    }
  }

  /**
   * Stop an individual track with smooth fade-out and complete cleanup.
   * @param {string} trackId
   * @param {number} [fadeDuration=0.08]
   */
  stopTrack(trackId, fadeDuration = 0.08) {
    const track = this.activeTracks[trackId];
    if (!track) return;

    // Immediately stop creating any new pulses/chirps/crackles
    if (track.intervals) {
      track.intervals.forEach(id => {
        clearInterval(id);
        clearTimeout(id);
      });
      track.intervals = [];
    }

    if (track._stoppingTimer) {
      clearTimeout(track._stoppingTimer);
    }
    track._stopping = true;

    const now = this.ctx ? this.ctx.currentTime : 0;
    if (track.gainNode && this.ctx && this.ctx.state === 'running') {
      try {
        track.gainNode.gain.cancelScheduledValues(now);
        track.gainNode.gain.setValueAtTime(track.gainNode.gain.value, now);
        track.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
      } catch (e) {
        // Fallback
      }
    }

    track._stoppingTimer = setTimeout(() => {
      this._destroyTrack(track);
      delete this.activeTracks[trackId];

      // Update currentSound if all stopped
      if (Object.keys(this.activeTracks).length === 0) {
        this.currentSound = 'none';
      }
    }, Math.max(10, fadeDuration * 1000 + 15));
  }

  /**
   * Toggle track playing status
   */
  toggleTrack(trackId) {
    if (this.isTrackPlaying(trackId)) {
      this.stopTrack(trackId);
      return false;
    } else {
      this.startTrack(trackId);
      return true;
    }
  }

  /**
   * Set volume of a specific track smoothly
   */
  setTrackVolume(trackId, volume) {
    const vol = Math.max(0, Math.min(1, volume));
    this.trackVolumes[trackId] = vol;
    const track = this.activeTracks[trackId];
    if (track && track.gainNode && this.ctx) {
      track.gainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.04);
    }
  }

  getTrackVolume(trackId) {
    return this.trackVolumes[trackId] ?? 0.5;
  }

  isTrackPlaying(trackId) {
    return Boolean(this.activeTracks[trackId]);
  }

  getActiveTracks() {
    return Object.keys(this.activeTracks);
  }

  /**
   * Stop all active ambient tracks
   */
  stopAllTracks() {
    const active = Object.keys(this.activeTracks);
    active.forEach(id => this.stopTrack(id, 0.05));
    this.currentSound = 'none';
  }

  // =========================================================================
  // BINAURAL BEATS STEREO GENERATOR
  // =========================================================================

  /**
   * Configure Binaural Beats frequencies
   * @param {string|number} modeOrBase - 'alpha' (10Hz), 'theta' (6Hz), 'gamma' (40Hz), or custom base frequency
   * @param {number} [customBeatFreq] - beat frequency if modeOrBase is custom number
   */
  setBinauralBeat(modeOrBase, customBeatFreq = null) {
    if (typeof modeOrBase === 'string') {
      const mode = modeOrBase.toLowerCase();
      this.binauralMode = mode;
      this.binauralBaseFreq = 200; // Optimal carrier frequency for human binaural perception

      switch (mode) {
        case 'alpha':
          // 10Hz: Relaxed alertness, deep focus, flow state
          this.binauralBeatFreq = 10;
          break;
        case 'theta':
          // 6Hz: Deep meditation, visualization, creativity & insight
          this.binauralBeatFreq = 6;
          break;
        case 'gamma':
          // 40Hz: Peak concentration, high-level cognitive processing
          this.binauralBeatFreq = 40;
          break;
        default:
          this.binauralBeatFreq = 10;
          break;
      }
    } else if (typeof modeOrBase === 'number') {
      this.binauralMode = 'custom';
      this.binauralBaseFreq = Math.max(80, Math.min(500, modeOrBase));
      this.binauralBeatFreq = Math.max(0.5, Math.min(60, customBeatFreq || 10));
    }

    // If binaural track is currently playing, transition smoothly in real-time
    if (this.binauralNodes && this.ctx) {
      const now = this.ctx.currentTime;
      const leftTarget = this.binauralBaseFreq;
      const rightTarget = this.binauralBaseFreq + this.binauralBeatFreq;

      this.binauralNodes.oscL.frequency.setTargetAtTime(leftTarget, now, 0.4);
      this.binauralNodes.oscR.frequency.setTargetAtTime(rightTarget, now, 0.4);
    }
  }

  getBinauralConfig() {
    return {
      mode: this.binauralMode,
      baseFreq: this.binauralBaseFreq,
      beatFreq: this.binauralBeatFreq
    };
  }

  /**
   * Build Binaural Beats using a true stereo ChannelMergerNode:
   * Left Ear: baseFreq (e.g., 200 Hz)
   * Right Ear: baseFreq + beatFreq (e.g., 210 Hz for 10 Hz Alpha)
   */
  _buildBinauralTrack(trackObj) {
    const merger = this.ctx.createChannelMerger(2);

    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();

    oscL.type = 'sine';
    oscR.type = 'sine';

    const now = this.ctx.currentTime;
    oscL.frequency.setValueAtTime(this.binauralBaseFreq, now);
    oscR.frequency.setValueAtTime(this.binauralBaseFreq + this.binauralBeatFreq, now);

    // Subtle gain scaling for pure sine comfort
    const gainL = this.ctx.createGain();
    const gainR = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.35, now);
    gainR.gain.setValueAtTime(0.35, now);

    oscL.connect(gainL);
    gainL.connect(merger, 0, 0); // Input 0 = Left Audio Channel

    oscR.connect(gainR);
    gainR.connect(merger, 0, 1); // Input 1 = Right Audio Channel

    merger.connect(trackObj.gainNode);

    oscL.start();
    oscR.start();

    trackObj.nodes.push(oscL, oscR, gainL, gainR, merger);
    this.binauralNodes = { oscL, oscR, gainL, gainR, merger };
  }

  // =========================================================================
  // CAFE AMBIANCE PROCEDURAL GENERATOR
  // =========================================================================

  /**
   * Cozy Cafe Atmosphere:
   * 1. Layer 1: Muffled conversation murmur (formant-filtered pink noise loop with slow breathing)
   * 2. Layer 2: Occasional ceramic cups and cutlery clinking
   * 3. Layer 3: Soft espresso machine steam hiss
   */
  _buildCafeTrack(trackObj) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generatePinkNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Formant filters to mimic human speech murmur spectrum without distinct words
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'peaking';
    filter1.frequency.setValueAtTime(320, this.ctx.currentTime); // Vocal chest resonance
    filter1.Q.setValueAtTime(2.8, this.ctx.currentTime);
    filter1.gain.setValueAtTime(6.0, this.ctx.currentTime);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'peaking';
    filter2.frequency.setValueAtTime(880, this.ctx.currentTime); // First vowel formant
    filter2.Q.setValueAtTime(2.2, this.ctx.currentTime);
    filter2.gain.setValueAtTime(4.0, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1600, this.ctx.currentTime); // Muffled distance cut

    // Slow ambient breathing LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(lowpass);
    lowpass.connect(trackObj.gainNode);

    lfo.start();
    source.start();

    trackObj.nodes.push(source, filter1, filter2, lowpass, lfo, lfoGain);

    // Layer 2: Random ceramic cup & teaspoon clinks
    const clinkInterval = setInterval(() => {
      if (!this.isTrackPlaying('cafe') || this.isMuted) return;
      if (Math.random() < 0.45) {
        this._triggerCupClink(trackObj.gainNode);
      }
    }, 3600);
    trackObj.intervals.push(clinkInterval);

    // Layer 3: Occasional espresso steam hiss
    const steamInterval = setInterval(() => {
      if (!this.isTrackPlaying('cafe') || this.isMuted) return;
      if (Math.random() < 0.35) {
        this._triggerEspressoSteam(trackObj.gainNode);
      }
    }, 18000);
    trackObj.intervals.push(steamInterval);
  }

  _triggerCupClink(destinationGain) {
    const now = this.ctx.currentTime;
    const dur = 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // High crystalline porcelain resonance frequency
    const freq = 3200 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(18, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destinationGain);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  _triggerEspressoSteam(destinationGain) {
    const now = this.ctx.currentTime;
    const dur = 1.4;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(1.4, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(destinationGain);

    src.start(now);
    src.stop(now + dur + 0.02);
  }

  // =========================================================================
  // WIND PROCEDURAL GENERATOR
  // =========================================================================

  /**
   * Organic Wind:
   * Looped pink noise with modulated bandpass filter and gentle volume swells.
   */
  _buildWindTrack(trackObj) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generatePinkNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Highpass to eliminate low sub-bass rumble
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(140, this.ctx.currentTime);

    // Resonant Bandpass for wind whistling / rustling air
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(420, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(2.6, this.ctx.currentTime);

    // Lowpass filter to smooth out harsh highs
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1800, this.ctx.currentTime);

    // LFO 1: Frequency modulation for dynamic wind gusts
    const lfo1 = this.ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8.3s cycle

    const lfo1Gain = this.ctx.createGain();
    lfo1Gain.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(bandpass.frequency);

    // LFO 2: Volume swell modulation for realistic gusts
    const gustGain = this.ctx.createGain();
    gustGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    const lfo2 = this.ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.setValueAtTime(0.08, this.ctx.currentTime); // ~12.5s cycle

    const lfo2Gain = this.ctx.createGain();
    lfo2Gain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gustGain.gain);

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gustGain);
    gustGain.connect(trackObj.gainNode);

    lfo1.start();
    lfo2.start();
    source.start();

    trackObj.nodes.push(source, highpass, bandpass, lowpass, gustGain, lfo1, lfo1Gain, lfo2, lfo2Gain);
  }

  // =========================================================================
  // THUNDER PROCEDURAL GENERATOR
  // =========================================================================

  /**
   * Distant Rolling Thunder:
   * Continuous deep storm rumble bed + periodic organic rolling thunder strikes.
   */
  _buildThunderTrack(trackObj) {
    // 1. Continuous deep ambient storm rumble bed
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generateBrownNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(75, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(trackObj.gainNode);
    source.start();

    trackObj.nodes.push(source, lowpass, rumbleGain);

    // 2. Periodic distant rolling thunder strikes
    const triggerClap = () => {
      if (!this.isTrackPlaying('thunder') || this.isMuted) return;
      this._triggerRollingThunderTo(trackObj.gainNode);
    };

    // First clap after 3.5 seconds
    const initialTimer = setTimeout(triggerClap, 3500);
    trackObj.intervals.push(initialTimer);

    // Recurring claps every 16 seconds (with randomness)
    const thunderInterval = setInterval(() => {
      if (Math.random() < 0.75) {
        triggerClap();
      }
    }, 16000);
    trackObj.intervals.push(thunderInterval);
  }

  _triggerRollingThunderTo(destinationGain) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const dur = 4.2;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(2, bufSize, this.ctx.sampleRate);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    this._generateBrownNoise(left, right, bufSize);

    // Add multi-stage decay envelope directly into the buffer for natural reverberation
    for (let i = 0; i < bufSize; i++) {
      const t = i / this.ctx.sampleRate;
      let env = Math.exp(-t / 1.6);
      if (t > 0.8 && t < 2.0) {
        env += 0.35 * Math.exp(-(t - 1.2) * (t - 1.2) / 0.15);
      }
      left[i] *= env;
      right[i] *= env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(destinationGain);

    src.start(now);
    src.stop(now + dur + 0.05);
  }

  // =========================================================================
  // OTHER PROCEDURAL SOUND BUILDERS
  // =========================================================================

  _buildNoiseTrack(trackObj, type) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'white') {
      this._generateWhiteNoise(left, right, bufferSize);
    } else if (type === 'pink') {
      this._generatePinkNoise(left, right, bufferSize);
    } else if (type === 'brown') {
      this._generateBrownNoise(left, right, bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(trackObj.gainNode);
    source.start();

    trackObj.nodes.push(source);
  }

  _buildRainTrack(trackObj) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generateRainNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, this.ctx.currentTime);

    source.connect(highpass);
    highpass.connect(filter);
    filter.connect(trackObj.gainNode);

    source.start();
    trackObj.nodes.push(source, highpass, filter);
  }

  _buildFireTrack(trackObj) {
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generateBrownNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(180, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(trackObj.gainNode);
    source.start();

    trackObj.nodes.push(source, lowpass, rumbleGain);

    const crackleInterval = setInterval(() => {
      if (!this.isTrackPlaying('fire') || this.isMuted) return;
      if (Math.random() < 0.65) {
        this._triggerFireCrackleTo(trackObj.gainNode);
      }
    }, 180);

    trackObj.intervals.push(crackleInterval);
  }

  _triggerFireCrackleTo(destinationGain) {
    const now = this.ctx.currentTime;
    const isBigPop = Math.random() < 0.18;
    const dur = isBigPop ? 0.04 : 0.012;

    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    if (isBigPop) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500 + Math.random() * 300, now);
      filter.Q.setValueAtTime(3.0, now);
    } else {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 2500, now);
    }

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime((isBigPop ? 0.45 : 0.22), now);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(destinationGain);

    src.start(now);
    src.stop(now + dur + 0.005);
  }

  _buildOceanTrack(trackObj) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generatePinkNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10s ocean wave breath

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(450, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(trackObj.gainNode);

    lfo.start();
    source.start();

    trackObj.nodes.push(source, filter, lfo, lfoGain);
  }

  _buildCricketsTrack(trackObj) {
    const chirpInterval = setInterval(() => {
      if (!this.isTrackPlaying('crickets') || this.isMuted) return;
      if (Math.random() < 0.7) {
        this._triggerCricketChirpTo(trackObj.gainNode);
      }
    }, 900);

    trackObj.intervals.push(chirpInterval);
  }

  _triggerCricketChirpTo(destinationGain) {
    const now = this.ctx.currentTime;
    const pulses = 3;
    const pDur = 0.015;
    const gap = 0.009;

    for (let i = 0; i < pulses; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * (pDur + gap);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4600 + Math.random() * 120, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + pDur);

      osc.connect(gain);
      gain.connect(destinationGain);

      osc.start(t);
      osc.stop(t + pDur + 0.002);
    }
  }

  _buildBirdsTrack(trackObj) {
    const birdInterval = setInterval(() => {
      if (!this.isTrackPlaying('birds') || this.isMuted) return;
      if (Math.random() < 0.45) {
        this._triggerBirdChirpTo(trackObj.gainNode);
      }
    }, 2500);

    trackObj.intervals.push(birdInterval);
  }

  _triggerBirdChirpTo(destinationGain) {
    const now = this.ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < notes; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = now + i * 0.12;
      const dur = 0.08 + Math.random() * 0.05;

      osc.type = 'sine';
      const baseFreq = 2600 + Math.random() * 600;
      osc.frequency.setValueAtTime(baseFreq, startT);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (1.3 + Math.random() * 0.4), startT + dur * 0.5);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, startT + dur);

      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(0.08, startT + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);

      osc.connect(gain);
      gain.connect(destinationGain);

      osc.start(startT);
      osc.stop(startT + dur + 0.01);
    }
  }

  // =========================================================================
  // NOISE GENERATOR ALGORITHMS
  // =========================================================================

  _generateWhiteNoise(left, right, size) {
    for (let i = 0; i < size; i++) {
      left[i] = (Math.random() * 2 - 1) * 0.15;
      right[i] = (Math.random() * 2 - 1) * 0.15;
    }
  }

  _generatePinkNoise(left, right, size) {
    let b0_l = 0, b1_l = 0, b2_l = 0, b3_l = 0, b4_l = 0, b5_l = 0, b6_l = 0;
    let b0_r = 0, b1_r = 0, b2_r = 0, b3_r = 0, b4_r = 0, b5_r = 0, b6_r = 0;

    for (let i = 0; i < size; i++) {
      const white_l = Math.random() * 2 - 1;
      b0_l = 0.99886 * b0_l + white_l * 0.0555179;
      b1_l = 0.99332 * b1_l + white_l * 0.0750759;
      b2_l = 0.96900 * b2_l + white_l * 0.1538520;
      b3_l = 0.86650 * b3_l + white_l * 0.3104856;
      b4_l = 0.55000 * b4_l + white_l * 0.5329522;
      b5_l = -0.7616 * b5_l - white_l * 0.0168980;
      left[i] = (b0_l + b1_l + b2_l + b3_l + b4_l + b5_l + b6_l + white_l * 0.5362) * 0.04;
      b6_l = white_l * 0.115926;

      const white_r = Math.random() * 2 - 1;
      b0_r = 0.99886 * b0_r + white_r * 0.0555179;
      b1_r = 0.99332 * b1_r + white_r * 0.0750759;
      b2_r = 0.96900 * b2_r + white_r * 0.1538520;
      b3_r = 0.86650 * b3_r + white_r * 0.3104856;
      b4_r = 0.55000 * b4_r + white_r * 0.5329522;
      b5_r = -0.7616 * b5_r - white_r * 0.0168980;
      right[i] = (b0_r + b1_r + b2_r + b3_r + b4_r + b5_r + b6_r + white_r * 0.5362) * 0.04;
      b6_r = white_r * 0.115926;
    }
  }

  _generateBrownNoise(left, right, size) {
    let lastOut_l = 0.0;
    let lastOut_r = 0.0;

    for (let i = 0; i < size; i++) {
      const white_l = Math.random() * 2 - 1;
      lastOut_l = (lastOut_l + (0.02 * white_l)) / 1.02;
      left[i] = lastOut_l * 0.8;

      const white_r = Math.random() * 2 - 1;
      lastOut_r = (lastOut_r + (0.02 * white_r)) / 1.02;
      right[i] = lastOut_r * 0.8;
    }
  }

  _generateRainNoise(left, right, size) {
    this._generatePinkNoise(left, right, size);
    for (let i = 0; i < size; i++) {
      left[i] *= 1.4;
      right[i] *= 1.4;
      if (Math.random() < 0.002) {
        const drop = (Math.random() * 0.2 - 0.1);
        left[i] += drop;
        right[i] += drop;
      }
    }
  }

  // =========================================================================
  // SLEEP TIMER WITH GENTLE FADE OUT
  // =========================================================================

  /**
   * Start a sleep timer with gradual fade out in final 30 seconds
   * @param {number} minutes - 15, 30, 45, 60 or 0 to turn off
   * @param {Function} [onTick] - (remainingSec, totalSec) => {}
   * @param {Function} [onComplete] - () => {}
   */
  startSleepTimer(minutes, onTick = null, onComplete = null) {
    this.cancelSleepTimer();

    if (onTick) this.sleepTimerTickCallbacks.add(onTick);
    if (onComplete) this.sleepTimerCompleteCallbacks.add(onComplete);

    if (minutes <= 0) return;

    this.sleepTimerSecondsTotal = Math.round(minutes * 60);
    this.sleepTimerSecondsRemaining = this.sleepTimerSecondsTotal;
    this.isSleepTimerFading = false;

    // Trigger initial tick
    this._notifySleepTimerTick();

    this.sleepTimerInterval = setInterval(() => {
      this.sleepTimerSecondsRemaining--;

      // Gentle fade out in final 30 seconds
      if (this.sleepTimerSecondsRemaining <= 30 && this.sleepTimerSecondsRemaining > 0) {
        this.isSleepTimerFading = true;
        if (this.masterGainNode && this.ctx && !this.isMuted) {
          const fadeProgress = this.sleepTimerSecondsRemaining / 30;
          const targetGain = this.volume * fadeProgress;
          this.masterGainNode.gain.setValueAtTime(targetGain, this.ctx.currentTime);
        }
      }

      this._notifySleepTimerTick();

      if (this.sleepTimerSecondsRemaining <= 0) {
        this._handleSleepTimerFinished();
      }
    }, 1000);
  }

  cancelSleepTimer() {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerSecondsTotal = 0;
    this.sleepTimerSecondsRemaining = 0;

    // Restore master volume if we were in the middle of fading
    if (this.isSleepTimerFading) {
      this.isSleepTimerFading = false;
      if (this.masterGainNode && this.ctx && !this.isMuted) {
        this.masterGainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
      }
    }
    this._notifySleepTimerTick();
  }

  getSleepTimerRemaining() {
    return this.sleepTimerSecondsRemaining;
  }

  _notifySleepTimerTick() {
    const rem = this.sleepTimerSecondsRemaining;
    const tot = this.sleepTimerSecondsTotal;
    this.sleepTimerTickCallbacks.forEach(cb => {
      try { cb(rem, tot); } catch (e) { console.error(e); }
    });
  }

  _handleSleepTimerFinished() {
    this.cancelSleepTimer();
    this.stopAllTracks();

    // Restore master volume for next use
    if (this.masterGainNode && this.ctx && !this.isMuted) {
      this.masterGainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }

    this.sleepTimerCompleteCallbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  // =========================================================================
  // ONE-SHOT SOUND EFFECTS (Chimes & Mechanical Flip Click)
  // =========================================================================

  playChime() {
    this.initContext();
    const now = this.ctx.currentTime;
    const baseFreq = 432;
    const harmonics = [1, 2.76, 5.4, 8.9];
    const gains = [0.4, 0.2, 0.1, 0.05];

    harmonics.forEach((h, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, now);

      gain.gain.setValueAtTime(gains[idx] * (this.isMuted ? 0 : this.volume), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  playFlipClick() {
    if (this.isMuted || this.volume < 0.05) return;
    this.initContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // =========================================================================
  // 100% BACKWARD COMPATIBILITY FOR SINGLE AMBIENT PLAYBACK
  // =========================================================================

  /**
   * Legacy method used by app.js: soundEngine.playAmbient(sound)
   */
  playAmbient(type) {
    if (type === 'none') {
      this.stopAllTracks();
      return;
    }
    // Stop other active tracks and trigger single sound
    this.stopAllTracks();
    this.startTrack(type);
  }

  /**
   * Legacy method used by app.js: soundEngine.stopAmbient()
   */
  stopAmbient() {
    this.stopAllTracks();
  }
}

export const soundEngine = new AudioSynthesizer();

// Autoplay Policy: Automatically unlock Web Audio AudioContext upon first user interaction
if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'];
  const handleFirstInteraction = () => {
    soundEngine.unlockAudioContext();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleFirstInteraction, { capture: true }));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleFirstInteraction, { capture: true, passive: true }));
}
