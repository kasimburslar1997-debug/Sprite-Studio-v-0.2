/**
 * Media & Sprite Studio - Main Application Bootstrapper
 * Coordinates and initializes all 5 studio modules and UI controllers
 */
import { initAppShell } from './shell.js';
import { ColorPalette } from './modules/color-palette.js';
import { Collage } from './modules/collage.js';
import { Sprite } from './modules/sprite.js';
import { Pivot } from './modules/pivot.js';
import { VideoStudio } from './modules/video.js';
import { RenameStudio } from './modules/rename.js';
import { CropStudio } from './modules/cropStudio.js';

// تشغيل كافة الوحدات بمجرد اكتمال تحميل عناصر الصفحة (DOM Ready)
window.addEventListener('DOMContentLoaded', () => {
  initAppShell();     // شريط التنقل العلوي، الثيم الزمني، وملء الشاشة
  ColorPalette.init(); // شريط الألوان العائم
  Collage.init();      // استوديو التجميع
  Sprite.init();       // استوديو السبرايت
  Pivot.init();        // محرر نقطة الارتكاز
  VideoStudio.init();  // استوديو استخراج لقطات الفيديو
  RenameStudio.init(); // استوديو إعادة التسمية
  CropStudio.init();   // استوديو القص والتحريك
});
