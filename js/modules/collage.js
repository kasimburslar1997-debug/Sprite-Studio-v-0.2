/**
 * Media & Sprite Studio - Collage Studio Module
 * Fixed: Aspect Ratio Math, Center-Crop Cover Engine & Dynamic Grid
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';

export const Collage = {
  fileInput: document.getElementById('imgUpload'),
  dropZone: document.getElementById('dropZone'),
  importBtn: document.getElementById('collageImportActionBtn'),
  clearBtn: document.getElementById('clearBtn'),
  exportPNGBtn: document.getElementById('exportPNGBtn'),
  exportPDFBtn: document.getElementById('exportPDFBtn'),
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
  strokeColor: document.getElementById('strokeColor'),
  bgColorInput: document.getElementById('collageBgColor'),

  selectModeBtn: document.getElementById('collageSelectModeBtn'),
  selectActions: document.getElementById('collageSelectActions'),
  deleteSelectedBtn: document.getElementById('collageDeleteSelectedBtn'),
  cancelSelectBtn: document.getElementById('collageCancelSelectBtn'),
  selectCountBadge: document.getElementById('collageSelectCountBadge'),

  init() {
    this.bindEvents();
    this.initDefaultRatioUI();
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
    if (this.counterNum) this.counterNum.textContent = toEnDigits(0);
    if (this.gapVal) this.gapVal.textContent = `${toEnDigits(this.gapInput?.value || 12)}px`;
    if (this.strokeVal) this.strokeVal.textContent = `${toEnDigits(this.strokeInput?.value || 0)}px`;
  },

  bindEvents() {
    this.importBtn?.addEventListener('click', () => this.fileInput?.click());
    this.dropZone?.addEventListener('click', (e) => {
      if (Store.isCollageSelectMode || e.target === this.canvas) return;
      this.fileInput?.click();
    });

    this.fileInput?.addEventListener('change', (e) => this.loadFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(n => {
      this.dropZone?.addEventListener(n, (e) => {
        e.preventDefault();
        this.dropZone.style.borderColor = 'var(--accent-red)';
      });
    });
    ['dragleave', 'drop'].forEach(n => {
      this.dropZone?.addEventListener(n, (e) => {
        e.preventDefault();
        this.dropZone.style.borderColor = 'transparent';
      });
    });
    this.dropZone?.addEventListener('drop', (e) => {
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

    // فتح وإغلاق قائمة النسب
    this.ratioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = this.ratioPopup.style.display === 'none' || !this.ratioPopup.style.display;
      this.ratioPopup.style.display = isHidden ? 'flex' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (this.ratioPopup && !this.ratioPopup.contains(e.target) && e.target !== this.ratioBtn && !this.ratioBtn.contains(e.target)) {
        this.ratioPopup.style.display = 'none';
      }
    });

    // تبديل وتطبيق النسبة
    document.querySelectorAll('.ratio-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ratio-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const ratio = btn.dataset.ratio;
        Store.collageRatio = ratio;

        if (ratio === 'auto') {
          Store.collageRatioW = null;
          Store.collageRatioH = null;
          Store.collageRatioLabel = 'حر/أصلي';
          if (this.ratioLabel) this.ratioLabel.textContent = 'حر/أصلي';
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
        this.render(); // إعادة الرسم الفوري بالنسبة الجديدة
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

    this.strokeColor?.addEventListener('input', (e) => {
      Store.collageStrokeColor = e.target.value;
      const circle = document.getElementById('strokeColorCircleBtn');
      if (circle) circle.style.backgroundColor = e.target.value;
      this.render();
    });

    this.bgColorInput?.addEventListener('input', (e) => {
      Store.collageBgColor = e.target.dataset.transparent === 'true' ? 'transparent' : e.target.value;
      const circle = document.getElementById('collageBgColorCircleBtn');
      if (circle) circle.style.backgroundColor = e.target.value;
      this.render();
    });

    this.canvas?.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.selectModeBtn?.addEventListener('click', () => this.toggleSelectMode(true));
    this.cancelSelectBtn?.addEventListener('click', () => this.toggleSelectMode(false));
    this.deleteSelectedBtn?.addEventListener('click', () => this.deleteSelected());
    this.clearBtn?.addEventListener('click', () => this.clearAll());

    this.exportPNGBtn?.addEventListener('click', () => this.exportPNG());
    this.exportPDFBtn?.addEventListener('click', () => this.exportPDF());
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

  // المحرك الهندسي المصحح بالكامل
  render() {
    if (!Store.collageImages.length) {
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const totalImages = Store.collageImages.length;
    const imgSize = parseInt(toEnDigits(this.sizeNum?.value)) || 128;
    const requestedCols = Math.max(1, parseInt(toEnDigits(this.colsNum?.value)) || 1);
    
    // تصحيح الأعمدة: إذا كانت الصور أقل من الأعمدة، لا ننشئ فراغات فارغة
    const columns = Math.min(requestedCols, totalImages);
    
    const gap = parseInt(toEnDigits(this.gapInput?.value)) || 0;
    const strokeWidth = parseInt(toEnDigits(this.strokeInput?.value)) || 0;
    const strokeColor = this.strokeColor?.value || Store.collageStrokeColor || '#FF3B5C';
    const bgColor = this.bgColorInput?.dataset.transparent === 'true' ? 'transparent' : (this.bgColorInput?.value || Store.collageBgColor || '#FFFFFF');

    const isFixedRatio = Store.collageRatio !== 'auto' && Store.collageRatioW && Store.collageRatioH;
    let positions = [];
    let totalWidth = 0;
    let totalHeight = 0;

    // هامش نصف الإطار لمنع اقتطاعه من حدود الكانفاس
    const strokePad = Math.ceil(strokeWidth / 2);

    if (isFixedRatio) {
      // 1. حساب النسبة المستهدفة W : H
      const targetAspect = Store.collageRatioW / Store.collageRatioH;
      const cellW = imgSize;
      const cellH = Math.round(cellW / targetAspect); // الارتفاع يتحدد بالمليمتر حسب النسبة
      
      const totalCols = columns;
      const totalRows = Math.ceil(totalImages / totalCols);

      totalWidth = strokePad * 2 + totalCols * cellW + (totalCols - 1) * gap;
      totalHeight = strokePad * 2 + totalRows * cellH + (totalRows - 1) * gap;

      positions = Store.collageImages.map((item, i) => {
        const col = i % totalCols;
        const row = Math.floor(i / totalCols);

        const cellX = strokePad + col * (cellW + gap);
        const cellY = strokePad + row * (cellH + gap);

        const imgW = item.img.naturalWidth || item.img.width || cellW;
        const imgH = item.img.naturalHeight || item.img.height || cellH;
        const imgAspect = imgW / imgH;

        // خوارزمية القص والتوسيط الذكي (Object-Fit: Cover)
        // هذا هو السر الذي يجعل كل صورة تأخذ النسبة المطلوبة فوراً
        let sX = 0, sY = 0, sW = imgW, sH = imgH;
        if (imgAspect > targetAspect) {
          // الصورة أعرض من المطلوب -> يتم قص الجانبين بالتساوي
          sW = imgH * targetAspect;
          sX = (imgW - sW) / 2;
        } else {
          // الصورة أطول من المطلوب -> يتم قص الأعلى والأسفل بالتساوي
          sH = imgW / targetAspect;
          sY = (imgH - sH) / 2;
        }

        return {
          x: cellX, y: cellY, w: cellW, h: cellH,
          sX, sY, sW, sH,
          drawX: cellX, drawY: cellY, drawW: cellW, drawH: cellH
        };
      });
    } else {
      // النمط الحر (Auto): الحفاظ على الارتفاع الأصلي لكل صورة
      const cellWidth = imgSize;
      const cellHeights = Store.collageImages.map(o => {
        const nw = o.img.naturalWidth || o.img.width || cellWidth;
        const nh = o.img.naturalHeight || o.img.height || cellWidth;
        return Math.round((cellWidth / nw) * nh);
      });

      const colYs = Array(columns).fill(strokePad);
      positions = Array(totalImages);

      for (let i = 0; i < totalImages; i++) {
        const col = i % columns;
        const x = strokePad + col * (cellWidth + gap);
        const y = colYs[col];
        const h = cellHeights[i];
        
        positions[i] = {
          x, y, w: cellWidth, h,
          sX: 0, sY: 0,
          sW: Store.collageImages[i].img.naturalWidth || cellWidth,
          sH: Store.collageImages[i].img.naturalHeight || h,
          drawX: x, drawY: y, drawW: cellWidth, drawH: h
        };
        colYs[col] += h + gap;
      }

      totalHeight = Math.max(...colYs) - gap + strokePad;
      totalWidth = strokePad * 2 + columns * cellWidth + (columns - 1) * gap;
    }

    Store.collagePositions = positions;

    this.canvas.width = Math.max(10, Math.round(totalWidth));
    this.canvas.height = Math.max(10, Math.round(totalHeight));

    // رسم الخلفية (لون صافٍ أو شفافة تماماً)
    if (bgColor === 'transparent') {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // رسم الصور بالإسقاط الهندسي الصحيح
    Store.collageImages.forEach((item, index) => {
      const pos = positions[index];
      
      if (isFixedRatio) {
        // رسم الجزء المقصوص بدقة ليطابق النسبة (1:1، 16:9، إلخ)
        this.ctx.drawImage(
          item.img,
          pos.sX, pos.sY, pos.sW, pos.sH,
          pos.drawX, pos.drawY, pos.drawW, pos.drawH
        );
      } else {
        this.ctx.drawImage(item.img, pos.drawX, pos.drawY, pos.drawW, pos.drawH);
      }

      // رسم الحد الخارجي للخلية
      if (strokeWidth > 0) {
        this.ctx.lineWidth = strokeWidth;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
      }

      // رسم طبقة التحديد عند تفعيل وضع التحديد
      if (Store.isCollageSelectMode && Store.selectedCollageIndices.has(index)) {
        this.ctx.fillStyle = 'rgba(255, 59, 92, 0.4)';
        this.ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        this.ctx.lineWidth = Math.max(3, pos.w * 0.03);
        this.ctx.strokeStyle = '#FF3B5C';
        this.ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);

        this.ctx.fillStyle = '#FF3B5C';
        this.ctx.beginPath();
        this.ctx.arc(pos.x + pos.w - 18, pos.y + 18, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x + pos.w - 22, pos.y + 14);
        this.ctx.lineTo(pos.x + pos.w - 14, pos.y + 22);
        this.ctx.moveTo(pos.x + pos.w - 14, pos.y + 14);
        this.ctx.lineTo(pos.x + pos.w - 22, pos.y + 22);
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

    this.selectCountBadge.textContent = `تم تحديد ${toEnDigits(Store.selectedCollageIndices.size)}`;
    this.render();
  },

  toggleSelectMode(enable) {
    Store.isCollageSelectMode = enable;
    Store.selectedCollageIndices.clear();
    this.selectModeBtn.style.display = enable ? 'none' : 'flex';
    this.selectActions.style.display = enable ? 'flex' : 'none';
    this.canvas.classList.toggle('selecting', enable);
    this.selectCountBadge.textContent = `تم تحديد ${toEnDigits(0)}`;
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
