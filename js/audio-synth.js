/**
 * ZenDesk Clock - Web Audio API Procedural Sound Engine
 * Zero external audio files, 100% offline, zero latency, seamless infinite ambient sound.
 * Includes Seasonal Soundscapes: Rain, Fireplace Crackle, Ocean Waves, Summer Crickets, Spring Birds.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.currentSound = 'none'; // 'none', 'rain', 'fire', 'ocean', 'crickets', 'birds', 'brown', 'pink', 'white'
    this.sourceNode = null;
    this.gainNode = null;
    this.lfoNode = null;
    this.auxInterval = null;
    this.volume = 0.5; // 0 to 1
    this.isMuted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  stopAmbient() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.sourceNode = null;
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.lfoNode = null;
    }
    if (this.auxInterval) {
      clearInterval(this.auxInterval);
      this.auxInterval = null;
    }
    this.currentSound = 'none';
  }

  playAmbient(type) {
    this.initContext();
    this.stopAmbient();

    if (type === 'none') return;

    this.currentSound = type;
    const bufferSize = this.ctx.sampleRate * 4; // 4-second loopable buffer
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }
    this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

    switch (type) {
      case 'white':
        this._generateWhiteNoise(left, right, bufferSize);
        this._startSimpleLoop(buffer);
        break;
      case 'pink':
        this._generatePinkNoise(left, right, bufferSize);
        this._startSimpleLoop(buffer);
        break;
      case 'brown':
        this._generateBrownNoise(left, right, bufferSize);
        this._startSimpleLoop(buffer);
        break;
      case 'rain':
        this._generateRainNoise(left, right, bufferSize);
        this._startRainLoop(buffer);
        break;
      case 'fire':
        this._startFireplace();
        break;
      case 'ocean':
        this._startOcean();
        break;
      case 'crickets':
        this._startCrickets();
        break;
      case 'birds':
        this._startBirds();
        break;
      default:
        return;
    }
  }

  _startSimpleLoop(buffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.gainNode);
    source.start();
    this.sourceNode = source;
  }

  _startRainLoop(buffer) {
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
    filter.connect(this.gainNode);

    source.start();
    this.sourceNode = source;
  }

  _startFireplace() {
    // 1. Warm background low roar
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
    rumbleGain.connect(this.gainNode);
    source.start();
    this.sourceNode = source;

    // 2. Periodic Poisson crackle & pops
    this.auxInterval = setInterval(() => {
      if (this.currentSound !== 'fire' || this.isMuted) return;
      if (Math.random() < 0.65) {
        this._triggerFireCrackle();
      }
    }, 180);
  }

  _triggerFireCrackle() {
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
    crackleGain.connect(this.gainNode);

    src.start(now);
    src.stop(now + dur + 0.005);
  }

  _startOcean() {
    // Pink noise base modulated by a slow 0.1 Hz LFO sine wave
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    this._generatePinkNoise(buffer.getChannelData(0), buffer.getChannelData(1), bufferSize);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    // LFO Oscillator modulating the filter frequency (breathing waves)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // ~10 second ocean wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(450, this.ctx.currentTime); // Filter sweeps from 150Hz to 1050Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.gainNode);

    lfo.start();
    source.start();

    this.sourceNode = source;
    this.lfoNode = lfo;
  }

  _startCrickets() {
    // Summer night gentle crickets
    this.auxInterval = setInterval(() => {
      if (this.currentSound !== 'crickets' || this.isMuted) return;
      if (Math.random() < 0.7) {
        this._triggerCricketChirp();
      }
    }, 900);
  }

  _triggerCricketChirp() {
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
      gain.connect(this.gainNode);

      osc.start(t);
      osc.stop(t + pDur + 0.002);
    }
  }

  _startBirds() {
    // Spring morning gentle birds
    this.auxInterval = setInterval(() => {
      if (this.currentSound !== 'birds' || this.isMuted) return;
      if (Math.random() < 0.45) {
        this._triggerBirdChirp();
      }
    }, 2500);
  }

  _triggerBirdChirp() {
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
      gain.connect(this.gainNode);

      osc.start(startT);
      osc.stop(startT + dur + 0.01);
    }
  }

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
}

export const soundEngine = new AudioSynthesizer();
