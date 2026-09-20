/**
 * Media & Sprite Studio - Shell Controller
 * Manages 5 Navigation Tabs, Dynamic Header Actions, Time-Based Auto Theme, Fullscreen & Horizontal Wheel Scrolling
 */
import { Store } from './state.js';

export function initAppShell() {
  // مصفوفة التبويبات الخمسة وربط كل تبويب بمساحة عمله ومجموعة أزرار الهيدر الخاصة به
  const tabs = [
    { 
      btn: document.getElementById('tabCollageBtn'), 
      view: document.getElementById('collageView'), 
      actions: document.getElementById('collageHeaderActions') 
    },
    { 
      btn: document.getElementById('tabSpriteBtn'),  
      view: document.getElementById('spriteView'),  
      actions: document.getElementById('spriteHeaderActions') 
    },
    { 
      btn: document.getElementById('tabVideoBtn'),   
      view: document.getElementById('videoView'),   
      actions: document.getElementById('videoHeaderActions') 
    },
    { 
      btn: document.getElementById('tabRenameBtn'),  
      view: document.getElementById('renameView'),  
      actions: document.getElementById('renameHeaderActions') 
    },
    { 
      btn: document.getElementById('tabCropBtn'),    
      view: document.getElementById('cropView'),    
      actions: document.getElementById('cropHeaderActions') 
    }
  ];

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const fullScreenBtn = document.getElementById('fullScreenBtn');
  const fullScreenIcon = document.getElementById('fullScreenIcon');

  // تبديل التبويبات وإظهار أزرار التصدير الخاصة بالتبويب النشط في الهيدر
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

  // تحديد الثيم: الأولوية لتفضيل المستخدم المحفوظ، وإلا يتم تحديده حسب وقت اليوم تلقائياً
  function resolveTheme() {
    const saved = localStorage.getItem('theme_preference');
    if (saved === 'dark' || saved === 'light') return saved;

    // تلقائي: نهاراً (من 6:00 صباحاً حتى 6:00 مساءً) فاتح، وليلاً داكن
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

  // تطبيق الثيم المبدئي عند بدء التشغيل
  applyTheme(resolveTheme(), false);

  // تبديل الثيم يدوياً عند النقر على الزر وحفظ تفضيل المستخدم
  themeToggleBtn?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });

  // التحكم بملء الشاشة
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  fullScreenBtn?.addEventListener('click', () => {
    const docEl = document.documentElement;
    if (!isFullscreen()) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  });

  // تحديث أيقونة ملء الشاشة حسب الحالة
  const updateFsIcon = () => {
    if (fullScreenIcon) {
      fullScreenIcon.textContent = isFullscreen() ? 'fullscreen_exit' : 'fullscreen';
    }
  };

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, updateFsIcon);
  });

  // تمكين سكرول عجلة الفأرة العمودي ليتحول لتمرير أفقي سلس على الأشرطة السفلية
  document.querySelectorAll('.scrollable-bar').forEach(bar => {
    bar.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        bar.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });
}
