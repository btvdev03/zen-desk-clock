/**
 * ZenDesk Clock - Seasonal Events & Custom Countdown Milestone Engine
 * Built-in Astronomical Lunar New Year (Tết 2025-2035), Noel, New Year + Custom User Events.
 */

export class EventCountdownManager {
  constructor() {
    this.storageKey = 'zd_custom_events';
    this.activeEventIndex = 0;
    this.events = [];
    this.listeners = [];

    this._initEvents();
  }

  _getBuiltInEvents() {
    const currentYear = new Date().getFullYear();

    // Lunar New Year (Tết Nguyên Đán) calendar lookup
    const tetDates = {
      2025: { date: '2025-01-29T00:00:00', name: 'Tết Ất Tỵ 2025 🐍' },
      2026: { date: '2026-02-17T00:00:00', name: 'Tết Bính Ngọ 2026 🐴' },
      2027: { date: '2027-02-06T00:00:00', name: 'Tết Đinh Mùi 2027 🐐' },
      2028: { date: '2028-01-26T00:00:00', name: 'Tết Mậu Thân 2028 🐵' },
      2029: { date: '2029-02-13T00:00:00', name: 'Tết Kỷ Dậu 2029 🐔' },
      2030: { date: '2030-02-03T00:00:00', name: 'Tết Canh Tuất 2030 🐶' }
    };

    // Find upcoming Tết
    const now = new Date();
    let upcomingTet = tetDates[currentYear];
    if (upcomingTet && new Date(upcomingTet.date) < now) {
      upcomingTet = tetDates[currentYear + 1];
    }
    if (!upcomingTet) {
      upcomingTet = { date: `${currentYear + 1}-02-10T00:00:00`, name: `Tết ${currentYear + 1}` };
    }

    // Christmas (Dec 25)
    let noelDate = new Date(currentYear, 11, 25, 0, 0, 0);
    if (noelDate < now) {
      noelDate = new Date(currentYear + 1, 11, 25, 0, 0, 0);
    }

    // New Year (Jan 1)
    let newYearDate = new Date(currentYear + 1, 0, 1, 0, 0, 0);

    return [
      {
        id: 'builtin-noel',
        title: 'Giáng Sinh',
        targetDate: noelDate.toISOString(),
        icon: '🎄',
        isBuiltIn: true
      },
      {
        id: 'builtin-tet',
        title: upcomingTet.name,
        targetDate: new Date(upcomingTet.date).toISOString(),
        icon: '🧧',
        isBuiltIn: true
      },
      {
        id: 'builtin-newyear',
        title: `Năm Mới ${newYearDate.getFullYear()}`,
        targetDate: newYearDate.toISOString(),
        icon: '🎆',
        isBuiltIn: true
      }
    ];
  }

  _initEvents() {
    const saved = localStorage.getItem(this.storageKey);
    let customEvents = [];
    if (saved) {
      try {
        customEvents = JSON.parse(saved);
      } catch (e) {
        customEvents = [];
      }
    }

    const builtIns = this._getBuiltInEvents();
    this.events = [...builtIns, ...customEvents];

    // Filter out past custom events older than 2 days, sort by nearest
    const now = new Date().getTime();
    this.events = this.events.filter(e => {
      const diff = new Date(e.targetDate).getTime() - now;
      return diff > -172800000; // within 2 days after
    });

    this.events.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
  }

  getEvents() {
    return this.events;
  }

  addCustomEvent(title, targetDateStr, icon = '🎯') {
    const newEvent = {
      id: 'custom-' + Date.now(),
      title: title.trim(),
      targetDate: new Date(targetDateStr).toISOString(),
      icon: icon || '🎯',
      isBuiltIn: false
    };

    this.events.push(newEvent);
    this.events.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    this._saveCustom();
    this._notify();
    return newEvent;
  }

  deleteCustomEvent(id) {
    this.events = this.events.filter(e => e.id !== id || e.isBuiltIn);
    this._saveCustom();
    if (this.activeEventIndex >= this.events.length) {
      this.activeEventIndex = 0;
    }
    this._notify();
  }

  _saveCustom() {
    const customs = this.events.filter(e => !e.isBuiltIn);
    localStorage.setItem(this.storageKey, JSON.stringify(customs));
  }

  cycleActiveEvent() {
    if (this.events.length === 0) return null;
    this.activeEventIndex = (this.activeEventIndex + 1) % this.events.length;
    this._notify();
    return this.getActiveCountdown();
  }

  getActiveCountdown() {
    if (this.events.length === 0) return null;

    const evt = this.events[this.activeEventIndex] || this.events[0];
    const now = new Date().getTime();
    const target = new Date(evt.targetDate).getTime();
    const diff = target - now;

    // Clean up title: strip emojis if custom event title has any
    const cleanTitle = (evt.title || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .trim();

    const pad = (n) => String(n).padStart(2, '0');

    if (diff <= 0) {
      return {
        event: evt,
        icon: evt.icon || '🎯',
        title: cleanTitle,
        countdownBadge: 'Hôm nay!',
        compactBadge: 'Hôm nay',
        isReached: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        formatted: `${evt.icon || '🎯'} ${cleanTitle}: Đã đến rồi! 🎉`,
        shortFormatted: `${cleanTitle}: Hôm nay!`,
        compactFormatted: `${cleanTitle}: Hôm nay`
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let countdownBadge = '';
    let compactBadge = '';
    if (days > 0) {
      countdownBadge = `Còn ${days} ngày`;
      compactBadge = `${days}n`;
    } else {
      countdownBadge = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      compactBadge = `${pad(hours)}:${pad(minutes)}`;
    }

    let detailedFormatted = '';
    if (days > 0) {
      detailedFormatted = `${evt.icon || '🎯'} ${cleanTitle}: còn ${days} ngày ${pad(hours)} giờ ${pad(minutes)} phút`;
    } else {
      detailedFormatted = `${evt.icon || '🎯'} ${cleanTitle}: còn ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return {
      event: evt,
      icon: evt.icon || '🎯',
      title: cleanTitle,
      countdownBadge,
      compactBadge,
      isReached: false,
      days,
      hours,
      minutes,
      seconds,
      formatted: detailedFormatted,
      shortFormatted: `${cleanTitle}: ${countdownBadge}`,
      compactFormatted: `${cleanTitle}: ${compactBadge}`
    };
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  _notify() {
    const data = this.getActiveCountdown();
    this.listeners.forEach(fn => fn(data));
  }
}

export const eventCountdownManager = new EventCountdownManager();
