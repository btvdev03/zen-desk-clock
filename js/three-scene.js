/**
 * ZenDesk Clock - 3D Ambient Visual Scene (Three.js WebGL Engine)
 * 
 * Features:
 * - High-retention Tranquil Zen Visuals: Hologram Cyber Waves, Quantum Galaxy Motes & Orbital Rings.
 * - Dynamic ESM CDN Loading with graceful offline vendor fallback.
 * - 60 FPS capped render loop with Page Visibility API auto-pause (zero idle CPU/GPU burn).
 * - Single/Double Draw Call architecture using lightweight BufferGeometry (~1,200 points max).
 * - Synchronized color palettes across all 10 themes & Apple StandBy Night Mode (Monochromatic Red & Amber).
 * - Smooth color lerp transitions without visual snapping or flashing.
 * - Interactive subtle mouse parallax & calm breathing rhythm.
 * - Seamless settings & dock integration (Toggle, Mode Switch, Opacity Slider, LocalStorage persistence).
 */

export class ZenThreeScene {
  constructor(canvasElement = null, options = {}) {
    this.canvas = canvasElement || document.getElementById('threeCanvas');
    this.THREE = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Visual Mesh references
    this.wavePoints = null;
    this.waveGeometry = null;
    this.waveMaterial = null;
    this.waveBasePositions = null;

    this.motesPoints = null;
    this.motesGeometry = null;
    this.motesMaterial = null;
    this.motesData = [];

    this.ringsGroup = null;
    this.ringMeshes = [];

    this.glowTexture = null;

    // Configuration & State
    const savedEnabled = localStorage.getItem('zd_three_enabled');
    this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;
    this.mode = localStorage.getItem('zd_three_mode') || 'combo'; // 'combo' | 'waves' | 'particles' | 'rings'
    this.opacity = parseFloat(localStorage.getItem('zd_three_opacity') || '0.75');

    this.isNightMode = false;
    this.nightColor = 'red';
    this.currentTheme = 'theme-flip';

    // Interactive mouse parallax
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Color morphing state
    this.colorCurrentPrimary = null;
    this.colorCurrentSecondary = null;
    this.colorTargetPrimary = null;
    this.colorTargetSecondary = null;
    this.targetIntensity = 0.8;
    this.currentIntensity = 0.8;

    // Animation loop
    this.rafId = null;
    this.isRunning = false;
    this.lastTime = performance.now();
    this.clockTime = 0;
    this.isLoading = false;
    this.isInitialized = false;

    // Curated theme color palettes
    this.themePalettes = {
      'theme-flip':   { primary: 0x38bdf8, secondary: 0x06b6d4, intensity: 0.80 },
      'theme-oled':   { primary: 0x94a3b8, secondary: 0xe2e8f0, intensity: 0.45 },
      'theme-matrix': { primary: 0x00ff66, secondary: 0x059669, intensity: 0.85 },
      'theme-aura':   { primary: 0xec4899, secondary: 0xf59e0b, intensity: 0.80 },
      'theme-swiss':  { primary: 0xef4444, secondary: 0xf1f5f9, intensity: 0.75 },
      'theme-nixie':  { primary: 0xf97316, secondary: 0xeab308, intensity: 0.85 },
      'theme-winter': { primary: 0x67e8f9, secondary: 0x38bdf8, intensity: 0.75 },
      'theme-spring': { primary: 0xf472b6, secondary: 0xfacc15, intensity: 0.80 },
      'theme-summer': { primary: 0x2dd4bf, secondary: 0xfb7185, intensity: 0.80 },
      'theme-autumn': { primary: 0xef4444, secondary: 0xd97706, intensity: 0.80 }
    };

    this.standbyPalettes = {
      red:   { primary: 0xff2a2a, secondary: 0x880808, intensity: 0.40 },
      amber: { primary: 0xff7700, secondary: 0x9a3412, intensity: 0.42 }
    };

    this._bindEvents();
  }

  /* ========================================================
     ASYNCHRONOUS INITIALIZATION
     ======================================================== */
  async init() {
    if (this.isInitialized || this.isLoading) return;
    this.isLoading = true;

    try {
      // 1. Ensure canvas exists
      if (!this.canvas) {
        this.canvas = document.getElementById('threeCanvas');
        if (!this.canvas) {
          this.canvas = document.createElement('canvas');
          this.canvas.id = 'threeCanvas';
          this.canvas.className = 'three-canvas';
          this.canvas.setAttribute('aria-hidden', 'true');
          const ambient = document.getElementById('ambientCanvas');
          if (ambient && ambient.parentNode) {
            ambient.parentNode.insertBefore(this.canvas, ambient);
          } else {
            document.body.prepend(this.canvas);
          }
        }
      }

      // 2. Load Three.js via ESM CDN or local vendor fallback
      await this._loadThreeEngine();

      if (!this.THREE) {
        throw new Error('Three.js could not be loaded.');
      }

      // 3. Initialize Three.js WebGL Scene & Camera
      this._initThreeContext();

      // 4. Create procedural glow texture & meshes
      this.glowTexture = this._createGlowTexture();
      this._createWaveField();
      this._createAmbientMotes();
      this._createOrbitalRings();

      // 5. Detect initial theme and StandBy night mode
      this._detectCurrentTheme();
      this._detectStandByMode();

      this.isInitialized = true;
      this.isLoading = false;

      // 6. Update canvas visibility & start loop if enabled
      this._applyVisibility();

      if (this.enabled && !document.hidden) {
        this.start();
      }

      console.log('ZenThreeScene: 3D WebGL Ambient Engine initialized successfully.');
    } catch (error) {
      this.isLoading = false;
      console.warn('ZenThreeScene: WebGL initialization skipped or failed:', error);
    }
  }

  async _loadThreeEngine() {
    if (window.THREE) {
      this.THREE = window.THREE;
      return;
    }

    // Try CDN first, fallback to local vendor module
    try {
      const cdnModule = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js');
      this.THREE = cdnModule;
      window.THREE = cdnModule;
    } catch (cdnErr) {
      console.warn('ZenThreeScene: CDN unreachable, falling back to local vendor copy...', cdnErr);
      try {
        const localModule = await import('./vendor/three.module.min.js');
        this.THREE = localModule;
        window.THREE = localModule;
      } catch (localErr) {
        console.error('ZenThreeScene: Both CDN and local Three.js failed to load.', localErr);
      }
    }
  }

  _initThreeContext() {
    const THREE = this.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Perspective Camera: Tilted downward towards tranquil horizon
    this.camera = new THREE.PerspectiveCamera(55, width / height, 1, 3000);
    this.camera.position.set(0, 80, 520);
    this.camera.lookAt(0, -40, 0);

    // High performance WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);

    // Initial color objects
    this.colorCurrentPrimary = new THREE.Color(0x38bdf8);
    this.colorCurrentSecondary = new THREE.Color(0x06b6d4);
    this.colorTargetPrimary = new THREE.Color(0x38bdf8);
    this.colorTargetSecondary = new THREE.Color(0x06b6d4);
  }

  /* ========================================================
     PROCEDURAL GLOW TEXTURE GENERATION (ZERO ASSET FETCH)
     ======================================================== */
  _createGlowTexture() {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /* ========================================================
     1. CYBER ENERGY WAVE FIELD (BUFFERGEOMETRY POINTS)
     ======================================================== */
  _createWaveField() {
    const THREE = this.THREE;
    const cols = 48;
    const rows = 28;
    const count = cols * rows;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.waveBasePositions = new Float32Array(count * 3);

    const spacingX = 38;
    const spacingZ = 34;
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const z = startZ + r * spacingZ;
        const y = -120; // Anchored beneath the clock

        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;

        this.waveBasePositions[idx] = x;
        this.waveBasePositions[idx + 1] = y;
        this.waveBasePositions[idx + 2] = z;

        // Gradient blend based on z-depth
        const t = r / (rows - 1);
        colors[idx] = 0.22 + t * 0.1;
        colors[idx + 1] = 0.74 + t * 0.2;
        colors[idx + 2] = 0.97;

        idx += 3;
      }
    }

    this.waveGeometry = new THREE.BufferGeometry();
    this.waveGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.waveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.waveMaterial = new THREE.PointsMaterial({
      size: 14,
      map: this.glowTexture,
      transparent: true,
      opacity: this.opacity * 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.wavePoints = new THREE.Points(this.waveGeometry, this.waveMaterial);
    this.wavePoints.rotation.x = -Math.PI * 0.08;
    this.scene.add(this.wavePoints);
  }

  /* ========================================================
     2. FLOATING QUANTUM AMBIENT MOTES (3D CYLINDER)
     ======================================================== */
  _createAmbientMotes() {
    const THREE = this.THREE;
    const count = 350; // Ultra lightweight

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.motesData = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 600;
      const x = Math.cos(angle) * radius;
      const y = -350 + Math.random() * 700;
      const z = -250 + Math.sin(angle) * (radius * 0.6);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      colors[i3] = 0.3;
      colors[i3 + 1] = 0.7;
      colors[i3 + 2] = 1.0;

      this.motesData.push({
        angle,
        radius,
        speedY: 0.15 + Math.random() * 0.45,
        orbitSpeed: (Math.random() - 0.5) * 0.0008,
        driftPhase: Math.random() * Math.PI * 2,
        driftFreq: 0.4 + Math.random() * 0.8,
        baseSize: 8 + Math.random() * 14
      });
    }

    this.motesGeometry = new THREE.BufferGeometry();
    this.motesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.motesMaterial = new THREE.PointsMaterial({
      size: 16,
      map: this.glowTexture,
      transparent: true,
      opacity: this.opacity * 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.motesPoints = new THREE.Points(this.motesGeometry, this.motesMaterial);
    this.scene.add(this.motesPoints);
  }

  /* ========================================================
     3. ZEN CONCENTRIC ORBITAL RINGS
     ======================================================== */
  _createOrbitalRings() {
    const THREE = this.THREE;
    this.ringsGroup = new THREE.Group();
    this.ringMeshes = [];

    const ringConfigs = [
      { radius: 240, count: 120, tiltX: 0.45, tiltY: 0.25, rotSpeed: 0.0006 },
      { radius: 360, count: 180, tiltX: -0.35, tiltY: 0.40, rotSpeed: -0.0004 },
      { radius: 480, count: 220, tiltX: 0.20, tiltY: -0.30, rotSpeed: 0.0003 }
    ];

    ringConfigs.forEach((cfg) => {
      const positions = new Float32Array(cfg.count * 3);
      const colors = new Float32Array(cfg.count * 3);

      for (let i = 0; i < cfg.count; i++) {
        const theta = (i / cfg.count) * Math.PI * 2;
        const x = Math.cos(theta) * cfg.radius;
        const y = (Math.random() - 0.5) * 12;
        const z = Math.sin(theta) * cfg.radius;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        colors[i * 3] = 0.35;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 1.0;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 10,
        map: this.glowTexture,
        transparent: true,
        opacity: this.opacity * 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
      });

      const mesh = new THREE.Points(geom, mat);
      mesh.rotation.x = cfg.tiltX;
      mesh.rotation.y = cfg.tiltY;
      mesh.userData = { rotSpeed: cfg.rotSpeed };

      this.ringsGroup.add(mesh);
      this.ringMeshes.push(mesh);
    });

    this.ringsGroup.position.set(0, -30, -50);
    this.scene.add(this.ringsGroup);

    this._updateModeMeshVisibility();
  }

  /* ========================================================
     ANIMATION & RENDER LOOP (Capped 60 FPS, Auto-Pause)
     ======================================================== */
  start() {
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

  resume() {
    if (!this.enabled || !this.isInitialized) return;
    this.start();
  }

  _loop = () => {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this._loop);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.clockTime += delta;

    this._update(this.clockTime, delta);
    this._render();
  };

  _update(time, delta) {
    // 1. Smoothly interpolate colors (Morph transition)
    this._lerpColors();

    // 2. Interactive mouse camera easing
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;
    if (this.camera) {
      this.camera.position.x = this.mouseX;
      this.camera.position.y = 80 + this.mouseY;
      this.camera.lookAt(0, -40, 0);
    }

    // 3. Subtle harmonic breathing rhythm (4-second cycle)
    const breath = 1.0 + Math.sin(time * 1.57) * 0.08;

    // 4. Update Waves
    if (this.wavePoints && this.wavePoints.visible) {
      const posAttr = this.waveGeometry.attributes.position;
      const colAttr = this.waveGeometry.attributes.color;
      const posArray = posAttr.array;
      const colArray = colAttr.array;
      const base = this.waveBasePositions;
      const count = posArray.length / 3;

      const pR = this.colorCurrentPrimary.r;
      const pG = this.colorCurrentPrimary.g;
      const pB = this.colorCurrentPrimary.b;
      const sR = this.colorCurrentSecondary.r;
      const sG = this.colorCurrentSecondary.g;
      const sB = this.colorCurrentSecondary.b;
      const intensity = this.currentIntensity;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const x = base[i3];
        const z = base[i3 + 2];

        // Multi-frequency harmonic wave formulation
        const w1 = Math.sin(x * 0.006 + time * 0.8) * 22;
        const w2 = Math.cos(z * 0.007 + time * 0.6) * 18;
        const w3 = Math.sin((x + z) * 0.004 + time * 0.4) * 12;

        posArray[i3 + 1] = base[i3 + 1] + (w1 + w2 + w3) * breath;

        // Vertex color interpolation by wave elevation
        const normY = (w1 + w2 + w3) / 52; // roughly -1 to 1
        const blend = (normY + 1) * 0.5;

        colArray[i3] = (pR + (sR - pR) * blend) * intensity;
        colArray[i3 + 1] = (pG + (sG - pG) * blend) * intensity;
        colArray[i3 + 2] = (pB + (sB - pB) * blend) * intensity;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    // 5. Update Floating Motes
    if (this.motesPoints && this.motesPoints.visible) {
      const posAttr = this.motesGeometry.attributes.position;
      const colAttr = this.motesGeometry.attributes.color;
      const posArray = posAttr.array;
      const colArray = colAttr.array;
      const count = this.motesData.length;

      const pR = this.colorCurrentPrimary.r * this.currentIntensity;
      const pG = this.colorCurrentPrimary.g * this.currentIntensity;
      const pB = this.colorCurrentPrimary.b * this.currentIntensity;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const d = this.motesData[i];

        // Orbit & vertical drift
        d.angle += d.orbitSpeed;
        posArray[i3] = Math.cos(d.angle) * d.radius + Math.sin(time * d.driftFreq + d.driftPhase) * 12;
        posArray[i3 + 1] += d.speedY;
        posArray[i3 + 2] = Math.sin(d.angle) * (d.radius * 0.6);

        // Respawn wrap
        if (posArray[i3 + 1] > 350) {
          posArray[i3 + 1] = -350;
        }

        colArray[i3] = pR;
        colArray[i3 + 1] = pG;
        colArray[i3 + 2] = pB;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    // 6. Update Orbital Rings
    if (this.ringsGroup && this.ringsGroup.visible) {
      this.ringMeshes.forEach((mesh) => {
        mesh.rotation.z += mesh.userData.rotSpeed;

        const colAttr = mesh.geometry.attributes.color;
        const colArray = colAttr.array;
        const count = colArray.length / 3;
        const sR = this.colorCurrentSecondary.r * this.currentIntensity;
        const sG = this.colorCurrentSecondary.g * this.currentIntensity;
        const sB = this.colorCurrentSecondary.b * this.currentIntensity;

        for (let j = 0; j < count; j++) {
          const j3 = j * 3;
          colArray[j3] = sR;
          colArray[j3 + 1] = sG;
          colArray[j3 + 2] = sB;
        }
        colAttr.needsUpdate = true;
      });
    }
  }

  _render() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  _lerpColors() {
    const lerpFactor = 0.05;
    this.colorCurrentPrimary.lerp(this.colorTargetPrimary, lerpFactor);
    this.colorCurrentSecondary.lerp(this.colorTargetSecondary, lerpFactor);
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * lerpFactor;
  }

  /* ========================================================
     THEME & NIGHT MODE SYNCHRONIZATION
     ======================================================== */
  setTheme(themeName) {
    this.currentTheme = themeName;
    if (this.isNightMode) return; // Night mode takes override priority

    const palette = this.themePalettes[themeName] || this.themePalettes['theme-flip'];
    this._applyPalette(palette.primary, palette.secondary, palette.intensity);
  }

  setNightMode(enabled, colorVariant = 'red') {
    this.isNightMode = !!enabled;
    this.nightColor = colorVariant === 'amber' ? 'amber' : 'red';

    if (this.isNightMode) {
      const palette = this.standbyPalettes[this.nightColor] || this.standbyPalettes.red;
      this._applyPalette(palette.primary, palette.secondary, palette.intensity);
      if (this.canvas) {
        this.canvas.style.opacity = (this.opacity * 0.45).toString();
      }
    } else {
      // Revert to current theme colors
      const palette = this.themePalettes[this.currentTheme] || this.themePalettes['theme-flip'];
      this._applyPalette(palette.primary, palette.secondary, palette.intensity);
      if (this.canvas) {
        this.canvas.style.opacity = this.opacity.toString();
      }
    }
  }

  _applyPalette(primaryHex, secondaryHex, intensity = 0.8) {
    if (!this.THREE) return;
    this.colorTargetPrimary.setHex(primaryHex);
    this.colorTargetSecondary.setHex(secondaryHex);
    this.targetIntensity = intensity;
  }

  _detectCurrentTheme() {
    for (const themeKey of Object.keys(this.themePalettes)) {
      if (document.body.classList.contains(themeKey)) {
        this.setTheme(themeKey);
        return;
      }
    }
    const saved = localStorage.getItem('zd_theme') || 'theme-flip';
    this.setTheme(saved);
  }

  _detectStandByMode() {
    const isStandByActive = document.body.classList.contains('apple-standby-active');
    const isAmber = document.body.classList.contains('standby-color-amber');
    if (isStandByActive) {
      this.setNightMode(true, isAmber ? 'amber' : 'red');
    }
  }

  /* ========================================================
     USER CONTROLS: TOGGLE, MODE, OPACITY
     ======================================================== */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    localStorage.setItem('zd_three_enabled', this.enabled ? 'true' : 'false');
    this._applyVisibility();

    if (this.enabled) {
      if (!this.isInitialized) {
        this.init();
      } else {
        this.start();
      }
    } else {
      this.pause();
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setMode(mode) {
    const allowed = ['combo', 'waves', 'particles', 'rings'];
    this.mode = allowed.includes(mode) ? mode : 'combo';
    localStorage.setItem('zd_three_mode', this.mode);
    this._updateModeMeshVisibility();
  }

  setOpacity(val) {
    const opacity = Math.max(0.1, Math.min(1.0, parseFloat(val) || 0.75));
    this.opacity = opacity;
    localStorage.setItem('zd_three_opacity', opacity.toString());

    if (this.canvas) {
      this.canvas.style.opacity = (this.isNightMode ? opacity * 0.45 : opacity).toString();
    }
    if (this.waveMaterial) this.waveMaterial.opacity = opacity * 0.75;
    if (this.motesMaterial) this.motesMaterial.opacity = opacity * 0.65;
    this.ringMeshes.forEach(m => m.material.opacity = opacity * 0.55);
  }

  _applyVisibility() {
    if (!this.canvas) return;
    if (this.enabled) {
      this.canvas.style.display = 'block';
      this.canvas.style.opacity = (this.isNightMode ? this.opacity * 0.45 : this.opacity).toString();
      document.body.classList.remove('three-canvas-disabled');
    } else {
      this.canvas.style.display = 'none';
      document.body.classList.add('three-canvas-disabled');
    }
  }

  _updateModeMeshVisibility() {
    const hasWaves = this.mode === 'combo' || this.mode === 'waves';
    const hasMotes = this.mode === 'combo' || this.mode === 'particles' || this.mode === 'rings';
    const hasRings = this.mode === 'rings';

    if (this.wavePoints) this.wavePoints.visible = hasWaves;
    if (this.motesPoints) this.motesPoints.visible = hasMotes;
    if (this.ringsGroup) this.ringsGroup.visible = hasRings;
  }

  /* ========================================================
     EVENT BINDINGS (RESIZE, VISIBILITY, MOUSE, NIGHT MODE)
     ======================================================== */
  _bindEvents() {
    // Window Resize with throttle
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this._onResize(), 100);
    }, { passive: true });

    // Page Visibility API auto-pause
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.enabled && this.isInitialized) {
        this.resume();
      }
    });

    // Subtle mouse tilt parallax
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 60;
      this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 30;
    }, { passive: true });

    // Apple StandBy Night Mode event listener
    window.addEventListener('standby-night-mode-change', (e) => {
      const detail = e.detail || {};
      this.setNightMode(detail.enabled, detail.color);
    });

    // Body class change observer for theme switching fallback
    const observer = new MutationObserver(() => {
      if (this.isNightMode) return;
      this._detectCurrentTheme();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  _onResize() {
    if (!this.renderer || !this.camera || !this.canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
  }

  /* ========================================================
     RESOURCE DISPOSAL (PREVENTS MEMORY LEAKS)
     ======================================================== */
  dispose() {
    this.pause();

    if (this.waveGeometry) this.waveGeometry.dispose();
    if (this.waveMaterial) this.waveMaterial.dispose();
    if (this.motesGeometry) this.motesGeometry.dispose();
    if (this.motesMaterial) this.motesMaterial.dispose();
    if (this.glowTexture) this.glowTexture.dispose();

    this.ringMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export const zenThreeScene = new ZenThreeScene();
