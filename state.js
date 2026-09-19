/**
 * Media & Sprite Studio - Central State Store
 */
export const Store = {
    theme: localStorage.getItem('theme') || 'light',

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

    // محرر نقطة الارتكاز (Pivot Editor)
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
    renameEnd: 1
};