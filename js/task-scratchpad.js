/**
 * ZenDesk Clock - Mini Focus Task & Zen Scratchpad
 * Option D: High-Retention Minimalist Productivity Widgets
 * 
 * Features:
 * 1. Focus Task System (Ivy Lee Method & Daily Most Important Task - MIT)
 *    - Direct integration with Pomodoro timer
 *    - Real-time Tomato sessions tracker per task
 *    - Elegant Pomodoro Focus Pill & Top Bar MIT chip
 * 2. Zen Scratchpad
 *    - Slide-out drawer with Q shortcut
 *    - Real-time auto-saving (debounced) to localStorage
 *    - Word & character counter
 *    - Quick Copy, Download (.txt), and Clear
 * 3. Minimalist Glassmorphism UI & Auto-idle tranquility
 */

import { pomodoroEngine } from './pomodoro.js';
import { soundEngine } from './audio-synth.js';

const STORAGE_KEYS = {
  TASKS: 'zd_focus_tasks',
  SCRATCHPAD: 'zd_zen_scratchpad_content',
  SCRATCHPAD_UPDATED: 'zd_zen_scratchpad_updated'
};

const DEFAULT_TASKS = [
  {
    id: 'task_mit_default',
    text: 'Hoàn thành mục tiêu cốt lõi hôm nay (MIT)',
    isMIT: true,
    status: 'in_progress', // 'todo', 'in_progress', 'done'
    pomodoros: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_sub_1',
    text: 'Đọc 10 trang sách hoặc tài liệu chuyên môn',
    isMIT: false,
    status: 'todo',
    pomodoros: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_sub_2',
    text: 'Dành 15 phút tĩnh lặng / thư giãn cuối ngày',
    isMIT: false,
    status: 'todo',
    pomodoros: 0,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SCRATCHPAD_NOTE = `# Zen Scratchpad — Ý Tưởng Nhanh

Ghi chép tức thì tại đây để giải phóng tâm trí và không ngắt quãng dòng chảy tập trung (Flow state).

• Phím tắt Q: Mở / Đóng nhanh sổ nháp
• Tự động lưu theo thời gian thực
• Nhấn "Chép" để copy nhanh toàn bộ nội dung
`;

/* ========================================================
   TASK MANAGER ENGINE
   ======================================================== */
export class FocusTaskManager {
  constructor() {
    this.tasks = [];
    this.listeners = [];
    this._load();
  }

  _load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        this.tasks = JSON.parse(saved);
      } else {
        this.tasks = [...DEFAULT_TASKS];
        this._save();
      }
    } catch (e) {
      console.warn('Failed to load focus tasks from localStorage:', e);
      this.tasks = [...DEFAULT_TASKS];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Failed to save focus tasks to localStorage:', e);
    }
  }

  getTasks() {
    return [...this.tasks];
  }

  getActiveTask() {
    // 1. Return task currently set as in_progress
    const inProgress = this.tasks.find(t => t.status === 'in_progress');
    if (inProgress) return inProgress;

    // 2. Fallback to uncompleted MIT
    const mit = this.tasks.find(t => t.isMIT && t.status !== 'done');
    if (mit) return mit;

    // 3. Fallback to first uncompleted task
    return this.tasks.find(t => t.status !== 'done') || null;
  }

  addTask(text, isMIT = false) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    // If marked as MIT, remove MIT status from existing tasks
    if (isMIT) {
      this.tasks.forEach(t => t.isMIT = false);
    }

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: trimmed,
      isMIT: Boolean(isMIT),
      status: this.tasks.length === 0 ? 'in_progress' : 'todo',
      pomodoros: 0,
      createdAt: new Date().toISOString()
    };

    if (isMIT) {
      // MIT always goes to the top
      this.tasks.unshift(newTask);
      this.setActive(newTask.id);
    } else {
      this.tasks.push(newTask);
    }

    this._save();
    this._notify();
    return newTask;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this._save();
    this._notify();
  }

  toggleDone(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    if (task.status === 'done') {
      task.status = 'todo';
    } else {
      task.status = 'done';
      // If completed task was in_progress, activate next uncompleted task
      const nextTask = this.tasks.find(t => t.id !== id && t.status !== 'done');
      if (nextTask) {
        nextTask.status = 'in_progress';
      }
    }

    this._save();
    this._notify();
  }

  setActive(id) {
    const target = this.tasks.find(t => t.id === id);
    if (!target) return;

    this.tasks.forEach(t => {
      if (t.status === 'in_progress') {
        t.status = 'todo';
      }
    });

    target.status = 'in_progress';
    this._save();
    this._notify();
  }

  incrementPomodoro(id, delta = 1) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.pomodoros = Math.max(0, (task.pomodoros || 0) + delta);
    this._save();
    this._notify();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== 'done');
    this._save();
    this._notify();
  }

  resetAll() {
    this.tasks = [];
    this._save();
    this._notify();
  }

  getTotalPomodorosToday() {
    return this.tasks.reduce((sum, t) => sum + (t.pomodoros || 0), 0);
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  _notify() {
    const tasks = this.getTasks();
    const activeTask = this.getActiveTask();
    const totalPomos = this.getTotalPomodorosToday();
    this.listeners.forEach(fn => fn({ tasks, activeTask, totalPomos }));
  }
}

export const focusTaskManager = new FocusTaskManager();

/* ========================================================
   ZEN SCRATCHPAD ENGINE
   ======================================================== */
export class ZenScratchpadManager {
  constructor() {
    this.debounceTimer = null;
    this.changeListeners = [];
  }

  getContent() {
    const saved = localStorage.getItem(STORAGE_KEYS.SCRATCHPAD);
    return saved !== null ? saved : DEFAULT_SCRATCHPAD_NOTE;
  }

  saveContent(text, callback) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, text);
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.SCRATCHPAD_UPDATED, now);
        if (callback) callback(now);
      } catch (e) {
        console.warn('Failed to save scratchpad to localStorage:', e);
      }
    }, 300);
  }

  getStats(text) {
    const safeText = text || '';
    const trimmed = safeText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = safeText.length;
    const lines = safeText ? safeText.split('\n').length : 0;
    return { words, chars, lines };
  }

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
      return false;
    }
  }

  downloadAsText(text) {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `zen-scratchpad-${dateStr}.txt`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.warn('Download text failed:', e);
      return false;
    }
  }

  clearContent() {
    try {
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, '');
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD_UPDATED, new Date().toISOString());
      return true;
    } catch (e) {
      console.warn('Failed to clear scratchpad:', e);
      return false;
    }
  }
}

export const zenScratchpadManager = new ZenScratchpadManager();

/* ========================================================
   ZEN PRODUCTIVITY UI CONTROLLER & AUTO-MOUNT
   ======================================================== */
export class ZenProductivityUI {
  constructor() {
    this.isMounted = false;
    this.activeTask = focusTaskManager.getActiveTask();
    this.lastPomodoroMode = 'focus';
    this.lastPomodoroCompleted = 0;
  }

  mount() {
    if (this.isMounted) return;
    this._ensureCSSLoaded();
    this._injectDOM();
    this._cacheElements();
    this._bindEvents();
    this._bindPomodoroEngine();
    this._renderTasks();
    this._renderScratchpad();
    this.isMounted = true;
  }

  _ensureCSSLoaded() {
    if (!document.querySelector('link[href*="task-scratchpad.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/task-scratchpad.css';
      document.head.appendChild(link);
    }
  }

  _injectDOM() {
    // 1. Toast Notification Container
    if (!document.getElementById('zenToastContainer')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'zenToastContainer';
      toastContainer.className = 'zen-toast-container';
      document.body.appendChild(toastContainer);
    }

    // 2. Focus Tasks Modal Dialog
    if (!document.getElementById('zenTasksModal')) {
      const modal = document.createElement('div');
      modal.id = 'zenTasksModal';
      modal.className = 'zen-tasks-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="zen-tasks-card">
          <div class="zen-tasks-header">
            <div class="zen-tasks-header-left">
              <div class="zen-tasks-title">
                <span>🎯 Mục Tiêu Tập Trung Hôm Nay</span>
              </div>
              <div class="zen-tasks-subtitle">Ivy Lee & MIT Method: Chọn 3–5 việc quan trọng nhất để duy trì Flow state.</div>
            </div>
            <button class="zen-tasks-close-btn" id="zenTasksCloseBtn" title="Đóng (Esc)">&times;</button>
          </div>

          <div class="zen-tasks-stats-bar">
            <div class="zen-stats-left">
              <span id="zenStatsTasksCount">0/0 việc hoàn thành</span>
            </div>
            <div class="zen-stats-right">
              <span>🍅 <span id="zenStatsPomoCount">0</span> phiên hôm nay</span>
            </div>
          </div>

          <form class="zen-task-add-form" id="zenTaskAddForm">
            <div class="zen-task-input-row">
              <input type="text" id="zenTaskInput" class="zen-task-input" placeholder="Hôm nay tôi sẽ hoàn thành..." autocomplete="off">
              <button type="submit" class="zen-task-add-btn">+ Thêm việc</button>
            </div>
            <div class="zen-task-options-row">
              <label class="zen-mit-checkbox-label">
                <input type="checkbox" id="zenTaskIsMit">
                <span>Đặt làm mục tiêu cốt lõi (MIT)</span>
              </label>
              <span>Phím Enter để thêm nhanh</span>
            </div>
          </form>

          <div class="zen-tasks-scroll-container" id="zenTasksScrollContainer">
            <!-- Dynamic task items injected here -->
          </div>

          <div class="zen-tasks-footer">
            <button type="button" class="zen-tasks-footer-btn" id="zenClearDoneBtn">Dọn việc đã xong</button>
            <button type="button" class="zen-tasks-footer-btn danger" id="zenResetTasksBtn">Làm mới ngày mới</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 3. Zen Scratchpad Slide-Out Drawer & Backdrop
    if (!document.getElementById('zenScratchpadDrawer')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'zenScratchpadBackdrop';
      backdrop.className = 'zen-scratchpad-backdrop';
      document.body.appendChild(backdrop);

      const drawer = document.createElement('aside');
      drawer.id = 'zenScratchpadDrawer';
      drawer.className = 'zen-scratchpad-drawer';
      drawer.setAttribute('aria-label', 'Sổ nháp nhanh Zen Scratchpad');
      drawer.innerHTML = `
        <div class="zen-scratchpad-header">
          <div class="zen-scratchpad-title-group">
            <div class="zen-scratchpad-title">
              <span>📝 Zen Scratchpad</span>
            </div>
            <div class="zen-scratchpad-save-indicator">
              <span class="zen-save-dot" id="zenSaveDot"></span>
              <span id="zenSaveText">Đã lưu tự động</span>
            </div>
          </div>
          <div class="zen-scratchpad-actions">
            <button class="zen-scratchpad-btn" id="zenCopyBtn" title="Sao chép toàn bộ nháp">
              <span>📋</span> Chép
            </button>
            <button class="zen-scratchpad-btn" id="zenDownloadBtn" title="Tải về file text">
              <span>📥</span> Xuất
            </button>
            <button class="zen-scratchpad-btn danger" id="zenClearPadBtn" title="Xóa nội dung nháp">
              <span>🗑️</span> Xóa
            </button>
            <button class="zen-scratchpad-close-btn" id="zenScratchpadCloseBtn" title="Đóng sổ nháp (Q hoặc Esc)">&times;</button>
          </div>
        </div>

        <div class="zen-scratchpad-body">
          <textarea class="zen-scratchpad-textarea" id="zenScratchpadText" placeholder="Ghi lại những ý nghĩ vụt qua, ý tưởng sáng tạo, hay việc đột xuất cần làm sau mà không làm ngắt quãng sự tập trung của bạn..."></textarea>
        </div>

        <div class="zen-scratchpad-footer">
          <div class="zen-scratchpad-counts" id="zenScratchpadCounts">
            <span>0 từ</span>
            <span>•</span>
            <span>0 ký tự</span>
          </div>
          <div class="zen-scratchpad-hint">
            <span class="zen-scratchpad-kbd">Q</span> Đóng/Mở • <span class="zen-scratchpad-kbd">Esc</span> Đóng
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    // 4. Inject Bottom Dock Buttons
    const bottomDock = document.querySelector('.bottom-dock');
    if (bottomDock) {
      if (!document.getElementById('focusTasksDockBtn')) {
        const taskBtn = document.createElement('button');
        taskBtn.className = 'control-btn zen-dock-btn';
        taskBtn.id = 'focusTasksDockBtn';
        taskBtn.title = 'Mục tiêu tập trung hôm nay (Phím V)';
        taskBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v4l3 3"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
          <span>Mục tiêu</span>
        `;

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
          bottomDock.insertBefore(taskBtn, settingsBtn);
        } else {
          bottomDock.appendChild(taskBtn);
        }
      }

      if (!document.getElementById('scratchpadDockBtn')) {
        const padBtn = document.createElement('button');
        padBtn.className = 'control-btn zen-dock-btn';
        padBtn.id = 'scratchpadDockBtn';
        padBtn.title = 'Sổ nháp nhanh không phân tâm (Phím Q)';
        padBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Ghi chú</span>
        `;

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
          bottomDock.insertBefore(padBtn, settingsBtn);
        } else {
          bottomDock.appendChild(padBtn);
        }
      }
    }

    // 5. Inject Top Bar MIT Chip
    const topBarLeft = document.querySelector('.top-bar-left');
    if (topBarLeft && !document.getElementById('zenMitTopChip')) {
      const mitChip = document.createElement('button');
      mitChip.className = 'top-bar-chip zen-mit-chip';
      mitChip.id = 'zenMitTopChip';
      mitChip.title = 'Mục tiêu tập trung hôm nay (Nhấp để xem/đổi)';
      mitChip.innerHTML = `
        <span class="chip-status-dot zen-dot-active" id="zenMitChipDot"></span>
        <span class="zen-mit-text" id="zenMitChipText">🎯 Mục tiêu hôm nay</span>
        <span class="zen-mit-badge" id="zenMitChipBadge">🍅 0</span>
      `;
      topBarLeft.appendChild(mitChip);
    }

    // 6. Inject Pomodoro Focus Pill
    const pomoView = document.getElementById('pomodoroView');
    if (pomoView && !document.getElementById('zenPomoFocusPill')) {
      const pill = document.createElement('div');
      pill.className = 'zen-pomo-focus-pill';
      pill.id = 'zenPomoFocusPill';
      pill.title = 'Nhấp để quản lý hoặc đổi mục tiêu tập trung (Phím V)';
      pill.innerHTML = `
        <span class="zen-pill-icon">🎯</span>
        <div class="zen-pill-info">
          <span class="zen-pill-label">Đang tập trung:</span>
          <span class="zen-pill-title" id="zenPomoFocusTitle">Chưa chọn mục tiêu</span>
        </div>
        <span class="zen-pill-pomos" id="zenPomoFocusCount">🍅 0</span>
      `;
      pomoView.appendChild(pill);
    }
  }

  _cacheElements() {
    this.toastContainer = document.getElementById('zenToastContainer');

    // Tasks Modal elements
    this.tasksModal = document.getElementById('zenTasksModal');
    this.tasksCloseBtn = document.getElementById('zenTasksCloseBtn');
    this.taskAddForm = document.getElementById('zenTaskAddForm');
    this.taskInput = document.getElementById('zenTaskInput');
    this.taskIsMitCheckbox = document.getElementById('zenTaskIsMit');
    this.tasksScrollContainer = document.getElementById('zenTasksScrollContainer');
    this.statsTasksCount = document.getElementById('zenStatsTasksCount');
    this.statsPomoCount = document.getElementById('zenStatsPomoCount');
    this.clearDoneBtn = document.getElementById('zenClearDoneBtn');
    this.resetTasksBtn = document.getElementById('zenResetTasksBtn');

    // Scratchpad elements
    this.scratchpadDrawer = document.getElementById('zenScratchpadDrawer');
    this.scratchpadBackdrop = document.getElementById('zenScratchpadBackdrop');
    this.scratchpadCloseBtn = document.getElementById('zenScratchpadCloseBtn');
    this.scratchpadTextarea = document.getElementById('zenScratchpadText');
    this.scratchpadCounts = document.getElementById('zenScratchpadCounts');
    this.saveDot = document.getElementById('zenSaveDot');
    this.saveText = document.getElementById('zenSaveText');
    this.copyBtn = document.getElementById('zenCopyBtn');
    this.downloadBtn = document.getElementById('zenDownloadBtn');
    this.clearPadBtn = document.getElementById('zenClearPadBtn');

    // Dock & Top elements
    this.focusTasksDockBtn = document.getElementById('focusTasksDockBtn');
    this.scratchpadDockBtn = document.getElementById('scratchpadDockBtn');
    this.mitTopChip = document.getElementById('zenMitTopChip');
    this.mitChipText = document.getElementById('zenMitChipText');
    this.mitChipBadge = document.getElementById('zenMitChipBadge');
    this.mitChipDot = document.getElementById('zenMitChipDot');

    // Pomodoro Pill elements
    this.pomoFocusPill = document.getElementById('zenPomoFocusPill');
    this.pomoFocusTitle = document.getElementById('zenPomoFocusTitle');
    this.pomoFocusCount = document.getElementById('zenPomoFocusCount');
  }

  _bindEvents() {
    // 1. Tasks Modal triggers
    if (this.focusTasksDockBtn) {
      this.focusTasksDockBtn.addEventListener('click', () => this.toggleTasksModal());
    }
    if (this.mitTopChip) {
      this.mitTopChip.addEventListener('click', () => this.toggleTasksModal());
    }
    if (this.pomoFocusPill) {
      this.pomoFocusPill.addEventListener('click', (e) => {
        // Crucial: stop propagation so Pomodoro timer does not toggle!
        e.stopPropagation();
        this.toggleTasksModal();
      });
    }
    if (this.tasksCloseBtn) {
      this.tasksCloseBtn.addEventListener('click', () => this.closeTasksModal());
    }
    if (this.tasksModal) {
      this.tasksModal.addEventListener('click', (e) => {
        if (e.target === this.tasksModal) this.closeTasksModal();
      });
    }

    // 2. Add Task Form
    if (this.taskAddForm) {
      this.taskAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.taskInput.value;
        const isMIT = this.taskIsMitCheckbox.checked;
        if (text && text.trim()) {
          focusTaskManager.addTask(text, isMIT);
          this.taskInput.value = '';
          this.taskIsMitCheckbox.checked = false;
          soundEngine.playFlipClick();
          this.showToast('Đã thêm nhiệm vụ tập trung!', '🎯');
        }
      });
    }

    // Stop propagation on inputs so global shortcuts (Space, Q, V) don't trigger
    if (this.taskInput) {
      this.taskInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
      });
    }

    // Clear completed / Reset
    if (this.clearDoneBtn) {
      this.clearDoneBtn.addEventListener('click', () => {
        focusTaskManager.clearCompleted();
        this.showToast('Đã dọn các việc đã hoàn thành!', '✨');
      });
    }

    if (this.resetTasksBtn) {
      this.resetTasksBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn làm mới toàn bộ danh sách việc cho ngày mới?')) {
          focusTaskManager.resetAll();
          this.showToast('Đã làm mới danh sách nhiệm vụ!', '🌱');
        }
      });
    }

    // 3. Scratchpad triggers
    if (this.scratchpadDockBtn) {
      this.scratchpadDockBtn.addEventListener('click', () => this.toggleScratchpad());
    }
    if (this.scratchpadCloseBtn) {
      this.scratchpadCloseBtn.addEventListener('click', () => this.closeScratchpad());
    }
    if (this.scratchpadBackdrop) {
      this.scratchpadBackdrop.addEventListener('click', () => this.closeScratchpad());
    }

    // Scratchpad Textarea Input & Typing protection
    if (this.scratchpadTextarea) {
      // Crucial: stop propagation so typing Space, Q, F does not trigger global app actions!
      this.scratchpadTextarea.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.closeScratchpad();
        }
      });

      this.scratchpadTextarea.addEventListener('input', () => {
        this._handleScratchpadInput();
      });

      this.scratchpadTextarea.addEventListener('focus', () => {
        if (this.scratchpadDrawer) {
          this.scratchpadDrawer.classList.add('typing-active');
        }
        document.body.classList.remove('idle');
      });

      this.scratchpadTextarea.addEventListener('blur', () => {
        if (this.scratchpadDrawer) {
          this.scratchpadDrawer.classList.remove('typing-active');
        }
      });
    }

    // Copy to clipboard
    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', async () => {
        const text = this.scratchpadTextarea.value;
        const success = await zenScratchpadManager.copyToClipboard(text);
        if (success) {
          this.showToast('Đã sao chép vào bộ nhớ tạm!', '📋');
          const originalHTML = this.copyBtn.innerHTML;
          this.copyBtn.innerHTML = '<span>✓</span> Đã chép';
          setTimeout(() => {
            this.copyBtn.innerHTML = originalHTML;
          }, 1800);
        } else {
          this.showToast('Không thể sao chép!', '⚠️');
        }
      });
    }

    // Download text
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        const text = this.scratchpadTextarea.value;
        const success = zenScratchpadManager.downloadAsText(text);
        if (success) {
          this.showToast('Đang tải file nháp...', '📥');
        }
      });
    }

    // Clear Scratchpad
    if (this.clearPadBtn) {
      this.clearPadBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ nội dung nháp hiện tại?')) {
          zenScratchpadManager.clearContent();
          this.scratchpadTextarea.value = '';
          this._updateScratchpadStats('');
          this.showToast('Đã xóa nháp!', '🗑️');
        }
      });
    }

    // 4. Global Keyboard Shortcuts: Q for Scratchpad, V for Tasks, Esc to close
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing in an input, textarea, or contenteditable
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'q') {
        e.preventDefault();
        this.toggleScratchpad();
      } else if (key === 'v') {
        e.preventDefault();
        this.toggleTasksModal();
      } else if (key === 'escape') {
        if (this.tasksModal && this.tasksModal.classList.contains('open')) {
          this.closeTasksModal();
        }
        if (this.scratchpadDrawer && this.scratchpadDrawer.classList.contains('open')) {
          this.closeScratchpad();
        }
      }
    });

    // 5. Subscribe to Task Manager changes
    focusTaskManager.onChange(() => {
      this._renderTasks();
    });
  }

  _bindPomodoroEngine() {
    try {
      pomodoroEngine.onUpdate((data) => {
        // Detect completion of focus session
        if (data.completed && data.mode === 'focus') {
          const activeTask = focusTaskManager.getActiveTask();
          if (activeTask) {
            focusTaskManager.incrementPomodoro(activeTask.id, 1);
            this.showToast(`🎉 +1 🍅 dành cho: "${activeTask.text}"`, '🍅', 4500);
            soundEngine.playChime();
          } else {
            this.showToast('🎉 Chúc mừng bạn hoàn thành 1 phiên tập trung sâu!', '🍅', 4000);
            soundEngine.playChime();
          }
        }
      });
    } catch (e) {
      console.warn('Failed to bind to pomodoroEngine updates:', e);
    }
  }

  /* ========================================================
     MODAL & DRAWER TOGGLE CONTROLS
     ======================================================== */
  openTasksModal() {
    if (this.tasksModal) {
      this.tasksModal.classList.add('open');
      this._renderTasks();
      setTimeout(() => {
        if (this.taskInput) this.taskInput.focus();
      }, 100);
    }
  }

  closeTasksModal() {
    if (this.tasksModal) {
      this.tasksModal.classList.remove('open');
    }
  }

  toggleTasksModal() {
    if (this.tasksModal && this.tasksModal.classList.contains('open')) {
      this.closeTasksModal();
    } else {
      this.openTasksModal();
    }
  }

  openScratchpad() {
    if (this.scratchpadDrawer) {
      this.scratchpadDrawer.classList.add('open');
      if (this.scratchpadBackdrop) this.scratchpadBackdrop.classList.add('open');
      setTimeout(() => {
        if (this.scratchpadTextarea) this.scratchpadTextarea.focus();
      }, 120);
    }
  }

  closeScratchpad() {
    if (this.scratchpadDrawer) {
      this.scratchpadDrawer.classList.remove('open');
      if (this.scratchpadBackdrop) this.scratchpadBackdrop.classList.remove('open');
    }
  }

  toggleScratchpad() {
    if (this.scratchpadDrawer && this.scratchpadDrawer.classList.contains('open')) {
      this.closeScratchpad();
    } else {
      this.openScratchpad();
    }
  }

  /* ========================================================
     RENDERING
     ======================================================== */
  _renderTasks() {
    const tasks = focusTaskManager.getTasks();
    const activeTask = focusTaskManager.getActiveTask();
    const totalPomos = focusTaskManager.getTotalPomodorosToday();
    const doneCount = tasks.filter(t => t.status === 'done').length;

    // 1. Update Stats Bar
    if (this.statsTasksCount) {
      this.statsTasksCount.textContent = `${doneCount}/${tasks.length} việc hoàn thành`;
    }
    if (this.statsPomoCount) {
      this.statsPomoCount.textContent = totalPomos;
    }

    // 2. Render Task List Cards
    if (this.tasksScrollContainer) {
      this.tasksScrollContainer.innerHTML = '';

      if (tasks.length === 0) {
        this.tasksScrollContainer.innerHTML = `
          <div class="zen-tasks-empty">
            <div class="zen-tasks-empty-icon">🍃</div>
            <div style="font-weight: 600; color: #e2e8f0;">Chưa có nhiệm vụ nào hôm nay</div>
            <div class="zen-tasks-empty-quote">"Một tâm trí trống rỗng sẵn sàng cho mọi khả năng. Hãy thêm 1 mục tiêu cốt lõi để bắt đầu ngày làm việc."</div>
          </div>
        `;
      } else {
        tasks.forEach(task => {
          const item = document.createElement('div');
          const isDone = task.status === 'done';
          const isActive = activeTask && activeTask.id === task.id && !isDone;

          item.className = `zen-task-item ${task.isMIT ? 'is-mit' : ''} ${isActive ? 'is-active-focus' : ''} ${isDone ? 'is-done' : ''}`;
          
          item.innerHTML = `
            <div class="zen-task-left">
              <input type="checkbox" class="zen-task-checkbox" data-id="${task.id}" ${isDone ? 'checked' : ''} title="Đánh dấu hoàn thành">
              <span class="zen-task-text">${this._escapeHTML(task.text)}</span>
            </div>
            <div class="zen-task-right">
              <div class="zen-task-pomos-badge" title="Số phiên Pomodoro đã dành cho nhiệm vụ này">
                <span>🍅 ${task.pomodoros || 0}</span>
                <button type="button" class="zen-pomo-btn" data-action="inc" data-id="${task.id}" title="Thêm 1 phiên">+</button>
                <button type="button" class="zen-pomo-btn" data-action="dec" data-id="${task.id}" title="Bớt 1 phiên">-</button>
              </div>

              ${!isDone ? `
                <button type="button" class="zen-task-focus-btn" data-id="${task.id}" title="${isActive ? 'Đang là mục tiêu tập trung' : 'Đặt làm mục tiêu tập trung hiện tại'}">
                  ${isActive ? '⚡ Đang làm' : '🎯 Tập trung'}
                </button>
              ` : ''}

              <button type="button" class="zen-task-delete-btn" data-id="${task.id}" title="Xóa nhiệm vụ">&times;</button>
            </div>
          `;

          // Event Listeners for Item Actions
          const checkbox = item.querySelector('.zen-task-checkbox');
          checkbox.addEventListener('change', () => {
            focusTaskManager.toggleDone(task.id);
            soundEngine.playFlipClick();
          });

          const incBtn = item.querySelector('[data-action="inc"]');
          if (incBtn) {
            incBtn.addEventListener('click', () => {
              focusTaskManager.incrementPomodoro(task.id, 1);
            });
          }

          const decBtn = item.querySelector('[data-action="dec"]');
          if (decBtn) {
            decBtn.addEventListener('click', () => {
              focusTaskManager.incrementPomodoro(task.id, -1);
            });
          }

          const focusBtn = item.querySelector('.zen-task-focus-btn');
          if (focusBtn) {
            focusBtn.addEventListener('click', () => {
              focusTaskManager.setActive(task.id);
              this.showToast(`Đã chọn làm mục tiêu tập trung: "${task.text}"`, '🎯');
              soundEngine.playFlipClick();
            });
          }

          const deleteBtn = item.querySelector('.zen-task-delete-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              focusTaskManager.deleteTask(task.id);
            });
          }

          this.tasksScrollContainer.appendChild(item);
        });
      }
    }

    // 3. Update Pomodoro Focus Pill
    this._updatePomoFocusPill(activeTask);

    // 4. Update Top Bar MIT Chip
    this._updateTopMitChip(activeTask);
  }

  _updatePomoFocusPill(activeTask) {
    if (!this.pomoFocusPill) return;

    if (activeTask) {
      if (this.pomoFocusTitle) {
        this.pomoFocusTitle.textContent = activeTask.text;
      }
      if (this.pomoFocusCount) {
        this.pomoFocusCount.textContent = `🍅 ${activeTask.pomodoros || 0}`;
        this.pomoFocusCount.style.display = 'inline-flex';
      }
    } else {
      if (this.pomoFocusTitle) {
        this.pomoFocusTitle.textContent = '+ Chọn mục tiêu tập trung';
      }
      if (this.pomoFocusCount) {
        this.pomoFocusCount.style.display = 'none';
      }
    }
  }

  _updateTopMitChip(activeTask) {
    if (!this.mitTopChip) return;

    if (activeTask) {
      if (this.mitChipText) {
        this.mitChipText.textContent = `🎯 ${activeTask.text}`;
      }
      if (this.mitChipBadge) {
        this.mitChipBadge.textContent = `🍅 ${activeTask.pomodoros || 0}`;
        this.mitChipBadge.style.display = 'inline-block';
      }
      if (this.mitChipDot) {
        this.mitChipDot.className = 'chip-status-dot zen-dot-active';
      }
    } else {
      if (this.mitChipText) {
        this.mitChipText.textContent = '🎯 Đặt mục tiêu';
      }
      if (this.mitChipBadge) {
        this.mitChipBadge.style.display = 'none';
      }
      if (this.mitChipDot) {
        this.mitChipDot.className = 'chip-status-dot inactive';
      }
    }
  }

  _renderScratchpad() {
    if (!this.scratchpadTextarea) return;
    const content = zenScratchpadManager.getContent();
    this.scratchpadTextarea.value = content;
    this._updateScratchpadStats(content);
  }

  _handleScratchpadInput() {
    const text = this.scratchpadTextarea.value;
    this._updateScratchpadStats(text);

    if (this.saveDot) {
      this.saveDot.classList.add('saving');
    }
    if (this.saveText) {
      this.saveText.textContent = 'Đang lưu...';
    }

    zenScratchpadManager.saveContent(text, (timestamp) => {
      if (this.saveDot) {
        this.saveDot.classList.remove('saving');
      }
      if (this.saveText) {
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.saveText.textContent = `Đã lưu lúc ${time}`;
      }
    });
  }

  _updateScratchpadStats(text) {
    if (!this.scratchpadCounts) return;
    const stats = zenScratchpadManager.getStats(text);
    this.scratchpadCounts.innerHTML = `
      <span>${stats.words} từ</span>
      <span>•</span>
      <span>${stats.chars} ký tự</span>
      <span>•</span>
      <span>${stats.lines} dòng</span>
    `;
  }

  showToast(message, icon = '✨', duration = 3000) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'zen-toast';
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${this._escapeHTML(message)}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, duration);
  }

  _escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
  }
}

export const zenProductivityUI = new ZenProductivityUI();

// Auto-launch once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    zenProductivityUI.mount();
  });
} else {
  zenProductivityUI.mount();
}
