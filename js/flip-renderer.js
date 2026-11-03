/**
 * ZenDesk Clock - 3D Mechanical Split-Flap Renderer
 * Recreates the iconic Solari di Udine / Fliqlo retro mechanical split-flap display.
 */

import { soundEngine } from './audio-synth.js';

export class FlipUnit {
  /**
   * @param {HTMLElement} container
   * @param {string} initialValue
   */
  constructor(container, initialValue = '00') {
    this.container = container;
    this.currentValue = initialValue;
    this._render();
  }

  _render() {
    this.container.classList.add('flip-card-unit');
    this.container.innerHTML = `
      <div class="flip-card-inner">
        <!-- Static resting faces -->
        <div class="card-face upper static"><span class="digit">${this.currentValue}</span></div>
        <div class="card-face lower static"><span class="digit">${this.currentValue}</span></div>

        <!-- Dynamic 3D flip flaps (active only during flip) -->
        <div class="card-flap top-flap" style="display: none;"><span class="digit">${this.currentValue}</span></div>
        <div class="card-flap bottom-flap" style="display: none;"><span class="digit">${this.currentValue}</span></div>

        <div class="flip-divider"></div>
      </div>
    `;

    this.upperStatic = this.container.querySelector('.upper.static .digit');
    this.lowerStatic = this.container.querySelector('.lower.static .digit');
    this.topFlap = this.container.querySelector('.top-flap');
    this.topFlapDigit = this.container.querySelector('.top-flap .digit');
    this.bottomFlap = this.container.querySelector('.bottom-flap');
    this.bottomFlapDigit = this.container.querySelector('.bottom-flap .digit');
  }

  flipTo(newValue, playSound = false) {
    if (this.currentValue === newValue) return;

    const oldValue = this.currentValue;
    this.currentValue = newValue;

    if (playSound) {
      soundEngine.playFlipClick();
    }

    // Upper static receives new value (hidden behind falling top-flap initially)
    this.upperStatic.textContent = newValue;
    // Lower static holds old value (waiting for bottom-flap to fall on it)
    this.lowerStatic.textContent = oldValue;

    // Top flap has old value and folds down
    this.topFlapDigit.textContent = oldValue;
    this.topFlap.style.display = 'block';

    // Bottom flap has new value and unfolds down
    this.bottomFlapDigit.textContent = newValue;
    this.bottomFlap.style.display = 'block';

    // Reset and trigger animations
    this.topFlap.classList.remove('flip-top');
    this.bottomFlap.classList.remove('flip-bottom');
    void this.container.offsetWidth; // Force DOM reflow

    this.topFlap.classList.add('flip-top');
    this.bottomFlap.classList.add('flip-bottom');

    const onComplete = () => {
      // Settle resting state: both static halves now show newValue
      this.lowerStatic.textContent = newValue;
      this.upperStatic.textContent = newValue;
      this.topFlap.style.display = 'none';
      this.bottomFlap.style.display = 'none';
      this.topFlap.classList.remove('flip-top');
      this.bottomFlap.classList.remove('flip-bottom');
      this.topFlap.removeEventListener('animationend', onComplete);
    };

    this.topFlap.addEventListener('animationend', onComplete, { once: true });
  }
}
