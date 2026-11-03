/**
 * ZenDesk Clock - Bauhaus / Swiss Modern Analog Clock Renderer
 * Continuous smooth sweeping red second hand with iconic circular indicator.
 */

export class AnalogRenderer {
  constructor(container) {
    this.container = container;
    this.isBuilt = false;
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.build();
  }

  build() {
    this.container.innerHTML = `
      <div class="analog-dial">
        <div class="analog-ticks" id="analogTicks"></div>
        <div class="analog-center-shadow"></div>
        <div class="analog-hand hour-hand" id="analogHour"></div>
        <div class="analog-hand minute-hand" id="analogMinute"></div>
        <div class="analog-hand second-hand" id="analogSecond">
          <div class="swiss-dot"></div>
        </div>
        <div class="analog-cap"></div>
      </div>
    `;

    const ticksContainer = this.container.querySelector('#analogTicks');
    for (let i = 0; i < 60; i++) {
      const tick = document.createElement('div');
      tick.className = i % 5 === 0 ? 'tick tick-major' : 'tick tick-minor';
      tick.style.transform = `rotate(${i * 6}deg)`;
      ticksContainer.appendChild(tick);
    }

    this.hourHand = this.container.querySelector('#analogHour');
    this.minuteHand = this.container.querySelector('#analogMinute');
    this.secondHand = this.container.querySelector('#analogSecond');
    this.isBuilt = true;
  }

  update(timeData) {
    if (!this.isBuilt) return;

    const { hoursRaw, minutesRaw, secondsRaw, millisRaw } = timeData;

    // Fractional values for silky smooth continuous movement
    const exactSecond = secondsRaw + millisRaw / 1000;
    const exactMinute = minutesRaw + exactSecond / 60;
    const exactHour = (hoursRaw % 12) + exactMinute / 60;

    const secondDeg = exactSecond * 6;       // 360 / 60
    const minuteDeg = exactMinute * 6;       // 360 / 60
    const hourDeg = exactHour * 30;          // 360 / 12

    this.secondHand.style.transform = `rotate(${secondDeg}deg)`;
    this.minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    this.hourHand.style.transform = `rotate(${hourDeg}deg)`;
  }
}
