/**
 * Media & Sprite Studio - Navigation, Auto Theme, Bulletproof Header Exports & Scroll
 */
import { Store } from './state.js';
import { Collage } from './modules/collage.js';
import { Sprite } from './modules/sprite.js';
import { VideoStudio } from './modules/video.js';
import { RenameStudio } from './modules/rename.js';

export function initAppShell() {
  const tabs = [
    { id: 'collage', btn: document.getElementById('tabCollageBtn'), view: document.getElementById('collageView') },
    { id: 'sprite',  btn: document.getElementById('tabSpriteBtn'),  view: document.getElementById('spriteView') },
    { id: 'video',   btn: document.getElementById('tabVideoBtn'),   view: document.getElementById('videoView') },
    { id: 'rename',  btn: document.getElementById('tabRenameBtn'),  view: document.getElementById('renameView') }
  ];

  const headerExportGroup = document.getElementById('headerExportGroup');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const fullScreenBtn = document.getElementById('fullScreenBtn');
  const fullScreenIcon = document.getElementById('fullScreenIcon');

  // توليد أزرار التصدير في الأعلى يميناً
  function updateHeaderExports(tabId) {
    if (!headerExportGroup) return;
    headerExportGroup.innerHTML = '';

    if (tabId === 'collage') {
      headerExportGroup.innerHTML = `
        <button id="exportPNGBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">image</span> PNG</button>
        <button id="exportPDFBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">picture_as_pdf</span> PDF</button>
      `;
    } else if (tabId === 'sprite') {
      headerExportGroup.innerHTML = `
        <button id="exportSpriteMp4Btn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">videocam</span> MP4</button>
        <button id="exportSpriteGifBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">gif</span> GIF</button>
        <button id="exportZipBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">folder_zip</span> ZIP</button>
        <button id="transferToCollageBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">move_down</span> للتجميع</button>
      `;
    } else if (tabId === 'video') {
      headerExportGroup.innerHTML = `
        <button id="extractGifBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">gif</span> GIF</button>
        <button id="extractZipBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">folder_zip</span> ZIP</button>
        <button id="transferVidToCollageBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">move_down</span> للتجميع</button>
      `;
    } else if (tabId === 'rename') {
      headerExportGroup.innerHTML = `
        <button id="renameExportZipBtn" class="pill-btn header-pill-btn"><span class="material-symbols-rounded red-icon">download</span> تحميل ZIP</button>
      `;
    }
  }

  // نظام تفويض الأحداث: يضمن عمل جميع أزرار التصدير بنسبة 100% حتى لو أُعيد إنشاؤها
  headerExportGroup?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    switch (btn.id) {
      // Collage
      case 'exportPNGBtn': Collage.exportPNG(); break;
      case 'exportPDFBtn': Collage.exportPDF(); break;

      // Sprite
      case 'exportSpriteMp4Btn': Sprite.exportMP4(); break;
      case 'exportSpriteGifBtn': Sprite.exportGIF(); break;
      case 'exportZipBtn': Sprite.exportZIP(); break;
      case 'transferToCollageBtn': Sprite.transferFrames(); break;

      // Video
      case 'extractGifBtn': VideoStudio.exportGIF(); break;
      case 'extractZipBtn': VideoStudio.exportZIP(); break;
      case 'transferVidToCollageBtn': VideoStudio.transferFrames(); break;

      // Rename
      case 'renameExportZipBtn': RenameStudio.exportZIP(); break;
    }
  });

  function switchTab(activeTab) {
    tabs.forEach(({ btn, view }) => {
      btn?.classList.remove('active');
      view?.classList.remove('active-view');
    });

    activeTab.btn?.classList.add('active');
    activeTab.view?.classList.add('active-view');
    updateHeaderExports(activeTab.id);
  }

  tabs.forEach(tab => {
    tab.btn?.addEventListener('click', () => switchTab(tab));
  });

  // فحص الوقت التلقائي (نهاراً فاتح / ليلاً دارك مود)
  function getAutoTheme() {
    const manualSaved = localStorage.getItem('theme_manual');
    if (manualSaved) return manualSaved;

    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }

  function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    if (themeIcon) {
      themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
  }

  const initialTheme = getAutoTheme();
  applyTheme(initialTheme === 'dark');

  themeToggleBtn?.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark);
    localStorage.setItem('theme_manual', isDark ? 'dark' : 'light');
  });

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

  // تمكين السحب الأفقي والتمرير بعجلة الماوس للأشرطة السفلية
  document.querySelectorAll('.bottom-bar').forEach(bar => {
    bar.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        bar.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    let isDown = false;
    let startX, scrollLeft;

    bar.addEventListener('pointerdown', (e) => {
      if (['INPUT', 'BUTTON', 'LABEL'].includes(e.target.tagName)) return;
      isDown = true;
      startX = e.pageX - bar.offsetLeft;
      scrollLeft = bar.scrollLeft;
      bar.setPointerCapture(e.pointerId);
    });

    bar.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - bar.offsetLeft;
      bar.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });

    const stop = () => { isDown = false; };
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  });

  // البدء بالتبويب الأول
  updateHeaderExports('collage');
}
