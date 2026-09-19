/**
 * Media & Sprite Studio - Collage Studio Module (Precise Aspect Ratios & Clean Border Bounds)
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';
import { PalettePicker } from './palette.js';

export const Collage = {
    fileInput: document.getElementById('imgUpload'),
    dropZone: document.getElementById('dropZone'),
    importBtn: document.getElementById('collageImportActionBtn'),
    clearBtn: document.getElementById('clearBtn'),
    canvas: document.getElementById('previewCanvas'),
    ctx: document.getElementById('previewCanvas')?.getContext('2d'),
    emptyNotice: document.getElementById('emptyNotice'),
    counterNum: document.getElementById('imageCounterNum'),

    sizeNum: document.getElementById('imgSizeNum'),
    sizeIncBtn: document.getElementById('sizeIncBtn'),
    sizeDecBtn: document.getElementById('sizeDecBtn'),

    colsNum: document.getElementById('columnsNum'),
    colsIncBtn: document.getElementById('colsIncBtn'),
    colsDecBtn: document.getElementById('colsDecBtn'),

    ratioBtn: document.getElementById('collageRatioBtn'),
    ratioPopup: document.getElementById('collageRatioPopup'),
    ratioLabel: document.getElementById('collageRatioLabel'),
    ratioBtnPreview: document.getElementById('ratioBtnPreview'),

    gapInput: document.getElementById('imgGap'),
    gapVal: document.getElementById('imgGapVal'),
    strokeInput: document.getElementById('strokeWidth'),
    strokeVal: document.getElementById('strokeWidthVal'),
    strokePreview: document.getElementById('strokeColorPreview'),
    bgPreview: document.getElementById('collageBgColorPreview'),

    selectModeBtn: document.getElementById('collageSelectModeBtn'),
    selectActions: document.getElementById('collageSelectActions'),
    deleteSelectedBtn: document.getElementById('collageDeleteSelectedBtn'),
    cancelSelectBtn: document.getElementById('collageCancelSelectBtn'),
    selectCountBadge: document.getElementById('collageSelectCountBadge'),

    init() {
        this.bindEvents();
        this.initDefaultRatioUI();
        this.rebindHeaderExports();
    },

    rebindHeaderExports() {
        document.getElementById('exportPNGBtn')?.addEventListener('click', () => this.exportPNG());
        document.getElementById('exportPDFBtn')?.addEventListener('click', () => this.exportPDF());
    },

    initDefaultRatioUI() {
        const activeBtn = document.querySelector(`.ratio-option-btn[data-ratio="${Store.collageRatio}"]`);
        if (activeBtn && this.ratioLabel) {
            document.querySelectorAll('.ratio-option-btn').forEach(b => b.classList.remove('active'));
            activeBtn.classList.add('active');
            this.ratioLabel.textContent = toEnDigits(Store.collageRatioLabel);
            const icon = activeBtn.querySelector('.ratio-box-icon');
            if (icon && this.ratioBtnPreview) {
                this.ratioBtnPreview.innerHTML = icon.outerHTML;
            }
        }
    },

    bindEvents() {
        window.addEventListener('headerExportsChanged', (e) => {
            if (e.detail.tabId === 'collage') this.rebindHeaderExports();
        });

        this.importBtn?.addEventListener('click', () => this.fileInput?.click());
        this.dropZone?.addEventListener('click', (e) => {
            if (Store.isCollageSelectMode || e.target === this.canvas) return;
            this.fileInput?.click();
        });

        this.fileInput?.addEventListener('change', (e) => this.loadFiles(e.target.files));

        // تشغيل شريط الألوان العائم عند النقر على دوائر الألوان
        document.querySelector('.trigger-palette[data-target="collageStroke"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            PalettePicker.open('collageStroke', this.strokePreview, (chosenColor) => {
                Store.collageStrokeColor = chosenColor;
                this.strokePreview.style.backgroundColor = chosenColor === 'transparent' ? 'none' : chosenColor;
                this.render();
            });
        });

        document.querySelector('.trigger-palette[data-target="collageBg"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            PalettePicker.open('collageBg', this.bgPreview, (chosenColor) => {
                Store.collageBgColor = chosenColor;
                this.bgPreview.style.backgroundColor = chosenColor === 'transparent' ? 'none' : chosenColor;
                this.render();
            });
        });

        // السحب والإفلات
        this.dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = 'var(--accent-red)';
        });
        this.dropZone?.addEventListener('dragleave', () => {
            this.dropZone.style.borderColor = 'transparent';
        });
        this.dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = 'transparent';
            if (e.dataTransfer.files) this.loadFiles(e.dataTransfer.files);
        });

        this.sizeIncBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.sizeNum.value)) || 128;
            this.sizeNum.value = toEnDigits(Math.min(4096, current * 2));
            this.render();
        });

        this.sizeDecBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.sizeNum.value)) || 128;
            this.sizeNum.value = toEnDigits(Math.max(16, Math.floor(current / 2)));
            this.render();
        });

        this.sizeNum?.addEventListener('input', () => {
            this.sizeNum.value = toEnDigits(this.sizeNum.value);
            this.render();
        });

        this.colsIncBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.colsNum.value)) || 1;
            this.colsNum.value = toEnDigits(Math.min(24, current + 1));
            this.render();
        });

        this.colsDecBtn?.addEventListener('click', () => {
            let current = parseInt(toEnDigits(this.colsNum.value)) || 1;
            this.colsNum.value = toEnDigits(Math.max(1, current - 1));
            this.render();
        });

        this.colsNum?.addEventListener('input', () => {
            this.colsNum.value = toEnDigits(this.colsNum.value);
            this.render();
        });

        this.ratioBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.ratioPopup.style.display = this.ratioPopup.style.display === 'none' ? 'flex' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (this.ratioPopup && !this.ratioPopup.contains(e.target) && e.target !== this.ratioBtn && !this.ratioBtn.contains(e.target)) {
                this.ratioPopup.style.display = 'none';
            }
        });

        document.querySelectorAll('.ratio-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ratio-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const ratio = btn.dataset.ratio;
                Store.collageRatio = ratio;

                if (ratio === 'auto') {
                    Store.collageRatioW = null;
                    Store.collageRatioH = null;
                    Store.collageRatioLabel = 'حجم تلقائي';
                    if (this.ratioLabel) this.ratioLabel.textContent = 'حجم تلقائي';
                    if (this.ratioBtnPreview) {
                        this.ratioBtnPreview.innerHTML = '<span class="material-symbols-rounded red-icon" style="font-size:18px;">crop_free</span>';
                    }
                } else {
                    Store.collageRatioW = parseFloat(btn.dataset.w);
                    Store.collageRatioH = parseFloat(btn.dataset.h);
                    Store.collageRatioLabel = ratio;
                    if (this.ratioLabel) this.ratioLabel.textContent = toEnDigits(ratio);
                    const iconSpan = btn.querySelector('.ratio-box-icon');
                    if (iconSpan && this.ratioBtnPreview) {
                        this.ratioBtnPreview.innerHTML = iconSpan.outerHTML;
                    }
                }

                this.ratioPopup.style.display = 'none';
                this.render();
            });
        });

        this.gapInput?.addEventListener('input', (e) => {
            if (this.gapVal) this.gapVal.textContent = `${toEnDigits(e.target.value)}px`;
            this.render();
        });

        this.strokeInput?.addEventListener('input', (e) => {
            if (this.strokeVal) this.strokeVal.textContent = `${toEnDigits(e.target.value)}px`;
            this.render();
        });

        this.canvas?.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.selectModeBtn?.addEventListener('click', () => this.toggleSelectMode(true));
        this.cancelSelectBtn?.addEventListener('click', () => this.toggleSelectMode(false));
        this.deleteSelectedBtn?.addEventListener('click', () => this.deleteSelected());
        this.clearBtn?.addEventListener('click', () => this.clearAll());
    },

    async loadFiles(files) {
        if (!files || !files.length) return;
        const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!valid.length) return;

        showProgress('جاري استيراد الصور...');
        const promises = valid.map((file, i) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    updateProgress(((i + 1) / valid.length) * 100);
                    resolve({ img });
                };
                img.onerror = () => resolve(null);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }));

        const loaded = (await Promise.all(promises)).filter(Boolean);
        Store.collageImages.push(...loaded);
        if (this.fileInput) this.fileInput.value = '';
        this.updateUI();
        this.render();
        hideProgress();
    },

    updateUI() {
        const hasImages = Store.collageImages.length > 0;
        if (this.emptyNotice) this.emptyNotice.style.display = hasImages ? 'none' : 'flex';
        if (this.canvas) this.canvas.style.display = hasImages ? 'block' : 'none';
        if (this.counterNum) this.counterNum.textContent = toEnDigits(Store.collageImages.length);
    },

    // الرسم الهندسي الدقيق للنسب العالمية بدون تشويه
    render() {
        if (!Store.collageImages.length) {
            this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const imgSize = parseInt(toEnDigits(this.sizeNum?.value)) || 128;
        const columns = Math.max(1, parseInt(toEnDigits(this.colsNum?.value)) || 1);
        const gap = parseInt(toEnDigits(this.gapInput?.value)) || 0;
        const strokeWidth = parseInt(toEnDigits(this.strokeInput?.value)) || 0;
        const strokeColor = Store.collageStrokeColor || '#FF3B5C';
        const bgColor = Store.collageBgColor || '#FFFFFF';

        const isFixedRatio = Store.collageRatio !== 'auto' && Store.collageRatioW && Store.collageRatioH;
        let positions = [];
        let totalWidth = 0;
        let totalHeight = 0;

        const pad = strokeWidth; // هوامش أمان لعدم قطع الحدود نهائياً

        if (isFixedRatio) {
            const targetRatio = Store.collageRatioW / Store.collageRatioH;
            const cellW = imgSize;
            const cellH = Math.round(cellW / targetRatio);
            const totalCols = columns;
            const totalRows = Math.ceil(Store.collageImages.length / totalCols);

            totalWidth = totalCols * cellW + (totalCols - 1) * gap + (pad * 2);
            totalHeight = totalRows * cellH + (totalRows - 1) * gap + (pad * 2);

            positions = Store.collageImages.map((item, i) => {
                const col = i % totalCols;
                const row = Math.floor(i / totalCols);
                const cellX = pad + col * (cellW + gap);
                const cellY = pad + row * (cellH + gap);

                const imgW = item.img.naturalWidth || item.img.width || cellW;
                const imgH = item.img.naturalHeight || item.img.height || cellH;
                const imgRatio = imgW / imgH;

                // Cover / Center-crop: لملء النسبة العالمية المحددة بدقة كاملة
                let sWidth, sHeight, sx, sy;
                if (imgRatio > targetRatio) {
                    sHeight = imgH;
                    sWidth = imgH * targetRatio;
                    sx = (imgW - sWidth) / 2;
                    sy = 0;
                } else {
                    sWidth = imgW;
                    sHeight = imgW / targetRatio;
                    sx = 0;
                    sy = (imgH - sHeight) / 2;
                }

                return {
                    x: cellX, y: cellY, w: cellW, h: cellH,
                    sx, sy, sWidth, sHeight,
                    drawX: cellX, drawY: cellY, drawW: cellW, drawH: cellH
                };
            });
        } else {
            const cellWidth = imgSize;
            const cellHeights = Store.collageImages.map(o => (cellWidth / (o.img.naturalWidth || o.img.width)) * (o.img.naturalHeight || o.img.height));
            const colTops = Array(columns).fill(pad);
            positions = Array(Store.collageImages.length);

            for (let i = 0; i < Store.collageImages.length; i++) {
                const col = i % columns;
                const x = pad + col * (cellWidth + gap);
                const y = colTops[col];
                const h = cellHeights[i];
                positions[i] = {
                    x, y, w: cellWidth, h,
                    sx: 0, sy: 0,
                    sWidth: Store.collageImages[i].img.naturalWidth,
                    sHeight: Store.collageImages[i].img.naturalHeight,
                    drawX: x, drawY: y, drawW: cellWidth, drawH: h
                };
                colTops[col] += h + gap;
            }

            totalHeight = Math.max(...colTops) - gap + pad;
            totalWidth = columns * cellWidth + (columns - 1) * gap + (pad * 2);
        }

        Store.collagePositions = positions;

        this.canvas.width = Math.max(10, Math.round(totalWidth));
        this.canvas.height = Math.max(10, Math.round(totalHeight));

        // خلفية الكانفاس
        if (bgColor !== 'transparent') {
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        Store.collageImages.forEach((item, index) => {
            const p = positions[index];
            this.ctx.save();

            // قص الإطار بدقة لمنع التداخل
            this.ctx.beginPath();
            this.ctx.rect(p.x, p.y, p.w, p.h);
            this.ctx.clip();

            this.ctx.drawImage(
                item.img,
                p.sx, p.sy, p.sWidth, p.sHeight,
                p.drawX, p.drawY, p.drawW, p.drawH
            );
            this.ctx.restore();

            // رسم الإطار الخارجي
            if (strokeWidth > 0 && strokeColor !== 'transparent') {
                this.ctx.lineWidth = strokeWidth;
                this.ctx.strokeStyle = strokeColor;
                this.ctx.strokeRect(p.x, p.y, p.w, p.h);
            }

            // وضع التحديد
            if (Store.isCollageSelectMode && Store.selectedCollageIndices.has(index)) {
                this.ctx.fillStyle = 'rgba(255, 59, 92, 0.4)';
                this.ctx.fillRect(p.x, p.y, p.w, p.h);
                this.ctx.lineWidth = Math.max(3, p.w * 0.03);
                this.ctx.strokeStyle = '#FF3B5C';
                this.ctx.strokeRect(p.x, p.y, p.w, p.h);

                this.ctx.fillStyle = '#FF3B5C';
                this.ctx.beginPath();
                this.ctx.arc(p.x + p.w - 18, p.y + 18, 12, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x + p.w - 22, p.y + 14);
                this.ctx.lineTo(p.x + p.w - 14, p.y + 22);
                this.ctx.moveTo(p.x + p.w - 14, p.y + 14);
                this.ctx.lineTo(p.x + p.w - 22, p.y + 22);
                this.ctx.stroke();
            }
        });
    },

    handleCanvasClick(e) {
        if (!Store.isCollageSelectMode || !Store.collageImages.length) return;
        const rect = this.canvas.getBoundingClientRect();

        const canvasRatio = this.canvas.width / this.canvas.height;
        const elemRatio = rect.width / rect.height;
        let drawW, drawH, offsetX, offsetY;

        if (elemRatio > canvasRatio) {
            drawH = rect.height;
            drawW = rect.height * canvasRatio;
            offsetX = (rect.width - drawW) / 2;
            offsetY = 0;
        } else {
            drawW = rect.width;
            drawH = rect.width / canvasRatio;
            offsetX = 0;
            offsetY = (rect.height - drawH) / 2;
        }

        const clickX = ((e.clientX - rect.left) - offsetX) * (this.canvas.width / drawW);
        const clickY = ((e.clientY - rect.top) - offsetY) * (this.canvas.height / drawH);

        for (let i = 0; i < Store.collagePositions.length; i++) {
            const p = Store.collagePositions[i];
            if (clickX >= p.x && clickX <= p.x + p.w && clickY >= p.y && clickY <= p.y + p.h) {
                if (Store.selectedCollageIndices.has(i)) Store.selectedCollageIndices.delete(i);
                else Store.selectedCollageIndices.add(i);
                break;
            }
        }

        this.selectCountBadge.textContent = `تم تحديد ${toEnDigits(Store.selectedCollageIndices.size)} صور`;
        this.render();
    },

    toggleSelectMode(enable) {
        Store.isCollageSelectMode = enable;
        Store.selectedCollageIndices.clear();
        this.selectModeBtn.style.display = enable ? 'none' : 'flex';
        this.selectActions.style.display = enable ? 'flex' : 'none';
        this.canvas.classList.toggle('selecting', enable);
        this.selectCountBadge.textContent = `تم تحديد ${toEnDigits(0)} صور`;
        this.render();
    },

    deleteSelected() {
        if (!Store.selectedCollageIndices.size) {
            this.toggleSelectMode(false);
            return;
        }
        Store.collageImages = Store.collageImages.filter((_, idx) => !Store.selectedCollageIndices.has(idx));
        this.toggleSelectMode(false);
        this.updateUI();
        this.render();
    },

    clearAll() {
        Store.collageImages = [];
        if (this.fileInput) this.fileInput.value = '';
        this.toggleSelectMode(false);
        this.updateUI();
        this.render();
    },

    exportPNG() {
        if (!Store.collageImages.length) return;
        this.render();
        const link = document.createElement('a');
        link.download = 'collage.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    },

    exportPDF() {
        if (!Store.collageImages.length || !window.jspdf) return;
        this.render();
        const { jsPDF } = window.jspdf;
        const orient = this.canvas.width > this.canvas.height ? 'l' : 'p';
        const pdf = new jsPDF(orient, 'px', [this.canvas.width, this.canvas.height]);
        pdf.addImage(this.canvas.toDataURL('image/png'), 'PNG', 0, 0, this.canvas.width, this.canvas.height);
        pdf.save('collage.pdf');
    }
};
