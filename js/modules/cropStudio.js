/**
 * Media & Sprite Studio - Crop & Motion Studio Module
 * Complete Interactive Cropper, Timeline, Video/GIF Slicer & Multi-Format Exporter
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';

export const CropStudio = {
  // عناصر الكانفاس ومساحة العمل
  stageCard: document.getElementById('cropDropZone'),
  stageBox: document.getElementById('cropStageBox'),
  stage: document.getElementById('cropStage'),
  ctx: document.getElementById('cropStage')?.getContext('2d', { alpha: true }),
  placeholder: document.getElementById('cropPlaceholder'),
  placeholderText: document.getElementById('cropPlaceholderText'),
  fileInput: document.getElementById('cropFileInput'),
  cropOverlay: document.getElementById('cropOverlay'),

  // خطوط القص
  lineTop: document.getElementById('cropLineTop'),
  lineBottom: document.getElementById('cropLineBottom'),
  lineLeft: document.getElementById('cropLineLeft'),
  lineRight: document.getElementById('cropLineRight'),

  // أزرار الشريط العلوي للهيدر
  undoBtn: document.getElementById('undoCropBtn'),
  exportPngBtn: document.getElementById('exportCropPngBtn'),
  exportGifBtn: document.getElementById('exportCropGifBtn'),
  exportMp4Btn: document.getElementById('exportCropMp4Btn'),

  // أزرار وعناصر الشريط السفلي
  importBtn: document.getElementById('cropImportBtn'),
  applyCropBtn: document.getElementById('applyCropBtn'),
  allLayersBtn: document.getElementById('cropAllLayersBtn'),
  playBtn: document.getElementById('cropPlayBtn'),
  playIcon: document.getElementById('cropPlayIcon'),
  timeline: document.getElementById('cropTimeline'),
  frameIndicator: document.getElementById('cropFrameIndicator'),
  speedDecBtn: document.getElementById('cropSpeedDecBtn'),
  fpsNum: document.getElementById('cropFpsNum'),
  speedIncBtn: document.getElementById('cropSpeedIncBtn'),
  clearBtn: document.getElementById('cropClearBtn'),

  // متغيرات الحركة الداخلية
  animReqId: null,
  lastFrameTime: 0,
  updatePending: false,
  MAX_HISTORY: 20,

  init() {
    this.bindEvents();
    this.setupCropDragging();
    this.updateSpeedUI();
  },

  bindEvents() {
    // فتح مستعرض الملفات
    this.importBtn?.addEventListener('click', () => this.fileInput?.click());
    this.stageCard?.addEventListener('click', (e) => {
      if (Store.cropFrames.length === 0) {
        this.fileInput?.click();
      }
    });

    // السحب والإفلات
    this.stageCard?.addEventListener('dragover', (e) => e.preventDefault());
    this.stageCard?.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        this.handleFiles(e.dataTransfer.files);
      }
    });

    this.fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        this.handleFiles(e.target.files);
      }
      this.fileInput.value = '';
    });

    // التحكم بالسرعة FPS
    this.speedDecBtn?.addEventListener('click', () => {
      if (Store.cropFps > 1) {
        Store.cropFps--;
        this.updateSpeedUI();
      }
    });

    this.speedIncBtn?.addEventListener('click', () => {
      if (Store.cropFps < 60) {
        Store.cropFps++;
        this.updateSpeedUI();
      }
    });

    // التشغيل / الإيقاف
    this.playBtn?.addEventListener('click', () => this.togglePlay());

    // شريط التمرير الزمني
    this.timeline?.addEventListener('input', (e) => {
      if (Store.cropIsPlaying) this.togglePlay();
      Store.cropCurrentIndex = parseInt(e.target.value);
      this.renderCurrentFrame();
    });

    // زر معاينة كافة الطبقات (Onion Skin 100%)
    this.allLayersBtn?.addEventListener('click', () => this.toggleAllLayersMode());

    // تطبيق القص
    this.applyCropBtn?.addEventListener('click', () => this.applyCrop());

    // التراجع
    this.undoBtn?.addEventListener('click', () => this.undo());

    // المسح والبدء من جديد
    this.clearBtn?.addEventListener('click', () => this.clearAll());

    // أزرار التصدير في الهيدر
    this.exportPngBtn?.addEventListener('click', () => this.exportPNGZip());
    this.exportGifBtn?.addEventListener('click', () => this.exportGIF());
    this.exportMp4Btn?.addEventListener('click', () => this.exportMP4());

    window.addEventListener('resize', () => this.updateStageDimensions());
  },

  updateSpeedUI() {
    if (this.fpsNum) this.fpsNum.value = toEnDigits(Store.cropFps);
  },

  // استخراج فريمات الفيديو
  extractFramesFromVideo(videoFile, targetFps = 12) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration;
          const width = video.videoWidth;
          const height = video.videoHeight;
          const totalFrames = Math.min(Math.floor(duration * targetFps), 300);
          const interval = duration / (totalFrames || 1);
          const extracted = [];

          showProgress('جاري استخراج إطارات الفيديو...');

          for (let i = 0; i < totalFrames; i++) {
            video.currentTime = i * interval;
            await new Promise(r => { video.onseeked = () => r(); });

            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            c.getContext('2d').drawImage(video, 0, 0, width, height);
            extracted.push(c);

            updateProgress(((i + 1) / totalFrames) * 100);
          }

          hideProgress();
          URL.revokeObjectURL(videoUrl);
          resolve(extracted);
        } catch (err) {
          hideProgress();
          reject(err);
        }
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(videoUrl);
        reject(e);
      };
    });
  },

  // فك وتفكيك صور GIF المتحركة
  async processGifFile(gifFile) {
    showProgress('جاري تفكيك ملف GIF المتحرك...');
    const buffer = await gifFile.arrayBuffer();
    const parser = window.parseGIF || (window.gifuct && window.gifuct.parseGIF);
    const decompress = window.decompressFrames || (window.gifuct && window.gifuct.decompressFrames);

    if (!parser || !decompress) {
      hideProgress();
      throw new Error('مكتبة تفكيك GIF غير متوفرة');
    }

    const gif = parser(buffer);
    const rawFrames = decompress(gif, true);

    if (!rawFrames || rawFrames.length === 0) {
      hideProgress();
      throw new Error('تعذر قراءة إطارات ملف GIF');
    }

    const baseW = gif.lsd ? gif.lsd.width : rawFrames[0].dims.width;
    const baseH = gif.lsd ? gif.lsd.height : rawFrames[0].dims.height;

    const accCanvas = document.createElement('canvas');
    accCanvas.width = baseW;
    accCanvas.height = baseH;
    const accCtx = accCanvas.getContext('2d');

    const tempPatchCanvas = document.createElement('canvas');
    const tempPatchCtx = tempPatchCanvas.getContext('2d');
    const resultFrames = [];

    for (let i = 0; i < rawFrames.length; i++) {
      const f = rawFrames[i];
      tempPatchCanvas.width = f.dims.width;
      tempPatchCanvas.height = f.dims.height;
      const imgData = tempPatchCtx.createImageData(f.dims.width, f.dims.height);
      imgData.data.set(f.patch);
      tempPatchCtx.putImageData(imgData, 0, 0);

      if (f.disposalType === 2) {
        accCtx.clearRect(0, 0, baseW, baseH);
      }

      accCtx.drawImage(tempPatchCanvas, f.dims.left, f.dims.top);

      const frameOut = document.createElement('canvas');
      frameOut.width = baseW;
      frameOut.height = baseH;
      frameOut.getContext('2d').drawImage(accCanvas, 0, 0);
      resultFrames.push(frameOut);

      updateProgress(((i + 1) / rawFrames.length) * 100);
    }

    hideProgress();
    return resultFrames;
  },

  // معالجة الملفات الرئيسية المرفوعة
  async handleFiles(files) {
    if (!files || !files.length) return;

    if (Store.cropIsPlaying) this.togglePlay();
    this.saveState();

    const firstFile = files[0];
    const isVideo = firstFile.type.startsWith('video/') || firstFile.name.match(/\.(mp4|webm|mov)$/i);
    const isGif = firstFile.type === 'image/gif' || firstFile.name.toLowerCase().endsWith('.gif');

    if (this.placeholderText) this.placeholderText.textContent = 'جاري قراءة ومعالجة الوسائط... ⏳';

    try {
      if (isVideo) {
        Store.cropFrames = await this.extractFramesFromVideo(firstFile, Store.cropFps);
      } else if (files.length === 1 && isGif) {
        Store.cropFrames = await this.processGifFile(firstFile);
      } else {
        showProgress('جاري استيراد الإطارات...');
        const loadedImages = await Promise.all([...files].map(f => new Promise(res => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = URL.createObjectURL(f);
        })));

        Store.cropFrames = [];
        loadedImages.forEach(img => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          c.getContext('2d').drawImage(img, 0, 0);
          Store.cropFrames.push(c);
        });
        hideProgress();
      }

      if (Store.cropFrames.length > 0) {
        this.placeholder.style.display = 'none';
        this.stageBox.style.display = 'flex';
        this.stageCard.classList.remove('empty-crop-card');
        Store.cropCurrentIndex = 0;

        Store.cropIsAllLayersMode = false;
        this.allLayersBtn.classList.remove('active');

        this.updateStageDimensions();
        this.resetCropLines();
        this.enableUI();
        this.renderCurrentFrame();
      } else {
        if (this.placeholderText) this.placeholderText.textContent = 'لم يتم العثور على إطارات صالحة 📤';
      }
    } catch (err) {
      console.error(err);
      hideProgress();
      if (this.placeholderText) this.placeholderText.textContent = 'حدث خطأ أثناء قراءة الملف. تأكد من توافق الصيغة.';
    }
  },

  // ضبط الأبعاد والتجاوب
  updateStageDimensions() {
    if (!Store.cropFrames.length) return;
    const w = Store.cropFrames[0].width;
    const h = Store.cropFrames[0].height;
    this.stage.width = w;
    this.stage.height = h;

    this.stageBox.style.aspectRatio = `${w} / ${h}`;

    const cardRect = this.stageCard.getBoundingClientRect();
    if (cardRect.width > 0 && cardRect.height > 0) {
      const cardRatio = cardRect.width / cardRect.height;
      const mediaRatio = w / h;

      if (mediaRatio >= cardRatio) {
        this.stageBox.style.width = '100%';
        this.stageBox.style.height = 'auto';
      } else {
        this.stageBox.style.width = 'auto';
        this.stageBox.style.height = '100%';
      }
    }
  },

  // رسم الإطار الحالي
  renderCurrentFrame() {
    if (!Store.cropFrames.length) return;
    const curCanvas = Store.cropFrames[Store.cropCurrentIndex];

    this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
    this.ctx.drawImage(curCanvas, 0, 0);

    this.timeline.value = Store.cropCurrentIndex;
    this.frameIndicator.textContent = `${toEnDigits(Store.cropCurrentIndex + 1)} / ${toEnDigits(Store.cropFrames.length)}`;
  },

  // معاينة كافة الطبقات معاً بنسبة 100% بدون تشفيف
  renderAllLayers() {
    if (!Store.cropFrames.length) return;
    this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
    this.ctx.save();
    this.ctx.globalAlpha = 1.0;

    for (let i = 0; i < Store.cropFrames.length; i++) {
      this.ctx.drawImage(Store.cropFrames[i], 0, 0);
    }
    this.ctx.restore();

    this.frameIndicator.textContent = `الكل (${toEnDigits(Store.cropFrames.length)})`;
  },

  toggleAllLayersMode() {
    if (!Store.cropFrames.length) return;
    Store.cropIsAllLayersMode = !Store.cropIsAllLayersMode;

    if (Store.cropIsAllLayersMode) {
      if (Store.cropIsPlaying) this.togglePlay();
      this.playBtn.disabled = true;
      this.timeline.disabled = true;
      this.allLayersBtn.classList.add('active');
      this.renderAllLayers();
    } else {
      this.playBtn.disabled = false;
      this.timeline.disabled = false;
      this.allLayersBtn.classList.remove('active');
      this.renderCurrentFrame();
    }
  },

  // حلقة التحريك والتشغيل
  animLoop(timestamp) {
    if (!Store.cropIsPlaying) return;
    const interval = 1000 / Store.cropFps;
    if (timestamp - this.lastFrameTime >= interval) {
      this.lastFrameTime = timestamp - ((timestamp - this.lastFrameTime) % interval);
      Store.cropCurrentIndex = (Store.cropCurrentIndex + 1) % Store.cropFrames.length;
      this.renderCurrentFrame();
    }
    this.animReqId = requestAnimationFrame((ts) => this.animLoop(ts));
  },

  togglePlay() {
    if (Store.cropIsAllLayersMode) return;

    if (Store.cropIsPlaying) {
      Store.cropIsPlaying = false;
      if (this.animReqId) cancelAnimationFrame(this.animReqId);
      if (this.playIcon) this.playIcon.textContent = 'play_arrow';
    } else {
      Store.cropIsPlaying = true;
      this.lastFrameTime = performance.now();
      if (this.playIcon) this.playIcon.textContent = 'pause';
      this.animReqId = requestAnimationFrame((ts) => this.animLoop(ts));
    }
  },

  // ضبط خطوط القص
  resetCropLines() {
    Store.cropCoords = { top: 0, bottom: 100, left: 0, right: 100 };
    this.requestCropUpdate();
  },

  requestCropUpdate() {
    if (this.updatePending) return;
    this.updatePending = true;
    requestAnimationFrame(() => {
      this.cropOverlay.style.setProperty('--ct', Store.cropCoords.top + '%');
      this.cropOverlay.style.setProperty('--cb', Store.cropCoords.bottom + '%');
      this.cropOverlay.style.setProperty('--cl', Store.cropCoords.left + '%');
      this.cropOverlay.style.setProperty('--cr', Store.cropCoords.right + '%');
      this.updatePending = false;
    });
  },

  // ربط السحب باللمس والفأرة لخطوط القص
  setupCropDragging() {
    const setupDrag = (element, axis, prop) => {
      if (!element) return;
      let isDragging = false;

      const onStart = (e) => {
        isDragging = true;
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!isDragging) return;
        const rect = this.stageBox.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (axis === 'Y') {
          let percent = ((clientY - rect.top) / rect.height) * 100;
          percent = Math.max(0, Math.min(100, percent));

          if (prop === 'top' && percent < Store.cropCoords.bottom - 2) Store.cropCoords.top = percent;
          if (prop === 'bottom' && percent > Store.cropCoords.top + 2) Store.cropCoords.bottom = percent;
        } else {
          let percent = ((clientX - rect.left) / rect.width) * 100;
          percent = Math.max(0, Math.min(100, percent));

          if (prop === 'left' && percent < Store.cropCoords.right - 2) Store.cropCoords.left = percent;
          if (prop === 'right' && percent > Store.cropCoords.left + 2) Store.cropCoords.right = percent;
        }
        this.requestCropUpdate();
      };

      const onEnd = () => { isDragging = false; };

      element.addEventListener('mousedown', onStart);
      element.addEventListener('touchstart', onStart, { passive: false });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    };

    setupDrag(this.lineTop, 'Y', 'top');
    setupDrag(this.lineBottom, 'Y', 'bottom');
    setupDrag(this.lineLeft, 'X', 'left');
    setupDrag(this.lineRight, 'X', 'right');
  },

  // تطبيق القص على كافة الإطارات
  applyCrop() {
    if (!Store.cropFrames.length) return;
    if (Store.cropIsPlaying) this.togglePlay();

    this.saveState();

    const firstCanvas = Store.cropFrames[0];
    const origW = firstCanvas.width;
    const origH = firstCanvas.height;

    const cropX = Math.round((Store.cropCoords.left / 100) * origW);
    const cropY = Math.round((Store.cropCoords.top / 100) * origH);
    const cropW = Math.round(((Store.cropCoords.right - Store.cropCoords.left) / 100) * origW);
    const cropH = Math.round(((Store.cropCoords.bottom - Store.cropCoords.top) / 100) * origH);

    if (cropW <= 0 || cropH <= 0) return;

    Store.cropFrames = Store.cropFrames.map(oldCanvas => {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = cropW;
      newCanvas.height = cropH;
      const newCtx = newCanvas.getContext('2d');
      newCtx.drawImage(oldCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return newCanvas;
    });

    this.updateStageDimensions();
    this.resetCropLines();

    if (Store.cropIsAllLayersMode) {
      this.renderAllLayers();
    } else {
      this.renderCurrentFrame();
    }
  },

  // نظام التراجع Undo
  saveState() {
    if (!Store.cropFrames.length) return;
    if (Store.cropHistory.length >= this.MAX_HISTORY) Store.cropHistory.shift();

    const snapshot = Store.cropFrames.map(c => {
      const clone = document.createElement('canvas');
      clone.width = c.width;
      clone.height = c.height;
      clone.getContext('2d').drawImage(c, 0, 0);
      return clone;
    });

    Store.cropHistory.push(snapshot);
    this.updateUndoUI();
  },

  undo() {
    if (!Store.cropHistory.length) return;
    if (Store.cropIsPlaying) this.togglePlay();

    Store.cropFrames = Store.cropHistory.pop();
    Store.cropCurrentIndex = Math.min(Store.cropCurrentIndex, Store.cropFrames.length - 1);
    this.updateStageDimensions();
    this.resetCropLines();

    if (Store.cropIsAllLayersMode) {
      this.renderAllLayers();
    } else {
      this.renderCurrentFrame();
    }
    this.updateUndoUI();
  },

  updateUndoUI() {
    if (this.undoBtn) this.undoBtn.disabled = Store.cropHistory.length === 0;
  },

  // مسح الكل والبدء من جديد
  clearAll() {
    if (Store.cropIsPlaying) this.togglePlay();

    Store.cropFrames = [];
    Store.cropHistory = [];
    Store.cropCurrentIndex = 0;
    Store.cropIsAllLayersMode = false;

    if (this.ctx) this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
    this.stageBox.style.display = 'none';
    this.cropOverlay.style.display = 'none';

    this.placeholder.style.display = 'flex';
    if (this.placeholderText) this.placeholderText.textContent = 'اضغط هنا أو اسحب وأفلت صور PNG أو متحركة GIF أو فيديو';
    this.stageCard.classList.add('empty-crop-card');

    this.timeline.value = 0;
    this.timeline.max = 0;
    this.frameIndicator.textContent = '0 / 0';

    this.disableUI();
  },

  enableUI() {
    this.timeline.disabled = false;
    this.timeline.max = Store.cropFrames.length - 1;
    this.playBtn.disabled = false;
    this.applyCropBtn.disabled = false;
    this.allLayersBtn.disabled = false;
    this.exportGifBtn.disabled = false;
    this.exportPngBtn.disabled = false;
    this.exportMp4Btn.disabled = false;
    this.clearBtn.disabled = false;
    this.speedDecBtn.disabled = false;
    this.speedIncBtn.disabled = false;
    this.cropOverlay.style.display = 'block';
  },

  disableUI() {
    this.timeline.disabled = true;
    this.playBtn.disabled = true;
    this.applyCropBtn.disabled = true;
    this.allLayersBtn.disabled = true;
    this.allLayersBtn.classList.remove('active');
    this.exportGifBtn.disabled = true;
    this.exportPngBtn.disabled = true;
    this.exportMp4Btn.disabled = true;
    this.clearBtn.disabled = true;
    this.undoBtn.disabled = true;
    this.speedDecBtn.disabled = true;
    this.speedIncBtn.disabled = true;
  },

  // دالة التحميل الموحدة
  downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // تصدير GIF
  exportGIF() {
    if (!Store.cropFrames.length || !window.gifshot) return;
    showProgress('جاري تركيب وتصدير GIF...');

    const images = Store.cropFrames.map(c => c.toDataURL('image/png'));
    window.gifshot.createGIF({
      images,
      interval: 1 / Store.cropFps,
      gifWidth: Store.cropFrames[0].width,
      gifHeight: Store.cropFrames[0].height,
      numWorkers: 4
    }, (obj) => {
      if (!obj.error) {
        const a = document.createElement('a');
        a.href = obj.image;
        a.download = 'cropped_animation.gif';
        a.click();
      }
      hideProgress();
    });
  },

  // تصدير حزمة ZIP للإطارات
  async exportPNGZip() {
    if (!Store.cropFrames.length || !window.JSZip) return;
    showProgress('جاري ضغط الإطارات المقصوصة كملف ZIP...');

    const zip = new JSZip();
    const folder = zip.folder('cropped_frames');
    const total = Store.cropFrames.length;

    Store.cropFrames.forEach((c, idx) => {
      const dataUrl = c.toDataURL('image/png').split(',')[1];
      const filename = `frame_${String(idx + 1).padStart(3, '0')}.png`;
      folder.file(filename, dataUrl, { base64: true });
      updateProgress(((idx + 1) / total) * 70);
    });

    const content = await zip.generateAsync({ type: 'blob' }, meta => {
      updateProgress(70 + meta.percent * 0.3);
    });

    this.downloadBlob(content, 'cropped_frames_sequence.zip');
    hideProgress();
  },

  // تصدير فيديو MP4
  async exportMP4() {
    if (!Store.cropFrames.length) return;
    if (Store.cropIsPlaying) this.togglePlay();

    showProgress('جاري تصدير الفيديو MP4...');

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Store.cropFrames[0].width;
    exportCanvas.height = Store.cropFrames[0].height;
    const exportCtx = exportCanvas.getContext('2d');

    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else {
        mimeType = 'video/webm';
      }
    }

    const stream = exportCanvas.captureStream(Store.cropFps);
    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }

    const chunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    const donePromise = new Promise(resolve => {
      mediaRecorder.onstop = () => {
        const isRealMp4 = (mediaRecorder.mimeType || mimeType).includes('mp4');
        const ext = isRealMp4 ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/mp4' });
        this.downloadBlob(blob, `cropped_video.${ext}`);
        resolve();
      };
    });

    mediaRecorder.start();
    const frameDelay = 1000 / Store.cropFps;
    const total = Store.cropFrames.length;

    for (let i = 0; i < total; i++) {
      exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      exportCtx.drawImage(Store.cropFrames[i], 0, 0);
      updateProgress(((i + 1) / total) * 100);
      await new Promise(res => setTimeout(res, frameDelay));
    }

    await new Promise(res => setTimeout(res, frameDelay));
    mediaRecorder.stop();
    await donePromise;
    hideProgress();
  }
};
