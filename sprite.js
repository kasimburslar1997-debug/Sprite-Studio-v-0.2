/**
 * Media & Sprite Studio - Sprite Studio Module
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';
import { Collage } from './collage.js';

export const Sprite = {
    uploadInput: document.getElementById('spriteUpload'),
    dropZone: document.getElementById('spriteDropZone'),
    importBtn: document.getElementById('spriteImportActionBtn'),
    emptyNotice: document.getElementById('spriteEmptyNotice'),
    wrapper: document.getElementById('spriteCanvasWrapper'),
    canvas: document.getElementById('spriteCanvas'),
    ctx: document.getElementById('spriteCanvas')?.getContext('2d'),

    colsNum: document.getElementById('spriteColsNum'),
    colsIncBtn: document.getElementById('spriteColsIncBtn'),
    colsDecBtn: document.getElementById('spriteColsDecBtn'),

    rowsNum: document.getElementById('spriteRowsNum'),
    rowsIncBtn: document.getElementById('spriteRowsIncBtn'),
    rowsDecBtn: document.getElementById('spriteRowsDecBtn'),

    totalFramesBadge: document.getElementById('totalFramesBadge'),
    bgColorInput: document.getElementById('spriteBgColor'),

    animCanvas: document.getElementById('animCanvas'),
    animCtx: document.getElementById('animCanvas')?.getContext('2d'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    playText: document.getElementById('playText'),
    fpsInput: document.getElementById('fpsInput'),
    fpsVal: document.getElementById('fpsVal'),

    openPivotBtn: document.getElementById('openPivotEditorBtn'),
    exportMp4Btn: document.getElementById('exportSpriteMp4Btn'),
    exportGifBtn: document.getElementById('exportSpriteGifBtn'),
    exportZipBtn: document.getElementById('exportZipBtn'),
    transferBtn: document.getElementById('transferToCollageBtn'),

    editOrderBtn: document.getElementById('editSpriteOrderBtn'),
    editActions: document.getElementById('editModeActions'),
    confirmOrderBtn: document.getElementById('confirmSpriteOrderBtn'),
    cancelOrderBtn: document.getElementById('cancelSpriteOrderBtn'),

    selectDeleteBtn: document.getElementById('spriteSelectDeleteBtn'),
    deleteActions: document.getElementById('spriteDeleteActions'),
    confirmDeleteBtn: document.getElementById('confirmSpriteDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelSpriteDeleteBtn'),
    deleteBadge: document.getElementById('spriteDeleteCountBadge'),

    init() {
        this.bindEvents();
        if (this.fpsVal && this.fpsInput) this.fpsVal.textContent = toEnDigits(this.fpsInput.value);
    },

    bindEvents() {
        this.importBtn?.addEventListener('click', () => this.uploadInput?.click());
        this.dropZone?.addEventListener('click', (e) => {
            if (Store.isSpriteEditMode || Store.isSpriteDeleteMode || e.target === this.canvas) return;
            this.uploadInput?.click();
        });

        this.uploadInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) this.loadImage(e.target.files[0]);
        });

        this.colsIncBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.colsNum.value)) || 1;
            this.colsNum.value = toEnDigits(Math.min(40, current + 1));
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.colsDecBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.colsNum.value)) || 1;
            this.colsNum.value = toEnDigits(Math.max(1, current - 1));
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.colsNum?.addEventListener('input', () => {
            this.colsNum.value = toEnDigits(this.colsNum.value);
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.rowsIncBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.rowsNum.value)) || 1;
            this.rowsNum.value = toEnDigits(Math.min(40, current + 1));
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.rowsDecBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.rowsNum.value)) || 1;
            this.rowsNum.value = toEnDigits(Math.max(1, current - 1));
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.rowsNum?.addEventListener('input', () => {
            this.rowsNum.value = toEnDigits(this.rowsNum.value);
            this.exitEditMode(false);
            this.exitDeleteMode();
            this.updateGrid();
        });

        this.bgColorInput?.addEventListener('input', (e) => {
            Store.spriteBgColor = e.target.value;
            this.render();
            this.drawAnimFrame();
        });

        this.fpsInput?.addEventListener('input', (e) => {
            if (this.fpsVal) this.fpsVal.textContent = toEnDigits(e.target.value);
            if (Store.isPlaying) {
                this.stopAnimation();
                this.startAnimation();
            }
        });

        this.playPauseBtn?.addEventListener('click', () => {
            if (Store.isPlaying) this.stopAnimation();
            else this.startAnimation();
        });

        this.canvas?.addEventListener('click', (e) => this.handleCanvasClick(e));

        this.editOrderBtn?.addEventListener('click', () => {
            if (!Store.slicedFrames.length) return;
            this.stopAnimation();
            this.exitDeleteMode();
            Store.isSpriteEditMode = true;
            Store.backupFrames = [...Store.slicedFrames];
            Store.selectedFrameIndex = null;
            this.editOrderBtn.style.display = 'none';
            this.editActions.style.display = 'flex';
            this.wrapper.classList.add('editing');
            this.render();
        });

        this.confirmOrderBtn?.addEventListener('click', () => this.exitEditMode(true));
        this.cancelOrderBtn?.addEventListener('click', () => {
            if (Store.backupFrames.length) Store.slicedFrames = [...Store.backupFrames];
            this.exitEditMode(false);
        });

        this.selectDeleteBtn?.addEventListener('click', () => {
            if (!Store.slicedFrames.length) return;
            this.stopAnimation();
            this.exitEditMode(false);
            Store.isSpriteDeleteMode = true;
            Store.selectedSpriteDeleteFrames.clear();
            this.selectDeleteBtn.style.display = 'none';
            this.deleteActions.style.display = 'flex';
            this.wrapper.classList.add('deleting');
            this.deleteBadge.textContent = `تم تحديد ${toEnDigits(0)} فريم`;
            this.render();
        });

        this.cancelDeleteBtn?.addEventListener('click', () => this.exitDeleteMode());
        this.confirmDeleteBtn?.addEventListener('click', () => {
            if (!Store.selectedSpriteDeleteFrames.size) {
                this.exitDeleteMode();
                return;
            }
            Store.slicedFrames = Store.slicedFrames.filter((_, i) => !Store.selectedSpriteDeleteFrames.has(i));
            Store.framePivots = Store.framePivots.filter((_, i) => !Store.selectedSpriteDeleteFrames.has(i));
            if (this.totalFramesBadge) {
                this.totalFramesBadge.textContent = `إجمالي الإطارات: ${toEnDigits(Store.slicedFrames.length)}`;
            }
            Store.currentFrameIndex = 0;
            this.exitDeleteMode();
            this.render();
            this.drawAnimFrame();
        });

        this.exportMp4Btn?.addEventListener('click', () => this.exportMP4());
        this.exportGifBtn?.addEventListener('click', () => this.exportGIF());
        this.exportZipBtn?.addEventListener('click', () => this.exportZIP());
        this.transferBtn?.addEventListener('click', () => this.transferFrames());
    },

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                Store.spriteImage = img;
                this.emptyNotice.style.display = 'none';
                this.wrapper.style.display = 'flex';

                [
                    this.playPauseBtn, this.openPivotBtn, this.exportMp4Btn,
                    this.exportGifBtn, this.exportZipBtn, this.transferBtn,
                    this.editOrderBtn, this.selectDeleteBtn
                ].forEach(b => { if (b) b.disabled = false; });

                this.exitEditMode(false);
                this.exitDeleteMode();
                this.updateGrid();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    updateGrid() {
        if (!Store.spriteImage) return;
        const cols = parseInt(toEnDigits(this.colsNum.value)) || 1;
        const rows = parseInt(toEnDigits(this.rowsNum.value)) || 1;
        if (this.totalFramesBadge) {
            this.totalFramesBadge.textContent = `إجمالي الإطارات: ${toEnDigits(cols * rows)}`;
        }

        this.canvas.width = Store.spriteImage.width;
        this.canvas.height = Store.spriteImage.height;

        const cellW = Store.spriteImage.width / cols;
        const cellH = Store.spriteImage.height / rows;

        Store.slicedFrames = [];
        Store.framePivots = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = cellW;
                offCanvas.height = cellH;
                offCanvas.getContext('2d').drawImage(
                    Store.spriteImage,
                    c * cellW, r * cellH, cellW, cellH,
                    0, 0, cellW, cellH
                );
                Store.slicedFrames.push(offCanvas);
                Store.framePivots.push({ x: 0.5, y: 0.5 });
            }
        }

        Store.currentFrameIndex = 0;
        this.render();
        this.drawAnimFrame();
    },

    render() {
        if (!Store.spriteImage || !Store.slicedFrames.length) return;
        const cols = parseInt(toEnDigits(this.colsNum.value)) || 1;
        const rows = parseInt(toEnDigits(this.rowsNum.value)) || 1;
        const cellW = this.canvas.width / cols;
        const cellH = this.canvas.height / rows;

        const bgColor = this.bgColorInput?.value || Store.spriteBgColor || '#FFFFFF';

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < Store.slicedFrames.length; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const frame = Store.slicedFrames[i];
            if (frame) this.ctx.drawImage(frame, c * cellW, r * cellH, cellW, cellH);

            if (Store.isSpriteEditMode) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.fillRect(c * cellW + 6, r * cellH + 6, 26, 20);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(toEnDigits(i + 1), c * cellW + 19, r * cellH + 16);
            }

            if (Store.isSpriteDeleteMode && Store.selectedSpriteDeleteFrames.has(i)) {
                this.ctx.fillStyle = 'rgba(255, 59, 92, 0.45)';
                this.ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                this.ctx.strokeStyle = '#FF3B5C';
                this.ctx.lineWidth = Math.max(3, Math.min(cellW, cellH) * 0.04);
                this.ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);

                const cx = c * cellW + cellW / 2;
                const cy = r * cellH + cellH / 2;
                const sz = Math.min(cellW, cellH) * 0.2;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 3.5;
                this.ctx.beginPath();
                this.ctx.moveTo(cx - sz, cy - sz);
                this.ctx.lineTo(cx + sz, cy + sz);
                this.ctx.moveTo(cx + sz, cy - sz);
                this.ctx.lineTo(cx - sz, cy + sz);
                this.ctx.stroke();
            }
        }

        this.ctx.strokeStyle = Store.isSpriteEditMode ? 'rgba(255, 59, 92, 0.7)' : (Store.isSpriteDeleteMode ? 'rgba(255, 59, 92, 0.5)' : '#FF3B5C');
        this.ctx.lineWidth = Math.max(1, Math.min(cellW, cellH) * 0.02);

        for (let c = 1; c < cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * cellW, 0);
            this.ctx.lineTo(c * cellW, this.canvas.height);
            this.ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * cellH);
            this.ctx.lineTo(this.canvas.width, r * cellH);
            this.ctx.stroke();
        }

        if (Store.isSpriteEditMode && Store.selectedFrameIndex !== null) {
            const r = Math.floor(Store.selectedFrameIndex / cols);
            const c = Store.selectedFrameIndex % cols;
            this.ctx.fillStyle = 'rgba(0, 200, 83, 0.35)';
            this.ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
            this.ctx.strokeStyle = '#00E676';
            this.ctx.lineWidth = Math.max(3, Math.min(cellW, cellH) * 0.04);
            this.ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
        }
    },

    handleCanvasClick(e) {
        if ((!Store.isSpriteEditMode && !Store.isSpriteDeleteMode) || !Store.slicedFrames.length) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const cols = parseInt(toEnDigits(this.colsNum.value)) || 1;
        const rows = parseInt(toEnDigits(this.rowsNum.value)) || 1;
        const cellW = this.canvas.width / cols;
        const cellH = this.canvas.height / rows;

        const col = Math.floor(x / cellW);
        const row = Math.floor(y / cellH);
        if (col < 0 || col >= cols || row < 0 || row >= rows) return;

        const idx = row * cols + col;
        if (idx >= Store.slicedFrames.length) return;

        if (Store.isSpriteDeleteMode) {
            if (Store.selectedSpriteDeleteFrames.has(idx)) Store.selectedSpriteDeleteFrames.delete(idx);
            else Store.selectedSpriteDeleteFrames.add(idx);
            this.deleteBadge.textContent = `تم تحديد ${toEnDigits(Store.selectedSpriteDeleteFrames.size)} فريم`;
        } else if (Store.isSpriteEditMode) {
            if (Store.selectedFrameIndex === null) {
                Store.selectedFrameIndex = idx;
            } else if (Store.selectedFrameIndex === idx) {
                Store.selectedFrameIndex = null;
            } else {
                const tFrame = Store.slicedFrames[Store.selectedFrameIndex];
                Store.slicedFrames[Store.selectedFrameIndex] = Store.slicedFrames[idx];
                Store.slicedFrames[idx] = tFrame;

                const tPivot = Store.framePivots[Store.selectedFrameIndex];
                Store.framePivots[Store.selectedFrameIndex] = Store.framePivots[idx];
                Store.framePivots[idx] = tPivot;

                Store.selectedFrameIndex = null;
            }
        }

        this.render();
        this.drawAnimFrame();
    },

    exitEditMode(save) {
        Store.isSpriteEditMode = false;
        Store.selectedFrameIndex = null;
        Store.backupFrames = [];
        if (this.editOrderBtn) this.editOrderBtn.style.display = 'flex';
        if (this.editActions) this.editActions.style.display = 'none';
        this.wrapper?.classList.remove('editing');
        this.render();
        this.drawAnimFrame();
    },

    exitDeleteMode() {
        Store.isSpriteDeleteMode = false;
        Store.selectedSpriteDeleteFrames.clear();
        if (this.selectDeleteBtn) this.selectDeleteBtn.style.display = 'flex';
        if (this.deleteActions) this.deleteActions.style.display = 'none';
        this.wrapper?.classList.remove('deleting');
        this.render();
    },

    drawAnimFrame() {
        if (!Store.slicedFrames.length || !this.animCanvas) return;
        const frame = Store.slicedFrames[Store.currentFrameIndex % Store.slicedFrames.length];
        this.animCanvas.width = frame.width;
        this.animCanvas.height = frame.height;

        const bgColor = this.bgColorInput?.value || Store.spriteBgColor || '#FFFFFF';
        this.animCtx.fillStyle = bgColor;
        this.animCtx.fillRect(0, 0, this.animCanvas.width, this.animCanvas.height);

        this.animCtx.imageSmoothingEnabled = false;
        this.animCtx.drawImage(frame, 0, 0);
    },

    startAnimation() {
        if (!Store.slicedFrames.length) return;
        Store.isPlaying = true;
        if (this.playIcon) this.playIcon.textContent = 'pause';
        if (this.playText) this.playText.textContent = 'إيقاف';
        const fps = parseInt(toEnDigits(this.fpsInput.value)) || 12;
        Store.animInterval = setInterval(() => {
            Store.currentFrameIndex = (Store.currentFrameIndex + 1) % Store.slicedFrames.length;
            this.drawAnimFrame();
        }, 1000 / fps);
    },

    stopAnimation() {
        Store.isPlaying = false;
        if (this.playIcon) this.playIcon.textContent = 'play_arrow';
        if (this.playText) this.playText.textContent = 'تشغيل';
        if (Store.animInterval) clearInterval(Store.animInterval);
    },

    async exportMP4() {
        if (!Store.slicedFrames.length) return;
        showProgress('جاري تصدير فيديو الحركة MP4...');

        const fps = parseInt(toEnDigits(this.fpsInput.value)) || 12;
        const duration = 1000 / fps;
        const total = Store.slicedFrames.length;

        const rCanvas = document.createElement('canvas');
        rCanvas.width = Store.slicedFrames[0].width;
        rCanvas.height = Store.slicedFrames[0].height;
        const rCtx = rCanvas.getContext('2d');
        const bgColor = this.bgColorInput?.value || Store.spriteBgColor || '#FFFFFF';

        const stream = rCanvas.captureStream(fps);
        let mime = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mime)) {
            mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        }

        let rec;
        try { rec = new MediaRecorder(stream, { mimeType: mime }); }
        catch { rec = new MediaRecorder(stream); }

        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        const donePromise = new Promise(res => {
            rec.onstop = () => {
                const isMp4 = mime.includes('mp4');
                const blob = new Blob(chunks, { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = isMp4 ? 'sprite_animation.mp4' : 'sprite_animation.webm';
                a.click();
                URL.revokeObjectURL(url);
                res();
            };
        });

        rec.start();
        for (let i = 0; i < total; i++) {
            rCtx.fillStyle = bgColor;
            rCtx.fillRect(0, 0, rCanvas.width, rCanvas.height);
            rCtx.drawImage(Store.slicedFrames[i], 0, 0);
            updateProgress(((i + 1) / total) * 100);
            await new Promise(r => setTimeout(r, duration));
        }
        await new Promise(r => setTimeout(r, duration));
        rec.stop();
        await donePromise;
        hideProgress();
    },

    exportGIF() {
        if (!Store.slicedFrames.length || !window.gifshot) return;
        showProgress('جاري تركيب ملف GIF...');
        const bgColor = this.bgColorInput?.value || Store.spriteBgColor || '#FFFFFF';

        const images = Store.slicedFrames.map(f => {
            const c = document.createElement('canvas');
            c.width = f.width;
            c.height = f.height;
            const ctx = c.getContext('2d');
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(f, 0, 0);
            return c.toDataURL('image/png');
        });

        const fps = parseInt(toEnDigits(this.fpsInput.value)) || 12;

        window.gifshot.createGIF({
            images,
            gifWidth: Math.min(Store.slicedFrames[0].width, 600),
            gifHeight: Math.min(Store.slicedFrames[0].height, (Store.slicedFrames[0].height * (600 / Store.slicedFrames[0].width))),
            interval: 1 / fps,
            numWorkers: 4
        }, (obj) => {
            if (!obj.error) {
                const a = document.createElement('a');
                a.href = obj.image;
                a.download = 'sprite_animation.gif';
                a.click();
            }
            hideProgress();
        });
    },

    async exportZIP() {
        if (!Store.slicedFrames.length || !window.JSZip) return;
        showProgress('جاري ضغط الملفات...');
        const zip = new JSZip();
        const folder = zip.folder('sprite_frames');

        Store.slicedFrames.forEach((f, idx) => {
            const data = f.toDataURL('image/png').split(',')[1];
            folder.file(`frame_${String(idx + 1).padStart(3, '0')}.png`, data, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' }, (meta) => updateProgress(meta.percent));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'sprite_frames.zip';
        a.click();
        hideProgress();
    },

    async transferFrames() {
        if (!Store.slicedFrames.length) return;
        const promises = Store.slicedFrames.map(f => new Promise(res => {
            const img = new Image();
            img.onload = () => res({ img });
            img.src = f.toDataURL('image/png');
        }));

        const imported = await Promise.all(promises);
        Store.collageImages.push(...imported);
        document.getElementById('tabCollageBtn')?.click();
        Collage.updateUI();
        Collage.render();
    }
};