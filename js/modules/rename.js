/**
 * Media & Sprite Studio - Rename Studio Module (Dark Mode Native)
 */
import { Store } from '../state.js';
import { toEnDigits, showProgress, updateProgress, hideProgress } from '../utils.js';

export const RenameStudio = {
  uploadInput: document.getElementById('renameUpload'),
  dropZone: document.getElementById('renameDropZone'),
  importBtn: document.getElementById('renameImportActionBtn'),
  clearBottomBtn: document.getElementById('renameClearBtn'),
  clearTopBtn: document.getElementById('renameClearTopBtn'),
  emptyNotice: document.getElementById('renameEmptyNotice'),
  gridContainer: document.getElementById('renameGridContainer'),
  grid: document.getElementById('renameGrid'),

  selectAllBtn: document.getElementById('renameSelectAllBtn'),
  deselectAllBtn: document.getElementById('renameDeselectAllBtn'),
  selectCountBadge: document.getElementById('renameSelectCountBadge'),
  totalCountBadge: document.getElementById('renameTotalCountBadge'),

  baseNameInput: document.getElementById('renameBaseInput'),

  digitsNum: document.getElementById('renameDigitsNum'),
  digitsIncBtn: document.getElementById('renameDigitsIncBtn'),
  digitsDecBtn: document.getElementById('renameDigitsDecBtn'),

  startNum: document.getElementById('renameStartNum'),
  startIncBtn: document.getElementById('renameStartIncBtn'),
  startDecBtn: document.getElementById('renameStartDecBtn'),

  endNum: document.getElementById('renameEndNum'),
  endIncBtn: document.getElementById('renameEndIncBtn'),
  endDecBtn: document.getElementById('renameEndDecBtn'),

  // الأزرار في الشريط العلوي للهيدر
  applyBtn: document.getElementById('renameApplyBtn'),
  exportZipBtn: document.getElementById('renameExportZipBtn'),

  longPressTimer: null,
  isDragSelecting: false,
  dragSelectAction: true,
  dragStartIndex: null,

  init() {
    this.bindEvents();
    this.updateControlsUI();
  },

  bindEvents() {
    this.importBtn?.addEventListener('click', () => this.uploadInput?.click());
    this.dropZone?.addEventListener('click', (e) => {
      if (e.target === this.dropZone || e.target.closest('#renameEmptyNotice')) {
        this.uploadInput?.click();
      }
    });

    this.uploadInput?.addEventListener('change', (e) => this.loadFiles(e.target.files));

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
      e.preventDefault();
      if (e.dataTransfer.files) this.loadFiles(e.dataTransfer.files);
    });

    this.baseNameInput?.addEventListener('input', (e) => {
      Store.renameBaseName = e.target.value.trim();
    });

    this.digitsIncBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.digitsNum.value)) || 1;
      this.digitsNum.value = toEnDigits(Math.min(10, current + 1));
      Store.renameDigits = parseInt(toEnDigits(this.digitsNum.value));
    });

    this.digitsDecBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.digitsNum.value)) || 1;
      this.digitsNum.value = toEnDigits(Math.max(1, current - 1));
      Store.renameDigits = parseInt(toEnDigits(this.digitsNum.value));
    });

    this.digitsNum?.addEventListener('input', () => {
      this.digitsNum.value = toEnDigits(this.digitsNum.value);
      Store.renameDigits = Math.max(1, parseInt(toEnDigits(this.digitsNum.value)) || 1);
    });

    this.startIncBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.startNum.value)) || 0;
      this.startNum.value = toEnDigits(current + 1);
      Store.renameStart = parseInt(toEnDigits(this.startNum.value));
      this.syncEndRange();
    });

    this.startDecBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.startNum.value)) || 0;
      this.startNum.value = toEnDigits(Math.max(0, current - 1));
      Store.renameStart = parseInt(toEnDigits(this.startNum.value));
      this.syncEndRange();
    });

    this.startNum?.addEventListener('input', () => {
      this.startNum.value = toEnDigits(this.startNum.value);
      Store.renameStart = parseInt(toEnDigits(this.startNum.value)) || 0;
      this.syncEndRange();
    });

    this.endIncBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.endNum.value)) || 0;
      this.endNum.value = toEnDigits(current + 1);
      Store.renameEnd = parseInt(toEnDigits(this.endNum.value));
    });

    this.endDecBtn?.addEventListener('click', () => {
      let current = parseInt(toEnDigits(this.endNum.value)) || 0;
      this.endNum.value = toEnDigits(Math.max(Store.renameStart, current - 1));
      Store.renameEnd = parseInt(toEnDigits(this.endNum.value));
    });

    this.endNum?.addEventListener('input', () => {
      this.endNum.value = toEnDigits(this.endNum.value);
      Store.renameEnd = Math.max(Store.renameStart, parseInt(toEnDigits(this.endNum.value)) || Store.renameStart);
    });

    this.selectAllBtn?.addEventListener('click', () => this.selectAll());
    this.deselectAllBtn?.addEventListener('click', () => this.deselectAll());
    
    // زر المسح المزدوج (في الهيدر الداخلي والشريط السفلي)
    this.clearTopBtn?.addEventListener('click', () => this.clearAll());
    this.clearBottomBtn?.addEventListener('click', () => this.clearAll());

    this.applyBtn?.addEventListener('click', () => this.applyRename());
    this.exportZipBtn?.addEventListener('click', () => this.exportZIP());

    window.addEventListener('pointerup', () => this.endDragSelection());
    window.addEventListener('pointercancel', () => this.endDragSelection());
    this.grid?.addEventListener('pointermove', (e) => this.handleDragOverCards(e));
  },

  updateControlsUI() {
    if (this.digitsNum) this.digitsNum.value = toEnDigits(Store.renameDigits);
    if (this.startNum) this.startNum.value = toEnDigits(Store.renameStart);
    if (this.endNum) this.endNum.value = toEnDigits(Store.renameEnd);
    if (this.baseNameInput) this.baseNameInput.value = Store.renameBaseName;
  },

  syncEndRange() {
    const total = Store.selectedRenameIndices.size > 0 
      ? Store.selectedRenameIndices.size 
      : Store.renameImages.length;

    if (total > 0) {
      Store.renameEnd = Store.renameStart + total - 1;
      if (this.endNum) this.endNum.value = toEnDigits(Store.renameEnd);
    }
  },

  async loadFiles(files) {
    if (!files || !files.length) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return;

    showProgress('جاري استيراد الصور...');
    const loaded = [];

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const dataUrl = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });

      const img = await new Promise(res => {
        const image = new Image();
        image.onload = () => res(image);
        image.src = dataUrl;
      });

      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf('.');
      const ext = dotIndex !== -1 ? originalName.substring(dotIndex + 1) : 'png';
      const cleanName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;

      loaded.push({
        id: `img_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        originalName,
        cleanName,
        newName: cleanName,
        img,
        dataUrl,
        ext
      });

      updateProgress(((i + 1) / valid.length) * 100);
    }

    Store.renameImages.push(...loaded);
    if (this.uploadInput) this.uploadInput.value = '';

    this.syncEndRange();
    this.updateUI();
    this.renderGrid();
    hideProgress();
  },

  updateUI() {
    const hasImages = Store.renameImages.length > 0;
    if (this.emptyNotice) this.emptyNotice.style.display = hasImages ? 'none' : 'flex';
    if (this.gridContainer) this.gridContainer.style.display = hasImages ? 'flex' : 'none';
    if (this.totalCountBadge) this.totalCountBadge.textContent = `إجمالي الصور: ${toEnDigits(Store.renameImages.length)}`;

    [this.applyBtn, this.exportZipBtn, this.clearBottomBtn, this.clearTopBtn].forEach(btn => {
      if (btn) btn.disabled = !hasImages;
    });

    this.updateSelectCountBadge();
  },

  updateSelectCountBadge() {
    const count = Store.selectedRenameIndices.size;
    if (this.selectCountBadge) {
      this.selectCountBadge.textContent = `تم تحديد: ${toEnDigits(count)}`;
    }
    if (this.deselectAllBtn) {
      this.deselectAllBtn.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    this.syncEndRange();
  },

  renderGrid() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    Store.renameImages.forEach((item, index) => {
      const isSelected = Store.selectedRenameIndices.has(index);

      const card = document.createElement('div');
      card.className = `rename-grid-card ${isSelected ? 'selected' : ''}`;
      card.dataset.index = index;

      const checkBadge = document.createElement('div');
      checkBadge.className = 'rename-checkbox-badge';
      checkBadge.innerHTML = `<span class="material-symbols-rounded">${isSelected ? 'check_circle' : 'radio_button_unchecked'}</span>`;

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'rename-card-thumb';

      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.loading = 'lazy';
      imgWrapper.appendChild(img);

      const nameTag = document.createElement('div');
      nameTag.className = 'rename-card-name';
      nameTag.title = `${item.newName}.${item.ext}`;
      nameTag.textContent = `${item.newName}.${item.ext}`;

      card.appendChild(checkBadge);
      card.appendChild(imgWrapper);
      card.appendChild(nameTag);

      this.attachCardEvents(card, index);
      this.grid.appendChild(card);
    });
  },

  attachCardEvents(card, index) {
    card.addEventListener('pointerdown', (e) => {
      this.clearLongPress();
      this.dragStartIndex = index;

      this.longPressTimer = setTimeout(() => {
        Store.isRenameSelectMode = true;
        this.isDragSelecting = true;
        this.dragSelectAction = !Store.selectedRenameIndices.has(index);
        this.toggleItemSelection(index, this.dragSelectAction);
        
        if (navigator.vibrate) navigator.vibrate(35);
      }, 350);
    });

    card.addEventListener('pointerup', () => this.clearLongPress());
    card.addEventListener('pointerleave', () => this.clearLongPress());

    card.addEventListener('click', (e) => {
      if (Store.isRenameSelectMode) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleItemSelection(index);
      }
    });
  },

  clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  },

  handleDragOverCards(e) {
    if (!this.isDragSelecting) return;
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    const card = elem?.closest('.rename-grid-card');
    if (!card) return;

    const idx = parseInt(card.dataset.index);
    if (!isNaN(idx)) {
      this.toggleItemSelection(idx, this.dragSelectAction);
    }
  },

  endDragSelection() {
    this.clearLongPress();
    this.isDragSelecting = false;
  },

  toggleItemSelection(index, forceState = null) {
    const shouldSelect = forceState !== null ? forceState : !Store.selectedRenameIndices.has(index);
    if (shouldSelect) {
      Store.selectedRenameIndices.add(index);
    } else {
      Store.selectedRenameIndices.delete(index);
    }

    Store.isRenameSelectMode = Store.selectedRenameIndices.size > 0;

    const card = this.grid.querySelector(`.rename-grid-card[data-index="${index}"]`);
    if (card) {
      card.classList.toggle('selected', shouldSelect);
      const icon = card.querySelector('.rename-checkbox-badge .material-symbols-rounded');
      if (icon) {
        icon.textContent = shouldSelect ? 'check_circle' : 'radio_button_unchecked';
      }
    }

    this.updateSelectCountBadge();
  },

  selectAll() {
    if (!Store.renameImages.length) return;
    Store.isRenameSelectMode = true;
    Store.selectedRenameIndices.clear();
    for (let i = 0; i < Store.renameImages.length; i++) {
      Store.selectedRenameIndices.add(i);
    }
    this.renderGrid();
    this.updateSelectCountBadge();
  },

  deselectAll() {
    Store.isRenameSelectMode = false;
    Store.selectedRenameIndices.clear();
    this.renderGrid();
    this.updateSelectCountBadge();
  },

  clearAll() {
    Store.renameImages = [];
    Store.selectedRenameIndices.clear();
    Store.isRenameSelectMode = false;
    if (this.uploadInput) this.uploadInput.value = '';
    this.updateUI();
    this.renderGrid();
  },

  applyRename() {
    if (!Store.renameImages.length) return;

    const rawBase = this.baseNameInput ? this.baseNameInput.value.trim() : '';
    const digits = Math.max(1, parseInt(toEnDigits(this.digitsNum?.value)) || 2);
    const start = Math.max(0, parseInt(toEnDigits(this.startNum?.value)) || 1);

    const hasSelection = Store.selectedRenameIndices.size > 0;
    const targetIndices = hasSelection 
      ? Array.from(Store.selectedRenameIndices).sort((a, b) => a - b)
      : Store.renameImages.map((_, i) => i);

    showProgress('جاري تطبيق الأسماء الجديدة...');

    targetIndices.forEach((targetIdx, order) => {
      const currentNumber = start + order;
      const formattedNum = String(currentNumber).padStart(digits, '0');

      const newFileName = rawBase !== '' ? `${rawBase}_${formattedNum}` : formattedNum;
      Store.renameImages[targetIdx].newName = newFileName;
    });

    Store.renameEnd = start + targetIndices.length - 1;
    if (this.endNum) this.endNum.value = toEnDigits(Store.renameEnd);

    this.renderGrid();
    hideProgress();
  },

  async exportZIP() {
    if (!Store.renameImages.length || !window.JSZip) return;

    showProgress('جاري تجهيز وضغط الصور...');
    const zip = new JSZip();
    const folder = zip.folder('renamed_images');
    const total = Store.renameImages.length;

    for (let i = 0; i < total; i++) {
      const item = Store.renameImages[i];
      
      const offCanvas = document.createElement('canvas');
      offCanvas.width = item.img.naturalWidth || item.img.width;
      offCanvas.height = item.img.naturalHeight || item.img.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(item.img, 0, 0);

      const pngData = offCanvas.toDataURL('image/png').split(',')[1];
      folder.file(`${item.newName}.png`, pngData, { base64: true });

      updateProgress(((i + 1) / total) * 70);
    }

    showProgress('جاري ضغط الحزمة النهائية...');
    const content = await zip.generateAsync({ type: 'blob' }, (meta) => {
      updateProgress(70 + (meta.percent * 0.3));
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'renamed_images_png.zip';
    link.click();
    URL.revokeObjectURL(link.href);

    hideProgress();
  }
};
