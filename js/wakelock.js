/**
 * ZenDesk Clock - Screen Wake Lock API Manager
 * Prevents screens/tablets from dimming or going to sleep during focus sessions.
 */

class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isActive = false;
    this.statusListeners = [];

    // Automatically re-request lock when returning to tab
    document.addEventListener('visibilitychange', async () => {
      if (this.isActive && document.visibilityState === 'visible' && this.wakeLock === null) {
        await this.requestLock();
      }
    });
  }

  isSupported() {
    return 'wakeLock' in navigator;
  }

  onStatusChange(fn) {
    this.statusListeners.push(fn);
  }

  _notify(active) {
    this.statusListeners.forEach(fn => fn(active));
  }

  async requestLock() {
    if (!this.isSupported()) {
      console.warn('Screen Wake Lock API not supported in this browser.');
      this._notify(false);
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isActive = true;
      this._notify(true);

      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
        if (!this.isActive) {
          this._notify(false);
        }
      });
      return true;
    } catch (err) {
      console.warn('Failed to acquire Wake Lock:', err);
      this.isActive = false;
      this._notify(false);
      return false;
    }
  }

  async releaseLock() {
    this.isActive = false;
    if (this.wakeLock !== null) {
      try {
        await this.wakeLock.release();
      } catch (err) {
        console.warn('Error releasing Wake Lock:', err);
      }
      this.wakeLock = null;
    }
    this._notify(false);
  }

  async toggle() {
    if (this.isActive && this.wakeLock) {
      await this.releaseLock();
      return false;
    } else {
      return await this.requestLock();
    }
  }
}

export const wakeLockManager = new WakeLockManager();
