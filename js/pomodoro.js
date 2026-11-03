/**
 * ZenDesk Clock - Pomodoro Focus & Flow Mode Engine
 */

import { soundEngine } from './audio-synth.js';

export class PomodoroTimer {
  constructor() {
    this.mode = 'focus'; // 'focus', 'shortBreak', 'longBreak', 'flow'
    this.state = 'idle'; // 'idle', 'running', 'paused'
    
    // Default durations in seconds
    this.durations = {
      focus: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };

    this.timeLeft = this.durations.focus;
    this.flowSeconds = 0;
    this.completedSessions = 0;
    this.timerInterval = null;
    this.listeners = [];
  }

  setDuration(mode, minutes) {
    if (this.durations[mode] !== undefined) {
      this.durations[mode] = Math.max(1, minutes) * 60;
      if (this.mode === mode && this.state === 'idle') {
        this.timeLeft = this.durations[mode];
        this._notify();
      }
    }
  }

  setMode(newMode) {
    this.pause();
    this.mode = newMode;
    this.state = 'idle';
    if (newMode === 'flow') {
      this.flowSeconds = 0;
    } else {
      this.timeLeft = this.durations[newMode] || (25 * 60);
    }
    this._notify();
  }

  start() {
    if (this.state === 'running') return;

    this.state = 'running';
    clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this._tick();
    }, 1000);

    this._notify();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this._notify();
  }

  toggle() {
    if (this.state === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  reset() {
    this.pause();
    this.state = 'idle';
    if (this.mode === 'flow') {
      this.flowSeconds = 0;
    } else {
      this.timeLeft = this.durations[this.mode];
    }
    this._notify();
  }

  _tick() {
    if (this.mode === 'flow') {
      this.flowSeconds++;
      this._notify();
      return;
    }

    if (this.timeLeft > 0) {
      this.timeLeft--;
      this._notify();
    } else {
      this._complete();
    }
  }

  _complete() {
    this.pause();
    this.state = 'idle';

    // Play chime sound
    soundEngine.playChime();

    if (this.mode === 'focus') {
      this.completedSessions++;
      // Auto recommend break
      if (this.completedSessions % 4 === 0) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
    } else {
      this.setMode('focus');
    }

    this._notify(true); // completed flag
  }

  getProgress() {
    if (this.mode === 'flow') return 0;
    const total = this.durations[this.mode] || 1;
    return Math.min(1, Math.max(0, (total - this.timeLeft) / total));
  }

  getFormattedTime() {
    const totalSecs = this.mode === 'flow' ? this.flowSeconds : this.timeLeft;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  onUpdate(fn) {
    this.listeners.push(fn);
  }

  _notify(completed = false) {
    const data = {
      mode: this.mode,
      state: this.state,
      formattedTime: this.getFormattedTime(),
      progress: this.getProgress(),
      completedSessions: this.completedSessions,
      completed
    };
    this.listeners.forEach(fn => fn(data));
  }
}

export const pomodoroEngine = new PomodoroTimer();
