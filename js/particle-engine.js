/**
 * ZenDesk Clock - 3D Optical Depth-of-Field Seasonal Particle Engine
 * Multi-Plane Z-Depth (Foreground Bokeh Blur, Midground Focus, Far Background Motes).
 * Photo-Realistic Sprites: 6-arm Dendritic Snowflake Crystal, Peach Blossom, Golden Mai & 5-lobe Maple.
 * Zero-GC Object Pooling, 60fps/120fps Smooth Parallax Physics.
 */

export class SeasonalParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'none'; // 'none', 'snow', 'sakura', 'mai', 'maple', 'fireflies'
    this.particles = [];
    this.isRunning = false;
    this.rafId = null;
    this.lastTime = performance.now();
    this.offscreenSprites = {};

    this._initCanvas();
    this._initSprites();
    this._initEvents();
  }

  _initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  _initEvents() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.mode !== 'none') {
        this.resume();
      }
    });
  }

  _initSprites() {
    this.offscreenSprites.snowflake = this._createSnowflakeSprite();
    this.offscreenSprites.sakura = this._createSakuraPetalSprite();
    this.offscreenSprites.mai = this._createMaiPetalSprite();
    this.offscreenSprites.maple = this._createMapleLeafSprite();
  }

  _createSnowflakeSprite() {
    const c = document.createElement('canvas');
    const size = 64;
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(186, 230, 253, 0.85)';
    ctx.shadowBlur = 4;

    // Hexagonal core
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const r = 5.5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 6 Dendritic arms
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);

      // Main arm stem
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -26);
      ctx.stroke();

      // Lower branchlets
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(-6, -17);
      ctx.moveTo(0, -11);
      ctx.lineTo(6, -17);
      ctx.stroke();

      // Upper branchlets
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-5, -23);
      ctx.moveTo(0, -18);
      ctx.lineTo(5, -23);
      ctx.stroke();

      // Tip diamond
      ctx.beginPath();
      ctx.arc(0, -26, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    return c;
  }

  _createSakuraPetalSprite() {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d');
    ctx.translate(24, 24);

    const grad = ctx.createRadialGradient(0, 10, 2, 0, -5, 20);
    grad.addColorStop(0, '#fff5f7');
    grad.addColorStop(0.4, '#fda4af');
    grad.addColorStop(0.85, '#f43f5e');
    grad.addColorStop(1, '#e11d48');

    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-14, 12, -20, -4, -15, -16);
    ctx.bezierCurveTo(-10, -22, -4, -19, 0, -13);
    ctx.bezierCurveTo(4, -19, 10, -22, 15, -16);
    ctx.bezierCurveTo(20, -4, 14, 12, 0, 16);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Petal vein
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.quadraticCurveTo(-1, 0, 0, -11);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    return c;
  }

  _createMaiPetalSprite() {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d');
    ctx.translate(24, 24);

    const grad = ctx.createRadialGradient(0, 10, 2, 0, -4, 20);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.45, '#fbbf24');
    grad.addColorStop(0.85, '#f59e0b');
    grad.addColorStop(1, '#d97706');

    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-15, 12, -18, -4, -12, -16);
    ctx.bezierCurveTo(-6, -21, 6, -21, 12, -16);
    ctx.bezierCurveTo(18, -4, 15, 12, 0, 16);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Golden metallic vein
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.quadraticCurveTo(0.5, 2, 0, -12);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Amber stamen base
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    return c;
  }

  _createMapleLeafSprite() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.translate(32, 32);

    const grad = ctx.createLinearGradient(0, 20, 0, -26);
    grad.addColorStop(0, '#b91c1c');
    grad.addColorStop(0.3, '#dc2626');
    grad.addColorStop(0.65, '#ea580c');
    grad.addColorStop(1, '#f59e0b');

    // 5-lobe maple blade
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-8, 12);
    ctx.lineTo(-18, 13);
    ctx.lineTo(-14, 5);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-22, -14);
    ctx.lineTo(-11, -12);
    ctx.lineTo(-7, -19);
    ctx.lineTo(0, -26);
    ctx.lineTo(7, -19);
    ctx.lineTo(11, -12);
    ctx.lineTo(22, -14);
    ctx.lineTo(16, -6);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 5);
    ctx.lineTo(18, 13);
    ctx.lineTo(8, 12);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 24);
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Vein network
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, -22);
    ctx.moveTo(0, 14);
    ctx.lineTo(-18, -11);
    ctx.moveTo(0, 14);
    ctx.lineTo(-19, -1);
    ctx.moveTo(0, 14);
    ctx.lineTo(18, -11);
    ctx.moveTo(0, 14);
    ctx.lineTo(19, -1);
    ctx.stroke();

    return c;
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;

    if (mode === 'none') {
      this.pause();
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this._createPool();
    this.resume();
  }

  _createPool() {
    this.particles = [];
    const count = this.mode === 'snow' ? 100 : (this.mode === 'fireflies' ? 45 : 55);

    for (let i = 0; i < count; i++) {
      this.particles.push(this._generateParticle(true));
    }
  }

  _generateParticle(initial = false) {
    const rand = Math.random();
    const depth = rand < 0.55 ? 0 : (rand < 0.88 ? 1 : 2);

    const p = {
      x: Math.random() * this.width,
      y: initial ? Math.random() * this.height : -30,
      depth,
      size: 0,
      vx: 0,
      vy: 0,
      opacity: 0,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      tilt: Math.random() * Math.PI,
      tiltSpeed: 0.015 + Math.random() * 0.03,
      colorType: this.mode === 'mai' ? 'mai' : (this.mode === 'sakura' ? 'sakura' : (Math.random() > 0.5 ? 'sakura' : 'mai')),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    };

    switch (this.mode) {
      case 'snow':
        if (depth === 2) {
          p.size = 14 + Math.random() * 12; // Foreground Bokeh
          p.vy = 3.2 + Math.random() * 2.2;
          p.vx = (Math.random() - 0.5) * 1.5;
          p.opacity = 0.25 + Math.random() * 0.2;
        } else if (depth === 1) {
          p.size = 16 + Math.random() * 10; // Midground Crystal Snowflake
          p.vy = 1.3 + Math.random() * 1.2;
          p.vx = (Math.random() - 0.5) * 0.8;
          p.opacity = 0.85 + Math.random() * 0.15;
        } else {
          p.size = 1.2 + Math.random() * 1.0; // Distant snow
          p.vy = 0.6 + Math.random() * 0.5;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.opacity = 0.35 + Math.random() * 0.25;
        }
        break;

      case 'sakura':
      case 'mai':
        if (depth === 2) {
          p.size = 36 + Math.random() * 18;
          p.vy = 2.4 + Math.random() * 1.5;
          p.vx = 0.8 + Math.random() * 1.5;
          p.opacity = 0.35 + Math.random() * 0.25;
        } else if (depth === 1) {
          p.size = 22 + Math.random() * 12;
          p.vy = 1.2 + Math.random() * 1.2;
          p.vx = 0.5 + Math.random() * 1.0;
          p.opacity = 0.85 + Math.random() * 0.15;
        } else {
          p.size = 12 + Math.random() * 6;
          p.vy = 0.6 + Math.random() * 0.6;
          p.vx = 0.3 + Math.random() * 0.5;
          p.opacity = 0.4 + Math.random() * 0.25;
        }
        break;

      case 'maple':
        if (depth === 2) {
          p.size = 40 + Math.random() * 22;
          p.vy = 2.6 + Math.random() * 1.6;
          p.vx = 0.8 + Math.random() * 1.6;
          p.opacity = 0.35 + Math.random() * 0.25;
        } else if (depth === 1) {
          p.size = 26 + Math.random() * 14;
          p.vy = 1.4 + Math.random() * 1.2;
          p.vx = 0.4 + Math.random() * 1.0;
          p.opacity = 0.85 + Math.random() * 0.15;
        } else {
          p.size = 14 + Math.random() * 8;
          p.vy = 0.7 + Math.random() * 0.6;
          p.vx = 0.2 + Math.random() * 0.5;
          p.opacity = 0.4 + Math.random() * 0.25;
        }
        break;

      case 'fireflies':
        p.size = 2.5 + Math.random() * 3.5;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = (Math.random() - 0.5) * 0.8;
        p.y = Math.random() * this.height;
        p.opacity = 0.2 + Math.random() * 0.7;
        break;
    }
    return p;
  }

  resume() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this._loop();
  }

  pause() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 16.67, 3);
    this.lastTime = now;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.wobble += p.wobbleSpeed * dt;
      p.tilt += p.tiltSpeed * dt;
      p.angle += p.spin * dt;

      if (this.mode === 'snow') {
        p.x += (p.vx + Math.sin(p.wobble) * (p.depth === 2 ? 1.0 : 0.5)) * dt;
        p.y += p.vy * dt;

        if (p.depth === 2) {
          // Large blurred Bokeh snowflake
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(235, 245, 255, ${p.opacity * 0.45})`;
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
          this.ctx.shadowBlur = 14;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        } else if (p.depth === 1) {
          // 6-arm Dendritic Crystal Snowflake Sprite
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.angle);
          this.ctx.globalAlpha = p.opacity;
          this.ctx.drawImage(this.offscreenSprites.snowflake, -p.size / 2, -p.size / 2, p.size, p.size);
          this.ctx.restore();
        } else {
          // Distant small flake
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(186, 215, 245, ${p.opacity})`;
          this.ctx.fill();
        }
      } else if (this.mode === 'sakura' || this.mode === 'mai') {
        p.x += (p.vx + Math.sin(p.wobble) * 1.3) * dt;
        p.y += p.vy * dt;

        const sprite = (this.mode === 'mai' || p.colorType === 'mai')
          ? this.offscreenSprites.mai
          : this.offscreenSprites.sakura;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);
        this.ctx.scale(Math.cos(p.tilt), 1); // 3D aerodynamic tumble
        this.ctx.globalAlpha = p.opacity;

        if (p.depth === 2) {
          this.ctx.shadowColor = p.colorType === 'mai' ? '#fbbf24' : '#f43f5e';
          this.ctx.shadowBlur = 12;
        }

        this.ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      } else if (this.mode === 'maple') {
        p.x += (p.vx + Math.sin(p.wobble) * 1.6) * dt;
        p.y += p.vy * dt;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);
        this.ctx.scale(Math.cos(p.tilt), 1);
        this.ctx.globalAlpha = p.opacity;

        if (p.depth === 2) {
          this.ctx.shadowColor = '#ea580c';
          this.ctx.shadowBlur = 14;
        }

        this.ctx.drawImage(this.offscreenSprites.maple, -p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      } else if (this.mode === 'fireflies') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const pulse = (Math.sin(p.wobble) + 1) / 2;
        const alpha = 0.15 + pulse * 0.75;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(234, 179, 8, ${alpha})`;
        this.ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
        this.ctx.shadowBlur = 12;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
      }

      if (this.mode !== 'fireflies') {
        if (p.y > this.height + 35 || p.x > this.width + 40 || p.x < -40) {
          const fresh = this._generateParticle(false);
          Object.assign(p, fresh);
        }
      }
    }

    this.rafId = requestAnimationFrame(() => this._loop());
  }
}
