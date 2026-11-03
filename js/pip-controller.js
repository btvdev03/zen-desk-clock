/**
 * ZenDesk Clock - Picture-in-Picture (PiP) Floating Widget Controller
 * Dual architecture: Document Picture-in-Picture (Chrome 111+) with Canvas Stream Video Fallback.
 */

export class PiPController {
  constructor() {
    this.pipWindow = null;
    this.canvas = null;
    this.ctx = null;
    this.video = null;
    this.isPiPActive = false;
    this.rafId = null;
    this.stateGetter = null; // Function to get current clock/pomodoro state

    this._initFallbackElements();
  }

  _initFallbackElements() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 200;
    this.ctx = this.canvas.getContext('2d');

    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.style.display = 'none';
    document.body.appendChild(this.video);

    this.video.addEventListener('leavepictureinpicture', () => {
      this.isPiPActive = false;
      this._stopCanvasLoop();
    });
  }

  setStateGetter(fn) {
    this.stateGetter = fn;
  }

  isSupported() {
    return ('documentPictureInPicture' in window) || ('pictureInPictureEnabled' in document);
  }

  async toggle() {
    if (this.isPiPActive) {
      await this.close();
      return false;
    } else {
      return await this.open();
    }
  }

  async open() {
    // 1. Try modern Document PiP
    if ('documentPictureInPicture' in window) {
      try {
        this.pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 180
        });

        // Copy styles
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            this.pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            this.pipWindow.document.head.appendChild(link);
          }
        });

        const container = document.createElement('div');
        container.className = 'pip-floating-box theme-dark';
        container.style.cssText = `
          width: 100%; height: 100%; display: flex; flex-direction: column;
          align-items: center; justify-content: center; background: #0a0a0c;
          color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
          user-select: none; padding: 12px; box-sizing: border-box;
        `;

        container.innerHTML = `
          <div id="pipTime" style="font-size: 2.8rem; font-weight: 700; letter-spacing: -1px; font-variant-numeric: tabular-nums;">00:00:00</div>
          <div id="pipPomo" style="font-size: 0.95rem; opacity: 0.85; margin-top: 6px; color: #38bdf8;">Focus 25:00</div>
        `;

        this.pipWindow.document.body.appendChild(container);
        this.pipWindow.document.body.style.margin = '0';
        this.pipWindow.document.body.style.overflow = 'hidden';

        this.isPiPActive = true;

        this.pipWindow.addEventListener('pagehide', () => {
          this.pipWindow = null;
          this.isPiPActive = false;
        });

        this._startDocPiPLoop();
        return true;
      } catch (err) {
        console.warn('Document PiP failed, falling back to Canvas PiP:', err);
      }
    }

    // 2. Fallback: Canvas Stream PiP
    if ('pictureInPictureEnabled' in document && this.video.requestPictureInPicture) {
      try {
        const stream = this.canvas.captureStream(30);
        this.video.srcObject = stream;
        await this.video.play();
        await this.video.requestPictureInPicture();
        this.isPiPActive = true;
        this._startCanvasLoop();
        return true;
      } catch (err) {
        console.error('Canvas PiP failed:', err);
        return false;
      }
    }

    alert('Picture-in-Picture is not supported in your browser.');
    return false;
  }

  async close() {
    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    this.isPiPActive = false;
    this._stopCanvasLoop();
  }

  _startDocPiPLoop() {
    const update = () => {
      if (!this.pipWindow || !this.isPiPActive) return;

      if (this.stateGetter) {
        const { timeStr, pomoStr } = this.stateGetter();
        const timeEl = this.pipWindow.document.getElementById('pipTime');
        const pomoEl = this.pipWindow.document.getElementById('pipPomo');
        if (timeEl) timeEl.textContent = timeStr;
        if (pomoEl) pomoEl.textContent = pomoStr;
      }

      this.rafId = requestAnimationFrame(update);
    };
    update();
  }

  _startCanvasLoop() {
    const draw = () => {
      if (!this.isPiPActive) return;

      const { timeStr, pomoStr } = this.stateGetter ? this.stateGetter() : { timeStr: '00:00:00', pomoStr: '' };

      // Background
      this.ctx.fillStyle = '#0a0a0c';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Time
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(timeStr, 200, 85);

      // Pomodoro info
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      this.ctx.fillText(pomoStr, 200, 150);

      this.rafId = requestAnimationFrame(draw);
    };
    draw();
  }

  _stopCanvasLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export const pipController = new PiPController();
