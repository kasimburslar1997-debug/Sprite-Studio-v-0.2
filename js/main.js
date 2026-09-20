/**
 * Media & Sprite Studio - Main Application Bootstrapper
 */
import { initAppShell } from './shell.js';
import { ColorPalette } from './modules/color-palette.js';
import { Collage } from './modules/collage.js';
import { Sprite } from './modules/sprite.js';
import { Pivot } from './modules/pivot.js';
import { VideoStudio } from './modules/video.js';
import { RenameStudio } from './modules/rename.js';

window.addEventListener('DOMContentLoaded', () => {
  initAppShell();
  ColorPalette.init();
  Collage.init();
  Sprite.init();
  Pivot.init();
  VideoStudio.init();
  RenameStudio.init();
});
