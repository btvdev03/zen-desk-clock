/**
 * ZenDesk Clock - Interactive Desktop Pet Companion Manager
 * 100% Offline Vector SVG Characters with Autonomous Behavior & Web Audio Synthesizer
 */

export const PET_QUOTES = [
  "Cố lên bạn ơi, hôm nay bạn làm việc chăm chỉ lắm rồi! 🌟",
  "Uống một ngụm nước ấm nha bạn ơi ~ 💧",
  "Bạn nhớ chớp mắt và nhìn ra xa thư giãn xíu nha! 👀",
  "Ngồi thẳng lưng lên một tí nào bạn ơi 🧘",
  "Tập trung sâu thêm một chút nữa nhé, mình tin bạn làm được! ⏰",
  "Gãi tai / gãi cằm cho mình một cái đi nà ~ 🐾",
  "Hôm nay thời tiết đẹp lắm, làm việc vui vẻ nha! ✨",
  "Meow~ Mình đang canh giờ cho bạn nè!",
  "Bạn vất vả rồi, nghỉ ngơi 2 phút cùng mình nhé ☕",
  "Mỗi bước tiến nhỏ hôm nay đều tạo nên thành công lớn! 🎯",
  "Hít thở sâu một hơi thật dài nào... Thấy khỏe hơn chưa? 🌿",
  "Bạn tuyệt vời lắm đấy, đừng quên điều đó nha! 💖"
];

export class DesktopPetManager {
  constructor() {
    this.storageEnabledKey = 'zd_pet_enabled';
    this.storageTypeKey = 'zd_pet_type';
    this.storageSoundKey = 'zd_pet_sound';

    this.enabled = localStorage.getItem(this.storageEnabledKey) !== 'false'; // default true
    this.petType = localStorage.getItem(this.storageTypeKey) || 'cat'; // cat, dog, penguin, bunny, dragon
    this.soundEnabled = localStorage.getItem(this.storageSoundKey) !== 'false';

    this.containerEl = null;
    this.speechEl = null;
    this.state = 'idle'; // idle, walk, sleep
    this.facing = 1; // 1 = right, -1 = left
    this.posX = 15; // percentage or px
    this.posY = 82; // px from bottom

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialLeft = 0;
    this.initialBottom = 0;

    this.behaviorIntervalId = null;
    this.idleTimerId = null;
    this.audioCtx = null;
    this.speechTimeoutId = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this._ensureDOM();
    this._bindEvents();
    this.render();

    if (this.enabled) {
      this._startBehaviorLoop();
      this._resetInactivityTimer();
    }
  }

  _ensureDOM() {
    let container = document.getElementById('desktopPetContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'desktopPetContainer';
      container.className = 'desktop-pet-container';
      container.setAttribute('role', 'button');
      container.setAttribute('aria-label', 'Thú cưng bàn làm việc');
      container.title = 'Nhấp để tương tác (hoặc kéo thả thú cưng đi khắp màn hình)';

      container.innerHTML = `
        <div class="pet-shadow"></div>
        <div class="pet-speech-bubble" id="petSpeechBubble"></div>
        <div class="pet-svg-wrap" id="petSvgWrap"></div>
      `;

      document.body.appendChild(container);
    }

    this.containerEl = container;
    this.speechEl = document.getElementById('petSpeechBubble');
    this.svgWrap = document.getElementById('petSvgWrap');
  }

  _bindEvents() {
    if (!this.containerEl) return;

    // Click / Tap to interact
    this.containerEl.addEventListener('click', (e) => {
      if (this.isDragging) return;
      this.interact();
    });

    // Pointer Drag & Drop (Unified Mouse + Touch)
    this.containerEl.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.containerEl.classList.add('is-dragging');
      this.containerEl.setPointerCapture(e.pointerId);

      const rect = this.containerEl.getBoundingClientRect();
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.initialLeft = rect.left;
      this.initialTop = rect.top;

      this._wakeUp();
    });

    this.containerEl.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      let newLeft = this.initialLeft + dx;
      let newTop = this.initialTop + dy;

      // Clamp within screen viewport
      const pad = 10;
      const maxLeft = window.innerWidth - 75 - pad;
      const maxTop = window.innerHeight - 75 - pad;

      newLeft = Math.max(pad, Math.min(newLeft, maxLeft));
      newTop = Math.max(pad, Math.min(newTop, maxTop));

      this.containerEl.style.left = `${newLeft}px`;
      this.containerEl.style.top = `${newTop}px`;
      this.containerEl.style.bottom = 'auto';
    });

    const stopDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.containerEl.classList.remove('is-dragging');
      try {
        this.containerEl.releasePointerCapture(e.pointerId);
      } catch (err) {}

      // Keep position and start gentle bounce
      this.containerEl.classList.add('is-jumping');
      setTimeout(() => this.containerEl.classList.remove('is-jumping'), 550);
    };

    this.containerEl.addEventListener('pointerup', stopDrag);
    this.containerEl.addEventListener('pointercancel', stopDrag);

    // Global activity resets inactivity sleep
    window.addEventListener('mousemove', () => this._handleUserActivity(), { passive: true });
    window.addEventListener('keydown', () => this._handleUserActivity(), { passive: true });
    window.addEventListener('touchstart', () => this._handleUserActivity(), { passive: true });
  }

  _handleUserActivity() {
    if (this.state === 'sleep') {
      this._wakeUp();
    }
    this._resetInactivityTimer();
  }

  _resetInactivityTimer() {
    clearTimeout(this.idleTimerId);
    this.idleTimerId = setTimeout(() => {
      if (this.enabled && !this.isDragging) {
        this._goToSleep();
      }
    }, 75000); // 75 seconds of quietness -> Sleep
  }

  _wakeUp() {
    if (this.state === 'sleep') {
      this.state = 'idle';
      this.containerEl.className = `desktop-pet-container state-idle pet-${this.petType}`;
      this.say("Oáp... Chào bạn, mình dậy rồi nè! 🐾");
    }
  }

  _goToSleep() {
    this.state = 'sleep';
    this.containerEl.className = `desktop-pet-container state-sleep pet-${this.petType}`;
    this._spawnZzz();
  }

  _spawnZzz() {
    if (this.state !== 'sleep' || !this.enabled) return;

    const zzz = document.createElement('div');
    zzz.className = 'pet-sleep-bubble';
    zzz.textContent = 'Zzz...';
    zzz.style.left = '42px';
    zzz.style.top = '-10px';

    this.containerEl.appendChild(zzz);
    setTimeout(() => zzz.remove(), 2200);

    // Schedule next Zzz if still asleep
    setTimeout(() => {
      if (this.state === 'sleep') this._spawnZzz();
    }, 3200);
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    localStorage.setItem(this.storageEnabledKey, this.enabled ? 'true' : 'false');
    this.render();

    if (this.enabled) {
      this._startBehaviorLoop();
      this._resetInactivityTimer();
    } else {
      this._stopBehaviorLoop();
    }
  }

  setPetType(type) {
    this.petType = type;
    localStorage.setItem(this.storageTypeKey, type);
    this.render();
    this.interact();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  render() {
    if (!this.containerEl) return;

    if (!this.enabled) {
      this.containerEl.classList.add('hidden');
      return;
    }

    this.containerEl.classList.remove('hidden');
    this.containerEl.className = `desktop-pet-container state-${this.state} pet-${this.petType}`;

    if (this.svgWrap) {
      this.svgWrap.innerHTML = this._getPetSvg(this.petType);
    }
  }

  interact() {
    if (!this.enabled) return;

    // Wake up if asleep
    this.state = 'idle';
    this.containerEl.className = `desktop-pet-container state-idle pet-${this.petType}`;

    // Play Jump animation
    this.containerEl.classList.remove('is-jumping');
    void this.containerEl.offsetWidth; // trigger reflow
    this.containerEl.classList.add('is-jumping');
    setTimeout(() => this.containerEl.classList.remove('is-jumping'), 550);

    // Emit heart particle burst
    this._spawnHearts();

    // Play synthesized chirp sound
    if (this.soundEnabled) {
      this._playChirpSound();
    }

    // Speech bubble quote
    const randQuote = PET_QUOTES[Math.floor(Math.random() * PET_QUOTES.length)];
    this.say(randQuote);
  }

  say(text) {
    if (!this.speechEl || !this.enabled) return;

    clearTimeout(this.speechTimeoutId);
    this.speechEl.textContent = text;
    this.speechEl.classList.add('show');

    this.speechTimeoutId = setTimeout(() => {
      this.speechEl.classList.remove('show');
    }, 4200);
  }

  _spawnHearts() {
    if (!this.containerEl) return;
    const icons = ['💖', '✨', '🐾', '🌸', '⭐'];

    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'pet-floating-heart';
      heart.textContent = icons[Math.floor(Math.random() * icons.length)];
      heart.style.left = `${20 + i * 14}px`;
      heart.style.top = '-5px';
      heart.style.setProperty('--tx', `${(i - 1) * 22}px`);
      heart.style.animationDelay = `${i * 0.12}s`;

      this.containerEl.appendChild(heart);
      setTimeout(() => heart.remove(), 1300);
    }
  }

  _playChirpSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Happy cheerful rising arpeggio / chirp
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // AudioContext policy handled gracefully
    }
  }

  _startBehaviorLoop() {
    this._stopBehaviorLoop();
    this.behaviorIntervalId = setInterval(() => {
      if (!this.enabled || this.isDragging || this.state === 'sleep') return;

      const dice = Math.random();
      if (dice < 0.4) {
        // Step a bit along the floor
        this._walkStep();
      } else if (dice < 0.7) {
        // Look around / idle
        this.state = 'idle';
        this.containerEl.className = `desktop-pet-container state-idle pet-${this.petType}`;
      } else if (dice < 0.85) {
        // Speech prompt
        const randQuote = PET_QUOTES[Math.floor(Math.random() * PET_QUOTES.length)];
        this.say(randQuote);
      }
    }, 11000);
  }

  _walkStep() {
    // Only walk if still on bottom shelf (hasn't been dragged high up)
    if (this.containerEl.style.top && parseInt(this.containerEl.style.top) < window.innerHeight - 150) {
      return;
    }

    this.state = 'walk';
    this.containerEl.className = `desktop-pet-container state-walk pet-${this.petType}`;

    const currentLeft = this.containerEl.offsetLeft;
    const screenW = window.innerWidth;

    // Flip direction if close to edge
    if (currentLeft > screenW - 140) {
      this.facing = -1;
    } else if (currentLeft < 80) {
      this.facing = 1;
    } else if (Math.random() < 0.35) {
      this.facing = -this.facing;
    }

    const stepDist = (35 + Math.random() * 45) * this.facing;
    const targetLeft = Math.max(30, Math.min(screenW - 100, currentLeft + stepDist));

    this.containerEl.style.transform = `scaleX(${this.facing})`;
    this.containerEl.style.transition = 'left 1.8s ease-in-out';
    this.containerEl.style.left = `${targetLeft}px`;

    setTimeout(() => {
      if (this.state === 'walk') {
        this.state = 'idle';
        this.containerEl.className = `desktop-pet-container state-idle pet-${this.petType}`;
      }
    }, 1800);
  }

  _stopBehaviorLoop() {
    if (this.behaviorIntervalId) {
      clearInterval(this.behaviorIntervalId);
      this.behaviorIntervalId = null;
    }
  }

  _getPetSvg(type) {
    switch (type) {
      case 'dog':
        return this._getDogSvg();
      case 'penguin':
        return this._getPenguinSvg();
      case 'bunny':
        return this._getBunnySvg();
      case 'dragon':
        return this._getDragonSvg();
      case 'cat':
      default:
        return this._getCatSvg();
    }
  }

  /* 1. MIMI THE CHONKY TABBY CAT */
  _getCatSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100">
        <!-- Tail -->
        <path class="pet-tail" d="M 22 75 C 5 70, 8 45, 18 42 C 22 40, 24 46, 20 52 C 16 58, 20 70, 28 75 Z" fill="#ea580c"/>
        <!-- Body -->
        <ellipse cx="50" cy="68" rx="30" ry="24" fill="#fb923c"/>
        <ellipse cx="50" cy="72" rx="20" ry="16" fill="#ffedd5"/>
        <!-- Paws -->
        <ellipse cx="36" cy="88" rx="8" ry="6" fill="#ffedd5"/>
        <ellipse cx="64" cy="88" rx="8" ry="6" fill="#ffedd5"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="24" fill="#fb923c"/>
        <!-- Ears -->
        <polygon class="pet-ear-left" points="30,28 36,10 46,24" fill="#ea580c"/>
        <polygon points="32,26 36,14 43,24" fill="#fecdd3"/>
        <polygon class="pet-ear-right" points="70,28 64,10 54,24" fill="#ea580c"/>
        <polygon points="68,26 64,14 57,24" fill="#fecdd3"/>
        <!-- Tabby Stripes -->
        <path d="M 45 22 L 50 28 L 55 22" stroke="#ea580c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Eyes -->
        <ellipse cx="40" cy="40" rx="3.5" ry="4.5" fill="#1e293b"/>
        <circle cx="41.5" cy="38.5" r="1.5" fill="#ffffff"/>
        <ellipse cx="60" cy="40" rx="3.5" ry="4.5" fill="#1e293b"/>
        <circle cx="61.5" cy="38.5" r="1.5" fill="#ffffff"/>
        <!-- Cheeks -->
        <ellipse cx="33" cy="45" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4"/>
        <ellipse cx="67" cy="45" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4"/>
        <!-- Nose & Mouth -->
        <polygon points="48,46 52,46 50,49" fill="#f43f5e"/>
        <path d="M 46 50 Q 50 53 50 50 Q 50 53 54 50" stroke="#78350f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Whiskers -->
        <line x1="28" y1="45" x2="16" y2="43" stroke="#fed7aa" stroke-width="1.5"/>
        <line x1="28" y1="48" x2="18" y2="49" stroke="#fed7aa" stroke-width="1.5"/>
        <line x1="72" y1="45" x2="84" y2="43" stroke="#fed7aa" stroke-width="1.5"/>
        <line x1="72" y1="48" x2="82" y2="49" stroke="#fed7aa" stroke-width="1.5"/>
      </svg>
    `;
  }

  /* 2. SHIBA THE HAPPY DOGE */
  _getDogSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100">
        <!-- Curly Tail -->
        <path class="pet-tail" d="M 22 70 C 8 60, 14 38, 26 44 C 32 48, 24 58, 26 68 Z" fill="#d97706"/>
        <!-- Body -->
        <ellipse cx="50" cy="68" rx="28" ry="22" fill="#f59e0b"/>
        <ellipse cx="50" cy="72" rx="18" ry="15" fill="#fef3c7"/>
        <!-- Paws -->
        <ellipse cx="36" cy="88" rx="8" ry="6" fill="#fef3c7"/>
        <ellipse cx="64" cy="88" rx="8" ry="6" fill="#fef3c7"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="23" fill="#f59e0b"/>
        <ellipse cx="50" cy="47" rx="16" ry="13" fill="#fef3c7"/>
        <!-- Triangular Ears -->
        <polygon class="pet-ear-left" points="30,26 34,8 45,22" fill="#d97706"/>
        <polygon points="32,24 35,12 43,22" fill="#fef3c7"/>
        <polygon class="pet-ear-right" points="70,26 66,8 55,22" fill="#d97706"/>
        <polygon points="68,24 65,12 57,22" fill="#fef3c7"/>
        <!-- Eyes & Eyebrow dots -->
        <ellipse cx="40" cy="38" rx="3.5" ry="4" fill="#1e293b"/>
        <circle cx="41.5" cy="36.5" r="1.5" fill="#ffffff"/>
        <circle cx="39" cy="31" r="2" fill="#fef3c7"/>
        <ellipse cx="60" cy="38" rx="3.5" ry="4" fill="#1e293b"/>
        <circle cx="61.5" cy="36.5" r="1.5" fill="#ffffff"/>
        <circle cx="61" cy="31" r="2" fill="#fef3c7"/>
        <!-- Nose & Happy Open Mouth with Tongue -->
        <ellipse cx="50" cy="44" rx="3.5" ry="2.5" fill="#1e293b"/>
        <path d="M 45 47 Q 50 51 55 47" stroke="#1e293b" stroke-width="1.8" fill="none"/>
        <path d="M 47 48 Q 50 57 53 48 Z" fill="#fb7185"/>
      </svg>
    `;
  }

  /* 3. PINGU THE SNOWY PENGUIN */
  _getPenguinSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100">
        <!-- Body -->
        <ellipse cx="50" cy="62" rx="26" ry="28" fill="#1e293b"/>
        <!-- White Belly -->
        <ellipse cx="50" cy="66" rx="18" ry="21" fill="#f8fafc"/>
        <!-- Orange Feet -->
        <ellipse cx="38" cy="88" rx="8" ry="4" fill="#ea580c"/>
        <ellipse cx="62" cy="88" rx="8" ry="4" fill="#ea580c"/>
        <!-- Wings -->
        <ellipse cx="22" cy="62" rx="6" ry="16" fill="#0f172a" transform="rotate(18, 22, 62)"/>
        <ellipse cx="78" cy="62" rx="6" ry="16" fill="#0f172a" transform="rotate(-18, 78, 62)"/>
        <!-- Eyes -->
        <ellipse cx="42" cy="45" rx="3.5" ry="4" fill="#1e293b"/>
        <circle cx="43.5" cy="43.5" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="45" rx="3.5" ry="4" fill="#1e293b"/>
        <circle cx="59.5" cy="43.5" r="1.5" fill="#ffffff"/>
        <!-- Beak -->
        <polygon points="46,49 54,49 50,56" fill="#f97316"/>
        <!-- Red Winter Beanie with White Pom-pom -->
        <path d="M 28 35 Q 50 20 72 35 Z" fill="#dc2626"/>
        <rect x="26" y="32" width="48" height="6" rx="3" fill="#ffffff"/>
        <circle cx="50" cy="18" r="7" fill="#ffffff"/>
      </svg>
    `;
  }

  /* 4. USAGI THE CUTE BUNNY */
  _getBunnySvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100">
        <!-- Tall Ears -->
        <ellipse class="pet-ear-left" cx="36" cy="18" rx="6" ry="18" fill="#f8fafc"/>
        <ellipse class="pet-ear-left" cx="36" cy="18" rx="3.5" ry="13" fill="#fbcfe8"/>
        <ellipse class="pet-ear-right" cx="64" cy="18" rx="6" ry="18" fill="#f8fafc"/>
        <ellipse class="pet-ear-right" cx="64" cy="18" rx="3.5" ry="13" fill="#fbcfe8"/>
        <!-- Body -->
        <ellipse cx="50" cy="68" rx="26" ry="22" fill="#f8fafc"/>
        <!-- Tail -->
        <circle cx="24" cy="74" r="7" fill="#ffffff"/>
        <!-- Paws -->
        <ellipse cx="38" cy="88" rx="7" ry="5" fill="#ffffff"/>
        <ellipse cx="62" cy="88" rx="7" ry="5" fill="#ffffff"/>
        <!-- Head -->
        <circle cx="50" cy="46" r="22" fill="#f8fafc"/>
        <!-- Eyes -->
        <ellipse cx="41" cy="44" rx="3.5" ry="4.5" fill="#be123c"/>
        <circle cx="42.5" cy="42.5" r="1.5" fill="#ffffff"/>
        <ellipse cx="59" cy="44" rx="3.5" ry="4.5" fill="#be123c"/>
        <circle cx="60.5" cy="42.5" r="1.5" fill="#ffffff"/>
        <!-- Cheeks -->
        <circle cx="34" cy="49" r="4" fill="#f43f5e" opacity="0.35"/>
        <circle cx="66" cy="49" r="4" fill="#f43f5e" opacity="0.35"/>
        <!-- Nose & Mouth -->
        <polygon points="48,50 52,50 50,52.5" fill="#fb7185"/>
        <path d="M 47 53 Q 50 56 53 53" stroke="#71717a" stroke-width="1.6" fill="none"/>
        <!-- Little Carrot in Hand -->
        <polygon points="66,74 74,62 78,66" fill="#ea580c"/>
        <path d="M 76 64 L 80 58 M 76 64 L 82 62" stroke="#22c55e" stroke-width="2"/>
      </svg>
    `;
  }

  /* 5. RYU THE LUCKY BABY DRAGON */
  _getDragonSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100">
        <!-- Wings -->
        <path d="M 22 45 Q 6 30 18 20 Q 26 28 28 42 Z" fill="#34d399"/>
        <path d="M 78 45 Q 94 30 82 20 Q 74 28 72 42 Z" fill="#34d399"/>
        <!-- Tail with golden flame tip -->
        <path class="pet-tail" d="M 24 72 C 10 65, 8 48, 16 42" stroke="#10b981" stroke-width="6" fill="none" stroke-linecap="round"/>
        <polygon points="12,38 18,34 22,42 14,44" fill="#facc15"/>
        <!-- Body -->
        <ellipse cx="50" cy="66" rx="26" ry="22" fill="#10b981"/>
        <ellipse cx="50" cy="70" rx="16" ry="14" fill="#a7f3d0"/>
        <!-- Feet -->
        <ellipse cx="36" cy="86" rx="7" ry="5" fill="#059669"/>
        <ellipse cx="64" cy="86" rx="7" ry="5" fill="#059669"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="23" fill="#10b981"/>
        <!-- Golden Horns -->
        <polygon points="36,24 32,8 42,20" fill="#facc15"/>
        <polygon points="64,24 68,8 58,20" fill="#facc15"/>
        <!-- Eyes -->
        <ellipse cx="40" cy="40" rx="4" ry="4.5" fill="#064e3b"/>
        <circle cx="41.5" cy="38" r="1.8" fill="#ffffff"/>
        <circle cx="43" cy="42" r="0.8" fill="#ffffff"/>
        <ellipse cx="60" cy="40" rx="4" ry="4.5" fill="#064e3b"/>
        <circle cx="61.5" cy="38" r="1.8" fill="#ffffff"/>
        <circle cx="63" cy="42" r="0.8" fill="#ffffff"/>
        <!-- Cheeks -->
        <circle cx="33" cy="46" r="3.5" fill="#fb7185" opacity="0.4"/>
        <circle cx="67" cy="46" r="3.5" fill="#fb7185" opacity="0.4"/>
        <!-- Snout & Tiny Smile -->
        <ellipse cx="50" cy="48" rx="8" ry="4" fill="#34d399"/>
        <circle cx="47" cy="47" r="1" fill="#047857"/>
        <circle cx="53" cy="47" r="1" fill="#047857"/>
        <path d="M 48 51 Q 50 53 52 51" stroke="#065f46" stroke-width="1.5" fill="none"/>
      </svg>
    `;
  }
}

export const desktopPetManager = new DesktopPetManager();
