/**
 * Media & Sprite Studio - Central State Store
 */
export const Store = {
  theme: 'light',

  // 1. استوديو التجميع
  collageImages: [],
  collagePositions: [],
  isCollageSelectMode: false,
  selectedCollageIndices: new Set(),
  collageRatio: '1:1',
  collageRatioW: 1,
  collageRatioH: 1,
  collageRatioLabel: '1:1',
  collageBgColor: '#FFFFFF',
  collageStrokeColor: '#FF3B5C',

  // 2. استوديو السبرايت
  spriteImage: null,
  slicedFrames: [],
  framePivots: [],
  backupFrames: [],
  backupPivots: [],
  isPlaying: false,
  currentFrameIndex: 0,
  animInterval: null,
  isSpriteEditMode: false,
  selectedFrameIndex: null,
  isSpriteDeleteMode: false,
  selectedSpriteDeleteFrames: new Set(),
  spriteBgColor: '#FFFFFF',

  // محرر نقطة الارتكاز (Pivot)
  activePivotFrameIdx: 0,
  onionSkinActive: true,
  isDraggingPivot: false,

  // 3. استوديو الفيديو
  currentVideoFile: null,

  // 4. استوديو إعادة التسمية
  renameImages: [],
  isRenameSelectMode: false,
  selectedRenameIndices: new Set(),
  renameBaseName: '',
  renameDigits: 2,
  renameStart: 1,
  renameEnd: 1,

  // 5. استوديو القص والتحريك (Crop & Motion Studio)
  cropFrames: [],
  cropHistory: [],
  cropCurrentIndex: 0,
  cropIsPlaying: false,
  cropFps: 12,
  cropCoords: { top: 0, bottom: 100, left: 0, right: 100 },
  cropIsAllLayersMode: false
};
