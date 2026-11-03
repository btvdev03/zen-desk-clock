/**
 * ZenDesk Clock - Core Time & Calendar Engine
 */

class ClockEngine {
  constructor() {
    this.is24Hour = true;
    this.showSeconds = true;
    this.tickListeners = [];
    this.lastSecond = -1;
    this.animationFrameId = null;
  }

  setFormat(is24Hour) {
    this.is24Hour = is24Hour;
  }

  toggleFormat() {
    this.is24Hour = !this.is24Hour;
    return this.is24Hour;
  }

  setShowSeconds(show) {
    this.showSeconds = show;
  }

  onTick(callback) {
    this.tickListeners.push(callback);
  }

  start() {
    const loop = () => {
      const now = new Date();
      const currentSecond = now.getSeconds();

      const timeData = this.getTimeData(now);

      // Notify listeners on continuous frame (for analog smooth sweep & accurate UI)
      this.tickListeners.forEach(fn => fn(timeData, currentSecond !== this.lastSecond));

      this.lastSecond = currentSecond;
      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getTimeData(date = new Date()) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const millis = date.getMilliseconds();
    let ampm = '';

    if (!this.is24Hour) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour should be 12
    }

    const pad = (n) => String(n).padStart(2, '0');

    // Day Progress calculation
    const totalSecondsInDay = 86400;
    const currentDaySeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    const dayProgressPercent = ((currentDaySeconds / totalSecondsInDay) * 100).toFixed(1);

    // Year Progress calculation (Memento Mori)
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const endOfYear = new Date(date.getFullYear() + 1, 0, 1);
    const yearProgressPercent = (((date - startOfYear) / (endOfYear - startOfYear)) * 100).toFixed(1);

    // ISO Week Number
    const isoWeek = this.getISOWeek(date);

    // Formatting date in Vietnamese
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const monthNames = [
      'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
    ];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const dateNum = date.getDate();
    const year = date.getFullYear();

    return {
      hoursStr: pad(hours),
      minutesStr: pad(minutes),
      secondsStr: pad(seconds),
      hoursRaw: hours,
      minutesRaw: minutes,
      secondsRaw: seconds,
      millisRaw: millis,
      ampm,
      is24Hour: this.is24Hour,
      dayProgressPercent,
      yearProgressPercent,
      isoWeek,
      dateFormatted: `${dayName}, ${dateNum} ${monthName}, ${year}`,
      dateShort: `${pad(dateNum)}/${pad(date.getMonth() + 1)}/${year}`
    };
  }

  getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }
}

export const clockEngine = new ClockEngine();
