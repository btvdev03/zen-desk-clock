/**
 * ZenDesk Clock - Interactive Desktop Pet Companion Manager (Masterpiece Kawaii Edition)
 * 100% Offline Vector SVG Characters with Autonomous Behavior, Petting Physics, Feeding & Web Audio Synthesizer
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
  "Bạn tuyệt vời lắm đấy, đừng quên điều đó nha! 💖",
  "Bạn tập trung đỉnh thật đấy, ngưỡng mộ ghê! 🔥",
  "Xoa đầu mình một cái để lấy hên nè ~ 🍀"
];

export const PET_SNACKS = {
  cat: '🐟',
  dog: '🦴',
  penguin: '🦐',
  bunny: '🥕',
  dragon: '💎'
};

export class DesktopPetManager {
  constructor() {
    this.storageEnabledKey = 'zd_pet_enabled';
    this.storageTypeKey = 'zd_pet_type';
    this.storageSoundKey = 'zd_pet_sound';
    this.storageFriendshipKey = 'zd_pet_friendship';

    this.enabled = localStorage.getItem(this.storageEnabledKey) !== 'false'; // default true
    this.petType = localStorage.getItem(this.storageTypeKey) || 'cat'; // cat, dog, penguin, bunny, dragon
    this.soundEnabled = localStorage.getItem(this.storageSoundKey) !== 'false';
    this.friendship = parseInt(localStorage.getItem(this.storageFriendshipKey) || '15', 10);

    this.containerEl = null;
    this.speechEl = null;
    this.svgWrap = null;
    this.moodBadgeEl = null;

    this.state = 'idle'; // idle, walk, sleep
    this.facing = 1; // 1 = right, -1 = left
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;

    this.pettingCount = 0;
    this.isPurring = false;
    this.purrTimeoutId = null;

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
      container.setAttribute('aria-label', 'Thú cưng bàn làm việc tương tác');
      container.title = 'Nhấp để nựng, Nhấp đúp để cho ăn, Kéo thả đi khắp màn hình';

      container.innerHTML = `
        <div class="pet-shadow"></div>
        <div class="pet-mood-badge" id="petMoodBadge">❤️ Thân thiết Lv.1</div>
        <div class="pet-speech-bubble" id="petSpeechBubble"></div>
        <div class="pet-svg-wrap" id="petSvgWrap"></div>
      `;

      document.body.appendChild(container);
    }

    this.containerEl = container;
    this.speechEl = document.getElementById('petSpeechBubble');
    this.svgWrap = document.getElementById('petSvgWrap');
    this.moodBadgeEl = document.getElementById('petMoodBadge');
  }

  _bindEvents() {
    if (!this.containerEl) return;

    // Click to interact
    this.containerEl.addEventListener('click', (e) => {
      if (this.isDragging) return;
      this.interact();
    });

    // Double-click to Feed treat
    this.containerEl.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.feedSnack();
    });

    // Petting / Scratching on gentle mouse movement over pet head
    this.containerEl.addEventListener('pointerenter', () => {
      this.pettingCount = 0;
    });

    this.containerEl.addEventListener('pointermove', (e) => {
      if (this.isDragging) return;
      this.pettingCount++;
      if (this.pettingCount > 12 && !this.isPurring) {
        this._startPurring();
      }
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
      const maxLeft = window.innerWidth - 85 - pad;
      const maxTop = window.innerHeight - 85 - pad;

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
      setTimeout(() => this.containerEl.classList.remove('is-jumping'), 580);
    };

    this.containerEl.addEventListener('pointerup', stopDrag);
    this.containerEl.addEventListener('pointercancel', stopDrag);

    // Global activity resets inactivity sleep
    window.addEventListener('mousemove', () => this._handleUserActivity(), { passive: true });
    window.addEventListener('keydown', () => this._handleUserActivity(), { passive: true });
    window.addEventListener('touchstart', () => this._handleUserActivity(), { passive: true });
  }

  _startPurring() {
    this.isPurring = true;
    this.containerEl.classList.add('is-purring');
    this._addFriendship(2);

    // Floating note / small heart
    this._spawnFloatingIcon(['🎵', '💕', '✨', '🐾']);

    if (this.soundEnabled) {
      this._playPurrSound();
    }

    clearTimeout(this.purrTimeoutId);
    this.purrTimeoutId = setTimeout(() => {
      this.isPurring = false;
      this.containerEl.classList.remove('is-purring');
      this.pettingCount = 0;
    }, 1500);
  }

  feedSnack() {
    if (!this.enabled) return;

    this._wakeUp();
    const snackIcon = PET_SNACKS[this.petType] || '🍬';

    // Spawn snack dropping down into mouth
    const snack = document.createElement('div');
    snack.className = 'pet-snack-drop';
    snack.textContent = snackIcon;
    snack.style.left = '32px';
    snack.style.top = '10px';
    this.containerEl.appendChild(snack);

    setTimeout(() => snack.remove(), 750);

    // Happy chomp jump
    setTimeout(() => {
      this.containerEl.classList.remove('is-jumping');
      void this.containerEl.offsetWidth;
      this.containerEl.classList.add('is-jumping');
      setTimeout(() => this.containerEl.classList.remove('is-jumping'), 580);

      this._addFriendship(5);
      this._spawnHearts();

      if (this.soundEnabled) {
        this._playChirpSound(true);
      }

      const treatsQuotes = [
        `Ngon quá! Cảm ơn bạn nhiều nha ${snackIcon} 😋`,
        `Thơm lừng luôn! Bạn chăm mình khéo quá à 💖`,
        `Được ăn ngon sướng quá đi thôi! Yêu bạn nhất ✨`,
        `Nạp năng lượng xong rồi, cùng bạn học/làm việc tiếp nào! 🔥`
      ];
      this.say(treatsQuotes[Math.floor(Math.random() * treatsQuotes.length)]);
    }, 400);
  }

  _addFriendship(points = 1) {
    this.friendship = Math.min(999, this.friendship + points);
    localStorage.setItem(this.storageFriendshipKey, String(this.friendship));
    this._updateMoodBadge();
  }

  _updateMoodBadge() {
    if (!this.moodBadgeEl) return;
    const lv = Math.floor(this.friendship / 20) + 1;
    let label = `❤️ Thân thiết Lv.${lv}`;
    if (lv >= 5) label = `👑 Tri kỷ Lv.${lv}`;
    else if (lv >= 3) label = `💖 Bé cưng Lv.${lv}`;
    this.moodBadgeEl.textContent = label;
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
      this.say("Oáp... Chào bạn, mình dậy đồng hành với bạn nè! 🐾");
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
    zzz.style.left = '48px';
    zzz.style.top = '-12px';

    this.containerEl.appendChild(zzz);
    setTimeout(() => zzz.remove(), 2400);

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
    this._updateMoodBadge();

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
    setTimeout(() => this.containerEl.classList.remove('is-jumping'), 580);

    // Friendship boost
    this._addFriendship(1);

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
    }, 4500);
  }

  _spawnHearts() {
    if (!this.containerEl) return;
    const icons = ['💖', '✨', '🐾', '🌸', '⭐', '💫'];

    for (let i = 0; i < 4; i++) {
      const heart = document.createElement('span');
      heart.className = 'pet-floating-heart';
      heart.textContent = icons[Math.floor(Math.random() * icons.length)];
      heart.style.left = `${22 + i * 13}px`;
      heart.style.top = '-6px';
      heart.style.setProperty('--tx', `${(i - 1.5) * 24}px`);
      heart.style.animationDelay = `${i * 0.11}s`;

      this.containerEl.appendChild(heart);
      setTimeout(() => heart.remove(), 1300);
    }
  }

  _spawnFloatingIcon(icons) {
    if (!this.containerEl) return;
    const icon = document.createElement('span');
    icon.className = 'pet-floating-heart';
    icon.textContent = icons[Math.floor(Math.random() * icons.length)];
    icon.style.left = '42px';
    icon.style.top = '-10px';
    icon.style.setProperty('--tx', `${(Math.random() - 0.5) * 30}px`);

    this.containerEl.appendChild(icon);
    setTimeout(() => icon.remove(), 1200);
  }

  _playChirpSound(isHappyMeal = false) {
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
      if (isHappyMeal) {
        // Melodic celebratory 4-note chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else {
        // Cheerful rising sweet chirp
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.07); // A5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16); // E6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {}
  }

  _playPurrSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.15);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  _startBehaviorLoop() {
    this._stopBehaviorLoop();
    this.behaviorIntervalId = setInterval(() => {
      if (!this.enabled || this.isDragging || this.state === 'sleep') return;

      const dice = Math.random();
      if (dice < 0.42) {
        // Step a bit along the floor
        this._walkStep();
      } else if (dice < 0.72) {
        // Look around / idle
        this.state = 'idle';
        this.containerEl.className = `desktop-pet-container state-idle pet-${this.petType}`;
      } else if (dice < 0.88) {
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

  /* 1. MIMI THE MASTERPIECE CHONKY GINGER TABBY CAT */
  _getCatSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mimiBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
          <radialGradient id="mimiBellyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="100%" stop-color="#fed7aa"/>
          </radialGradient>
          <linearGradient id="mimiBellGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </linearGradient>
          <radialGradient id="mimiEyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#34d399"/>
            <stop offset="50%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </radialGradient>
        </defs>
        <!-- Fluffy Curled Tail -->
        <path class="pet-tail" d="M 24 72 C 6 68, 6 40, 18 36 C 24 34, 26 42, 21 48 C 17 54, 22 68, 30 72 Z" fill="url(#mimiBodyGrad)"/>
        <path d="M 12 48 C 16 46, 20 48, 22 52" stroke="#c2410c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Plump Chonky Body -->
        <ellipse cx="50" cy="68" rx="31" ry="24" fill="url(#mimiBodyGrad)"/>
        <ellipse cx="50" cy="72" rx="20" ry="16" fill="url(#mimiBellyGrad)"/>
        <!-- Paws with Cream Beans -->
        <ellipse cx="34" cy="88" rx="8.5" ry="6" fill="#fffbeb"/>
        <ellipse cx="66" cy="88" rx="8.5" ry="6" fill="#fffbeb"/>
        <!-- Red Lucky Ribbon Collar with Golden Jingle Bell -->
        <path d="M 32 55 Q 50 63 68 55" stroke="#dc2626" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <circle class="pet-bell" cx="50" cy="62" r="6" fill="url(#mimiBellGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"/>
        <circle cx="50" cy="62" r="1.5" fill="#78350f"/>
        <line x1="50" y1="63.5" x2="50" y2="67" stroke="#78350f" stroke-width="1.2"/>
        <!-- Head -->
        <circle cx="50" cy="40" r="25" fill="url(#mimiBodyGrad)"/>
        <!-- Ears with Pink Inner Fluff -->
        <polygon class="pet-ear-left" points="29,26 35,6 47,21" fill="#ea580c"/>
        <polygon points="32,24 36,11 44,21" fill="#fecdd3"/>
        <polygon class="pet-ear-right" points="71,26 65,6 53,21" fill="#ea580c"/>
        <polygon points="68,24 64,11 56,21" fill="#fecdd3"/>
        <!-- Tabby Stripes on Crown -->
        <path d="M 44 19 L 50 25 L 56 19" stroke="#c2410c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Large Glossy Anime Emerald Eyes -->
        <ellipse cx="38" cy="39" rx="5.5" ry="6.5" fill="url(#mimiEyeGrad)"/>
        <circle cx="36" cy="37" r="2.2" fill="#ffffff"/>
        <circle cx="41" cy="42" r="1" fill="#ffffff"/>
        <ellipse cx="62" cy="39" rx="5.5" ry="6.5" fill="url(#mimiEyeGrad)"/>
        <circle cx="60" cy="37" r="2.2" fill="#ffffff"/>
        <circle cx="65" cy="42" r="1" fill="#ffffff"/>
        <!-- Blushing Rosy Cheeks -->
        <ellipse cx="29" cy="45" rx="4.5" ry="3" fill="#fb7185" opacity="0.45"/>
        <ellipse cx="71" cy="45" rx="4.5" ry="3" fill="#fb7185" opacity="0.45"/>
        <!-- Tiny Pink Nose & :3 Smile -->
        <polygon points="48,44 52,44 50,47" fill="#f43f5e"/>
        <path d="M 45 48 Q 50 52 50 48 Q 50 52 55 48" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Cute Whiskers -->
        <line x1="26" y1="44" x2="14" y2="41" stroke="#ffedd5" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="26" y1="48" x2="15" y2="50" stroke="#ffedd5" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="74" y1="44" x2="86" y2="41" stroke="#ffedd5" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="74" y1="48" x2="85" y2="50" stroke="#ffedd5" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }

  /* 2. SHIBA THE HAPPY JAPANESE BANDANA DOGE */
  _getDogSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shibaFurGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <radialGradient id="shibaEyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#78350f"/>
            <stop offset="70%" stop-color="#451a03"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </radialGradient>
          <linearGradient id="shibaBandanaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
        </defs>
        <!-- Cinnamon Curly Tail -->
        <path class="pet-tail" d="M 22 70 C 6 56, 12 34, 26 40 C 34 44, 26 56, 27 68 Z" fill="url(#shibaFurGrad)"/>
        <!-- Plump Shiba Body -->
        <ellipse cx="50" cy="68" rx="29" ry="23" fill="url(#shibaFurGrad)"/>
        <ellipse cx="50" cy="72" rx="19" ry="16" fill="#fffbeb"/>
        <!-- Paws -->
        <ellipse cx="35" cy="88" rx="8.5" ry="6" fill="#fffbeb"/>
        <ellipse cx="65" cy="88" rx="8.5" ry="6" fill="#fffbeb"/>
        <!-- Japanese Red Bandana around neck with white knot -->
        <path d="M 30 54 Q 50 64 70 54 L 56 68 Q 50 71 44 68 Z" fill="url(#shibaBandanaGrad)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
        <circle cx="50" cy="62" r="2.5" fill="#ffffff"/>
        <!-- Head -->
        <circle cx="50" cy="40" r="24" fill="url(#shibaFurGrad)"/>
        <ellipse cx="50" cy="46" rx="17" ry="14" fill="#fffbeb"/>
        <!-- Triangular Ears with Warm Cream Centers -->
        <polygon class="pet-ear-left" points="28,26 34,6 46,21" fill="#b45309"/>
        <polygon points="31,24 35,10 44,21" fill="#fffbeb"/>
        <polygon class="pet-ear-right" points="72,26 66,6 54,21" fill="#b45309"/>
        <polygon points="69,24 65,10 56,21" fill="#fffbeb"/>
        <!-- Signature White Bean Eyebrows -->
        <ellipse cx="38" cy="30" rx="3" ry="2.2" fill="#fffbeb"/>
        <ellipse cx="62" cy="30" rx="3" ry="2.2" fill="#fffbeb"/>
        <!-- Sparkling Chestnut Anime Eyes -->
        <ellipse cx="39" cy="38" rx="4.5" ry="5.5" fill="url(#shibaEyeGrad)"/>
        <circle cx="37" cy="36" r="1.8" fill="#ffffff"/>
        <circle cx="41" cy="41" r="0.9" fill="#ffffff"/>
        <ellipse cx="61" cy="38" rx="4.5" ry="5.5" fill="url(#shibaEyeGrad)"/>
        <circle cx="59" cy="36" r="1.8" fill="#ffffff"/>
        <circle cx="63" cy="41" r="0.9" fill="#ffffff"/>
        <!-- Soft Rosy Cheeks -->
        <circle cx="30" cy="44" r="4" fill="#fb7185" opacity="0.4"/>
        <circle cx="70" cy="44" r="4" fill="#fb7185" opacity="0.4"/>
        <!-- Black Button Nose & Big Happy Smile with Tongue -->
        <ellipse cx="50" cy="43" rx="4" ry="2.8" fill="#0f172a"/>
        <circle cx="49" cy="42" r="1" fill="#ffffff"/>
        <path d="M 44 47 Q 50 51 56 47" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M 46 48 Q 50 59 54 48 Z" fill="#fb7185"/>
      </svg>
    `;
  }

  /* 3. PINGU THE SNOWY EMPEROR BABY PENGUIN */
  _getPenguinSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pinguBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="pinguScarfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
        </defs>
        <!-- Chubby Body -->
        <ellipse cx="50" cy="62" rx="27" ry="29" fill="url(#pinguBodyGrad)"/>
        <!-- Pure White Downy Belly -->
        <ellipse cx="50" cy="67" rx="19" ry="22" fill="#ffffff"/>
        <!-- Orange Feet -->
        <ellipse cx="37" cy="89" rx="8.5" ry="4.5" fill="#f97316"/>
        <ellipse cx="63" cy="89" rx="8.5" ry="4.5" fill="#f97316"/>
        <!-- Flippers ready to hug / clap -->
        <ellipse cx="21" cy="62" rx="6.5" ry="17" fill="#1e293b" transform="rotate(22, 21, 62)"/>
        <ellipse cx="79" cy="62" rx="6.5" ry="17" fill="#1e293b" transform="rotate(-22, 79, 62)"/>
        <!-- Cozy Striped Winter Scarf -->
        <path d="M 28 54 Q 50 63 72 54 L 66 62 Q 50 68 34 62 Z" fill="url(#pinguScarfGrad)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
        <path d="M 62 58 L 68 76 L 61 77 L 57 60 Z" fill="url(#pinguScarfGrad)"/>
        <line x1="58" y1="76" x2="68" y2="76" stroke="#ffffff" stroke-width="2"/>
        <!-- Large Soulful Anime Eyes Looking Up -->
        <ellipse cx="41" cy="44" rx="5" ry="6" fill="#0f172a"/>
        <circle cx="39" cy="41.5" r="2" fill="#ffffff"/>
        <circle cx="43" cy="46" r="1" fill="#ffffff"/>
        <ellipse cx="59" cy="44" rx="5" ry="6" fill="#0f172a"/>
        <circle cx="57" cy="41.5" r="2" fill="#ffffff"/>
        <circle cx="61" cy="46" r="1" fill="#ffffff"/>
        <!-- Blushing Cheeks -->
        <ellipse cx="31" cy="48" rx="4" ry="2.5" fill="#fb7185" opacity="0.4"/>
        <ellipse cx="69" cy="48" rx="4" ry="2.5" fill="#fb7185" opacity="0.4"/>
        <!-- Cute Glossy Beak -->
        <polygon points="45,47 55,47 50,55" fill="#f97316" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.25))"/>
        <!-- Red Beanie with Fluffy Pom-Pom -->
        <path d="M 26 34 Q 50 18 74 34 Z" fill="#dc2626"/>
        <rect x="24" y="31" width="52" height="6.5" rx="3" fill="#ffffff"/>
        <circle cx="50" cy="17" r="7.5" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))"/>
      </svg>
    `;
  }

  /* 4. USAGI THE SNOW WHITE MOON BUNNY */
  _getBunnySvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bunnyFurGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#fdf2f8"/>
          </linearGradient>
          <linearGradient id="bunnyEarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fce7f3"/>
            <stop offset="100%" stop-color="#f472b6"/>
          </linearGradient>
          <radialGradient id="rubyEyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#fb7185"/>
            <stop offset="60%" stop-color="#e11d48"/>
            <stop offset="100%" stop-color="#881337"/>
          </radialGradient>
        </defs>
        <!-- Long Fluffy Ears with Physics Sway -->
        <ellipse class="pet-ear-left" cx="35" cy="17" rx="7" ry="19" fill="url(#bunnyFurGrad)"/>
        <ellipse class="pet-ear-left" cx="35" cy="17" rx="4" ry="14" fill="url(#bunnyEarGrad)"/>
        <ellipse class="pet-ear-right" cx="65" cy="17" rx="7" ry="19" fill="url(#bunnyFurGrad)"/>
        <ellipse class="pet-ear-right" cx="65" cy="17" rx="4" ry="14" fill="url(#bunnyEarGrad)"/>
        <!-- Sakura Flower Clip on Ear -->
        <circle cx="28" cy="28" r="4.5" fill="#f472b6"/>
        <circle cx="28" cy="28" r="2" fill="#fef08a"/>
        <!-- Pearlescent Body -->
        <ellipse cx="50" cy="68" rx="27" ry="23" fill="url(#bunnyFurGrad)"/>
        <!-- Fluffy Cotton Tail -->
        <circle cx="23" cy="74" r="8" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))"/>
        <!-- Paws holding Crunchy Carrot -->
        <ellipse cx="37" cy="88" rx="7.5" ry="5.5" fill="#ffffff"/>
        <ellipse cx="63" cy="88" rx="7.5" ry="5.5" fill="#ffffff"/>
        <!-- Head -->
        <circle cx="50" cy="44" r="23" fill="url(#bunnyFurGrad)"/>
        <!-- Sparkling Ruby Gemstone Eyes -->
        <ellipse cx="40" cy="42" rx="4.8" ry="5.8" fill="url(#rubyEyeGrad)"/>
        <circle cx="38" cy="39.5" r="2" fill="#ffffff"/>
        <circle cx="42" cy="45" r="1" fill="#ffffff"/>
        <ellipse cx="60" cy="42" rx="4.8" ry="5.8" fill="url(#rubyEyeGrad)"/>
        <circle cx="58" cy="39.5" r="2" fill="#ffffff"/>
        <circle cx="62" cy="45" r="1" fill="#ffffff"/>
        <!-- Rosy Blush -->
        <circle cx="31" cy="48" r="4.5" fill="#fb7185" opacity="0.4"/>
        <circle cx="69" cy="48" r="4.5" fill="#fb7185" opacity="0.4"/>
        <!-- Twitching Pink Nose & Gentle Smile -->
        <polygon points="48,48 52,48 50,51" fill="#fb7185"/>
        <path d="M 46 52 Q 50 55 54 52" stroke="#9ca3af" stroke-width="1.8" fill="none"/>
        <!-- Crunchy Sweet Carrot in Hands -->
        <polygon points="68,76 77,61 82,65" fill="#ea580c" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.25))"/>
        <path d="M 79 63 L 84 56 M 79 63 L 86 61" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `;
  }

  /* 5. RYU THE LUCKY JADE BABY DRAGON */
  _getDragonSvg() {
    return `
      <svg class="pet-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dragonJadeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
          <linearGradient id="dragonBellyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#facc15"/>
          </linearGradient>
          <linearGradient id="dragonWingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.8"/>
          </linearGradient>
          <radialGradient id="dragonEyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="60%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#082f49"/>
          </radialGradient>
        </defs>
        <!-- Translucent Fairy Dragon Wings -->
        <path d="M 22 45 Q 4 28 16 16 Q 26 26 28 42 Z" fill="url(#dragonWingGrad)" filter="drop-shadow(0 2px 4px rgba(6,182,212,0.4))"/>
        <path d="M 78 45 Q 96 28 84 16 Q 74 26 72 42 Z" fill="url(#dragonWingGrad)" filter="drop-shadow(0 2px 4px rgba(6,182,212,0.4))"/>
        <!-- Lucky Curled Dragon Tail with Golden Flame -->
        <path class="pet-tail" d="M 24 72 C 8 64, 6 44, 16 38" stroke="#10b981" stroke-width="7" fill="none" stroke-linecap="round"/>
        <polygon points="11,35 18,30 22,39 14,41" fill="#facc15" filter="drop-shadow(0 0 6px #facc15)"/>
        <!-- Jade Body -->
        <ellipse cx="50" cy="67" rx="27" ry="23" fill="url(#dragonJadeGrad)"/>
        <!-- Segmented Golden Belly Plates -->
        <ellipse cx="50" cy="71" rx="17" ry="15" fill="url(#dragonBellyGrad)"/>
        <line x1="38" y1="67" x2="62" y2="67" stroke="#ca8a04" stroke-width="1.2" opacity="0.6"/>
        <line x1="40" y1="73" x2="60" y2="73" stroke="#ca8a04" stroke-width="1.2" opacity="0.6"/>
        <!-- Feet -->
        <ellipse cx="36" cy="87" rx="7.5" ry="5.5" fill="#047857"/>
        <ellipse cx="64" cy="87" rx="7.5" ry="5.5" fill="#047857"/>
        <!-- Head -->
        <circle cx="50" cy="41" r="24" fill="url(#dragonJadeGrad)"/>
        <!-- Polished Golden Antler Horns with Star Glint -->
        <polygon points="36,22 30,6 42,18" fill="#facc15" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
        <polygon points="64,22 70,6 58,18" fill="#facc15" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
        <circle cx="30" cy="6" r="1.5" fill="#ffffff"/>
        <!-- Radiant Sapphire Anime Eyes with Star Sparkle -->
        <ellipse cx="40" cy="39" rx="4.8" ry="5.5" fill="url(#dragonEyeGrad)"/>
        <circle cx="38" cy="36.5" r="2" fill="#ffffff"/>
        <circle cx="42" cy="42" r="1" fill="#ffffff"/>
        <ellipse cx="60" cy="39" rx="4.8" ry="5.5" fill="url(#dragonEyeGrad)"/>
        <circle cx="58" cy="36.5" r="2" fill="#ffffff"/>
        <circle cx="62" cy="42" r="1" fill="#ffffff"/>
        <!-- Cute Cheeks -->
        <circle cx="32" cy="46" r="4" fill="#fb7185" opacity="0.45"/>
        <circle cx="68" cy="46" r="4" fill="#fb7185" opacity="0.45"/>
        <!-- Snout & Tiny Dragon Smile -->
        <ellipse cx="50" cy="47" rx="9" ry="4.5" fill="#6ee7b7"/>
        <circle cx="47" cy="46" r="1.2" fill="#047857"/>
        <circle cx="53" cy="46" r="1.2" fill="#047857"/>
        <path d="M 47 50 Q 50 53 53 50" stroke="#065f46" stroke-width="1.8" fill="none"/>
      </svg>
    `;
  }
}

export const desktopPetManager = new DesktopPetManager();
