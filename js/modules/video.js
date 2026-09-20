/**
 * Media & Sprite Studio - Video Extraction Studio Module
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';
import { Collage } from './collage.js';

export const VideoStudio = {
  uploadInput: document.getElementById('videoUpload'),
  dropZone: document.getElementById('videoDropZone'),
  importBtn: document.getElementById('videoImportActionBtn'),
  emptyNotice: document.getElementById('videoEmptyNotice'),
  wrapper: document.getElementById('videoPlayerWrapper'),
  player: document.getElementById('mainVideoPlayer'),

  durationBadge: document.getElementById('vidDurationBadge'),
  resBadge: document.getElementById('vidResBadge'),
  estFramesBadge: document.getElementById('vidEstFramesBadge'),

  fpsInput: document.getElementById('videoFpsInput'),
  fpsVal: document.getElementById('videoFpsVal'),
  maxInput: document.getElementById('videoMaxFramesInput'),
  maxVal: document.getElementById('videoMaxFramesVal'),

  gifBtn: document.getElementById('extractGifBtn'),
  zipBtn: document.getElementById('extractZipBtn'),
  transferBtn: document.getElementById('transferVidToCollageBtn'),

  init() {
    this.bindEvents();
  },

  bindEvents() {
    this.importBtn?.addEventListener('click', () => this.uploadInput?.click());
    this.dropZone?.addEventListener('click', (e) => {
      if (e.target === this.player) return;
      this.uploadInput?.click();
    });

    this.uploadInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        Store.currentVideoFile = e.target.files[0];
        this.player.src = URL.createObjectURL(Store.currentVideoFile);
        this.player.onloadedmetadata = () => {
          this.emptyNotice.style.display = 'none';
          this.wrapper.style.display = 'flex';
          this.gifBtn.disabled = false;
          this.zipBtn.disabled = false;
          this.transferBtn.disabled = false;

          this.durationBadge.textContent = `${toEnDigits(this.player.duration.toFixed(1))} ثانية`;
          this.resBadge.textContent = `${toEnDigits(this.player.videoWidth)}x${toEnDigits(this.player.videoHeight)}`;
          this.updateEstimated();
        };
      }
    });

    this.fpsInput?.addEventListener('input', (e) => {
      this.fpsVal.textContent = `${toEnDigits(e.target.value)} FPS`;
      this.updateEstimated();
    });

    this.maxInput?.addEventListener('input', (e) => {
      this.maxVal.textContent = toEnDigits(e.target.value);
      this.updateEstimated();
    });

    // أزرار التصدير في الشريط العلوي للهيدر
    this.gifBtn?.addEventListener('click', async () => {
      const frames = await this.extractFrames();
      if (!frames.length) return hideProgress();

      showProgress('جاري إنشاء ملف GIF...');
      const images = frames.map(f => f.toDataURL('image/png'));
      window.gifshot.createGIF({
        images,
        gifWidth: Math.min(frames[0].width, 600),
        gifHeight: Math.min(frames[0].height, (frames[0].height * (600 / frames[0].width))),
        interval: 1 / (parseInt(toEnDigits(this.fpsInput.value)) || 10),
        numWorkers: 4
      }, (obj) => {
        if (!obj.error) {
          const a = document.createElement('a');
          a.href = obj.image;
          a.download = 'video_animation.gif';
          a.click();
        }
        hideProgress();
      });
    });

    this.zipBtn?.addEventListener('click', async () => {
      const frames = await this.extractFrames();
      if (!frames.length) return hideProgress();

      showProgress('جاري ضغط الإطارات...');
      const zip = new JSZip();
      const folder = zip.folder('video_frames');
      frames.forEach((f, idx) => {
        folder.file(`frame_${String(idx + 1).padStart(4, '0')}.png`, f.toDataURL('image/png').split(',')[1], { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' }, (m) => updateProgress(m.percent));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'video_frames.zip';
      a.click();
      hideProgress();
    });

    this.transferBtn?.addEventListener('click', async () => {
      const frames = await this.extractFrames();
      if (!frames.length) return hideProgress();

      const promises = frames.map(f => new Promise(res => {
        const img = new Image();
        img.onload = () => res({ img });
        img.src = f.toDataURL('image/png');
      }));
      const imported = await Promise.all(promises);
      Store.collageImages.push(...imported);
      hideProgress();
      document.getElementById('tabCollageBtn')?.click();
      Collage.updateUI();
      Collage.render();
    });
  },

  updateEstimated() {
    if (!this.player.duration) return;
    const fps = parseInt(toEnDigits(this.fpsInput.value)) || 10;
    const max = parseInt(toEnDigits(this.maxInput.value)) || 80;
    const est = Math.min(Math.floor(this.player.duration * fps), max);
    this.estFramesBadge.textContent = `${toEnDigits(est)} فريم`;
  },

  async extractFrames() {
    if (!Store.currentVideoFile) return [];
    const fps = parseInt(toEnDigits(this.fpsInput.value)) || 10;
    const max = parseInt(toEnDigits(this.maxInput.value)) || 80;
    showProgress('جاري استخراج الفريمات...');

    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.src = URL.createObjectURL(Store.currentVideoFile);
      v.muted = true;
      v.playsInline = true;

      v.onloadedmetadata = async () => {
        const duration = v.duration;
        const interval = 1 / fps;
        const total = Math.min(Math.floor(duration * fps), max);

        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext('2d');

        const extracted = [];
        let curr = 0;

        for (let i = 0; i < total; i++) {
          v.currentTime = curr;
          await new Promise(r => { v.onseeked = r; });
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

          const frame = document.createElement('canvas');
          frame.width = canvas.width;
          frame.height = canvas.height;
          frame.getContext('2d').drawImage(canvas, 0, 0);
          extracted.push(frame);

          curr += interval;
          if (curr > duration) break;
          updateProgress(((i + 1) / total) * 95);
        }

        updateProgress(100);
        resolve(extracted);
      };
    });
  }
};
