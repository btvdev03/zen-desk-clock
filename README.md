# ⏳ ZenDesk Clock

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge&logo=githubpages" alt="Live Ready">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla%20JS)-orange?style=for-the-badge" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-purple?style=for-the-badge" alt="PWA Ready">
</p>

<p align="center">
  <b>Bàn Làm Việc Đồng Hồ & Không Gian Tập Trung Pomodoro Thẩm Mỹ Dành Cho Màn Hình Phụ, iPad & Góc Làm Việc.</b><br>
  <i>The Ultimate Aesthetic Productivity Desk Clock & Pomodoro Workspace for Secondary Screens, Tablets & Battlestations.</i><br>
  Được xây dựng 100% bằng chuẩn Web hiện đại. Không cần cài đặt node_modules, không cần build. Mở là chạy ngay hoặc Fork lên GitHub Pages trong 10 giây!
</p>

---

## 🌟 Highlights & Visual Themes

ZenDesk Clock transforms any spare display, old iPad, or secondary monitor into a distraction-free, aesthetic centerpiece for your workspace.

| 🕰️ Theme | Style Inspiration | Key Features |
| :--- | :--- | :--- |
| **Retro 3D Split-Flap** | Iconic Fliqlo / Solari di Udine | Realistic 60fps 3D falling-leaf cards, mechanical clicking sound |
| **Minimalist OLED Dark** | Apple StandBy / Dieter Rams | Pure True Black (`#000000`), anti-burn-in pixel shift |
| **Cyberpunk Matrix CRT** | Retro Terminal / Phosphor Green | Phosphor glow, scanlines overlay, vignette curve |
| **Sunset Aura Gradient** | Lofi Girl & Scandinavian Warmth | Floating blurred mesh gradients, soft breathing aura |
| **Bauhaus Swiss Analog** | Swiss Railway Clock (Mondaine) | Continuous sweeping red second hand with iconic circular indicator |
| **❄️ Winter Noel** | Real Snowy Lake Cabin & Frost | 4K Emerald Lake timber cabin, 6-arm crystal snowflake DoF, fireplace |
| **🌸 Spring Tết** | Real Peach & Golden Mai Blossom | 4K blooming blossoms, authentic fluttering petals, spring birds |
| **🌊 Summer Coast** | Real Tropical Sunset Beach | 4K golden sunset palms, wave reflections, summer fireflies |
| **🍁 Autumn Amber** | Real Kyoto/Canada Maple Forest | 4K vibrant red maple forest, 5-lobe swirling leaves, autumn rain |

---

## 🚀 Killer Features

- 📸 **Real 4K/HD Photography & Custom Local Wallpaper:**
  - **Curated 4K Real Nature Photos:** Stunning photography presets (Winter Lake Cabin, Spring Peach Blossom, Tết Golden Mai Blossom, Tropical Sunset Beach, Autumn Maple Forest, Cozy Study Cafe).
  - **Upload Your Own Photos (IndexedDB):** Seamlessly upload any wallpaper from your computer! Stored safely as binary Blobs in browser IndexedDB (zero quota-exceeded limit) and persists across restarts.
  - **Background Dimmer & Soft Bokeh Blur:** Adjust background brightness (0% - 90%) and soft blur (0px - 25px) to keep clock numerals crystal-clear.
- ❄️ **Photo-Realistic 3D Depth-of-Field Particle Engine:**
  - **Dendritic Crystal Snowflake:** True 6-arm hexagonal crystal snowflakes with feathered side branchlets.
  - **Spring Peach & Golden Mai Blossom Petals:** Velvety dual-tone gradient petals with natural V-notch cleft, delicate veins, and aerodynamic tumbling.
  - **5-Lobe Autumn Maple Leaf:** Authentic serrated leaf blades with stems and intricate vein networks.
  - **3D Depth-of-Field:** Large soft-blurred foreground Bokeh particles rushing past camera + crisp focused midground particles + faint distant motes.
- 🎯 **Milestone Countdown & Custom Events:**
  - Built-in astronomical countdown to **Tết Nguyên Đán** (2025-2035 with Can Chi: Ất Tỵ, Bính Ngọ, Đinh Mùi...), **Noel Giáng Sinh**, and **Năm Mới**.
  - **Create Your Own Events:** Add personalized milestones (Sinh nhật 🎂, Product Launch 🚀, Kỳ thi 🎓, Kỷ niệm 💍) with custom dates & emoji badges!
  - Real-time countdown chip on the Top Bar with 1-click cycle.
- 🌧️ **Zero-Asset Procedural Ambient Sounds (100% Web Audio API):**
  - 🔥 *Cozy Fireplace Crackle* (Brown noise low roar + stochastic Poisson wood pops)
  - 🌊 *Rhythmic Ocean Waves* (Pink noise modulated by dual slow-sine LFO filter sweeps)
  - 🌧️ *Gentle Rainstorm Generator* (Filtered acoustic rain drops)
  - 🦗 *Summer Night Crickets* (High-frequency amplitude-modulated chirps)
  - 🐦 *Spring Morning Birds* (Frequency-swept FM natural bird calls)
  - 🪵 *Brown Noise, Pink Noise & White Noise*
  - 🔔 *Tibetan Singing Bowl Chime* (Harmonic sine waves at 432 Hz for Pomodoro transitions)
- 🔋 **Screen Wake Lock API:** Prevents screen or iPad from dimming or sleeping while you work.
- 🪟 **Floating Picture-in-Picture (PiP):** Float a stylish mini-clock above VS Code, Cursor, or Notion.
- ⏱️ **Deep Work Pomodoro & Flow Mode:** Classic 25/5 intervals or limitless count-up stopwatch.
- 📊 **Memento Mori & Progress Trackers:** Real-time Day %, Year % and ISO Work Week display.
- 🧘 **Auto-Idle Zen Screen:** Mouse cursor and controls fade after 3.5s of inactivity.
- 📱 **Progressive Web App (PWA):** 100% offline, installable to iPad, iPhone, Android, Mac, or Windows.

---

## ⚡ 10-Second Quick Start

### 🌐 Option 1: 1-Click Deploy to GitHub Pages (Share with Friends!)
1. Click **Fork** at the top right of this repository to create your own copy.
2. In your forked repository, go to **Settings** ➔ **Pages**.
3. Under **Build and deployment** > **Branch**:
   - Select `main`
   - Select folder: `/ (root)`
4. Click **Save**.
5. Within 30 seconds, your personal clock is live at:
   ```
   https://<your-github-username>.github.io/<your-repo-name>/
   ```
   Share this URL with anyone, or open it full screen on your iPad!

### 💻 Option 2: Run Locally (Zero Setup)
No Node.js, Webpack, or npm required!
```bash
git clone https://github.com/<your-username>/zen-desk-clock.git
cd zen-desk-clock
```
- **Windows (1-Click Launch):** Double-click [`start.bat`](file:///c:/Dev/tools/zen-desk-clock/start.bat) — it uses Windows built-in PowerShell .NET web server and automatically opens your browser at `http://localhost:5500/`.
- **Any OS:** Run with Python, Node, or any local static server:
  ```bash
  # Python 3
  python -m http.server 5500
  
  # Or Node npx
  npx serve .
  ```

---

## ⌨️ Power-User Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| <kbd>Space</kbd> | **Start / Pause Timer** | Toggles Pomodoro focus or flow timer |
| <kbd>F</kbd> | **Toggle Fullscreen** | Expands to immersive borderless full screen |
| <kbd>T</kbd> | **Cycle Themes** | Flip ➔ OLED ➔ Matrix ➔ Aura ➔ Swiss Analog |
| <kbd>M</kbd> | **Cycle Ambient Sound** | Rain ➔ Brown Noise ➔ Pink ➔ White ➔ Mute |
| <kbd>P</kbd> | **Toggle PiP Widget** | Floats mini always-on-top clock window |
| <kbd>H</kbd> | **Zen Pure Mode** | Instantly hides all UI & docks |
| <kbd>S</kbd> | **Open Settings** | Toggle 12/24h format, seconds, sound volume |
| <kbd>Esc</kbd> | **Close Modal** | Closes active preferences overlay |

---

## 📐 Project Structure

```
zen-desk-clock/
├── index.html              # Semantic HTML5 single-page application
├── manifest.json           # Web App Manifest for PWA installation
├── sw.js                   # Service Worker with full offline caching
├── LICENSE                 # Open-source MIT License
├── README.md               # Documentation & deployment guide
├── css/
│   ├── main.css            # Layout, typography, dock, auto-idle animation
│   ├── flip.css            # 3D mechanical split-flap CSS transform engine
│   ├── analog.css          # Bauhaus Swiss Railway dial and continuous sweeping hand
│   └── themes.css          # 5 visual themes, CRT scanlines, animated aura mesh
├── js/
│   ├── app.js              # Application coordinator & keyboard handler
│   ├── clock.js            # Time engine (12/24h, ISO week, year progress)
│   ├── flip-renderer.js    # Split-flap DOM 3D transition controller
│   ├── analog-renderer.js  # 60fps continuous sweep analog clock
│   ├── pomodoro.js         # Focus timer, break cycles, SVG ring progress
│   ├── audio-synth.js      # Procedural Web Audio API soundscape generator
│   ├── pip-controller.js   # Document PiP & Canvas Stream Video PiP engine
│   ├── wakelock.js         # Screen Wake Lock API manager
│   └── quotes.js           # Curated Stoic & Deep Work motivational quotes
└── assets/
    └── icons/              # Scalable SVG PWA application icons
        ├── icon-192.svg
        └── icon-512.svg
```

---

## 📱 How to Use on iPad / Tablet as a Standby Desk Clock

1. Open your hosted GitHub Pages URL in **Safari** on iPad.
2. Tap the **Share** button (box with an arrow pointing up).
3. Tap **Add to Home Screen**.
4. Tap the newly added icon on your Home Screen. It will launch in **fullscreen borderless standalone mode**!
5. Place your iPad on a desk stand next to your keyboard or laptop. The built-in **Wake Lock** will keep the display on continuously as an aesthetic workstation centerpiece.

---

## 🤝 Contributing & Customization

Contributions, suggestions, and theme ideas are warmly welcomed!
- Want to add a new theme? Simply add a new CSS class in `css/themes.css`.
- Want to add new ambient sound recipes? Extend `js/audio-synth.js` with your Web Audio filter designs.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/CoolTheme`).
3. Commit your Changes (`git commit -m 'Add CoolTheme'`).
4. Push to the Branch (`git push origin feature/CoolTheme`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details. Free for personal, academic, and commercial use.
