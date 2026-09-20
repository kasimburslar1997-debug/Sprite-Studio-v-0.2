/**
 * Media & Sprite Studio - Shell Controller (Tabs, Time-Theme, Fullscreen)
 */
import { Store } from './state.js';

export function initAppShell() {
  const tabs = [
    { btn: document.getElementById('tabCollageBtn'), view: document.getElementById('collageView'), actions: document.getElementById('collageHeaderActions') },
    { btn: document.getElementById('tabSpriteBtn'),  view: document.getElementById('spriteView'),  actions: document.getElementById('spriteHeaderActions') },
    { btn: document.getElementById('tabVideoBtn'),   view: document.getElementById('videoView'),   actions: document.getElementById('videoHeaderActions') },
    { btn: document.getElementById('tabRenameBtn'),  view: document.getElementById('renameView'),  actions: document.getElementById('renameHeaderActions') }
  ];

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const fullScreenBtn = document.getElementById('fullScreenBtn');
  const fullScreenIcon = document.getElementById('fullScreenIcon');

  // تبديل التبويبات وتفعيل أزرار التصدير الخاصة بها في الهيدر
  function switchTab(activeBtn, activeView, activeActions) {
    tabs.forEach(({ btn, view, actions }) => {
      btn?.classList.remove('active');
      view?.classList.remove('active-view');
      actions?.classList.remove('active-actions');
    });

    activeBtn?.classList.add('active');
    activeView?.classList.add('active-view');
    activeActions?.classList.add('active-actions');
  }

  tabs.forEach(({ btn, view, actions }) => {
    btn?.addEventListener('click', () => switchTab(btn, view, actions));
  });

  // تحديد الثيم حسب التفضيل المحفوظ أو حسب الوقت الحالي تلقائياً
  function resolveTheme() {
    const saved = localStorage.getItem('theme_preference');
    if (saved === 'dark' || saved === 'light') return saved;

    // تلقائي: نهاراً (6ص حتى 6م) فاتح، وليلاً داكن
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }

  function applyTheme(themeName, persist = false) {
    Store.theme = themeName;
    const isDark = themeName === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    if (themeIcon) {
      themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    if (persist) {
      localStorage.setItem('theme_preference', themeName);
    }
  }

  // تطبيق الثيم الأولي
  applyTheme(resolveTheme(), false);

  // تبديل الثيم يدوياً عند النقر
  themeToggleBtn?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });

  // ملء الشاشة
  fullScreenBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (fullScreenIcon) {
      fullScreenIcon.textContent = document.fullscreenElement ? 'fullscreen_exit' : 'fullscreen';
    }
  });

  // تمكين سكرول الماوس الأفقي على الأشرطة السفلية في الحواسيب والتابلت
  document.querySelectorAll('.scrollable-bar').forEach(bar => {
    bar.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        bar.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });
}
