/**
 * Media & Sprite Studio - Floating Color Palette Module
 */
import { Store } from '../state.js';

export const PalettePicker = {
    container: document.getElementById('floatingColorPalette'),
    scrollArea: document.getElementById('paletteScrollArea'),
    noneBtn: document.getElementById('paletteNoneBtn'),
    customBtn: document.getElementById('paletteCustomBtn'),
    hiddenColorInput: document.getElementById('paletteHiddenColorInput'),

    daylightGroup: document.getElementById('daylightColorsGroup'),
    darklightGroup: document.getElementById('darklightColorsGroup'),
    grayscaleGroup: document.getElementById('grayscaleColorsGroup'),

    currentTarget: null,
    updateCallback: null,

    // 10 ألوان منتقاة للثيم النهاري
    daylightColors: [
        '#FFFFFF', '#FFF0F3', '#FFE8D6', '#FFF9DB', '#E8F5E9',
        '#E1F5FE', '#EDE7F6', '#FFF3E0', '#F0F4C3', '#E0F2F1'
    ],

    // 10 ألوان منتقاة للثيم الليلي
    darklightColors: [
        '#141619', '#1F2227', '#0F172A', '#1E1B4B', '#31101E',
        '#064E3B', '#1C1917', '#27272A', '#3F3F46', '#FF3B5C'
    ],

    // 10 تدرجات رمادية
    grayscaleColors: [
        '#FFFFFF', '#E6E6E6', '#CCCCCC', '#B3B3B3', '#999999',
        '#808080', '#666666', '#4D4D4D', '#262626', '#000000'
    ],

    init() {
        this.buildSwatches();
        this.bindEvents();
        this.enableHorizontalScroll();
    },

    buildSwatches() {
        const createSwatch = (color, group) => {
            const btn = document.createElement('button');
            btn.className = 'palette-swatch';
            btn.style.backgroundColor = color;
            btn.dataset.color = color;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectColor(color);
            });
            group.appendChild(btn);
        };

        this.daylightColors.forEach(c => createSwatch(c, this.daylightGroup));
        this.darklightColors.forEach(c => createSwatch(c, this.darklightGroup));
        this.grayscaleColors.forEach(c => createSwatch(c, this.grayscaleGroup));
    },

    bindEvents() {
        // خيار بدون لون
        this.noneBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectColor('transparent');
        });

        // خيار لون مخصص
        this.customBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hiddenColorInput?.click();
        });

        this.hiddenColorInput?.addEventListener('input', (e) => {
            this.selectColor(e.target.value);
        });

        // إغلاق الشريط عند النقر في أي مكان خارجي
        document.addEventListener('click', (e) => {
            if (this.container && this.container.style.display !== 'none') {
                if (!this.container.contains(e.target) && !e.target.closest('.trigger-palette')) {
                    this.close();
                }
            }
        });
    },

    // تمكين التمرير بعجلة الفأرة والسحب باللمس بسلاسة
    enableHorizontalScroll() {
        if (!this.scrollArea) return;

        this.scrollArea.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                this.scrollArea.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        let isDown = false;
        let startX, scrollLeft;

        this.scrollArea.addEventListener('pointerdown', (e) => {
            isDown = true;
            startX = e.pageX - this.scrollArea.offsetLeft;
            scrollLeft = this.scrollArea.scrollLeft;
            this.scrollArea.setPointerCapture(e.pointerId);
        });

        this.scrollArea.addEventListener('pointermove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - this.scrollArea.offsetLeft;
            const walk = (x - startX) * 1.5;
            this.scrollArea.scrollLeft = scrollLeft - walk;
        });

        const stopDrag = () => { isDown = false; };
        this.scrollArea.addEventListener('pointerup', stopDrag);
        this.scrollArea.addEventListener('pointercancel', stopDrag);
    },

    open(targetName, previewElement, onColorChosen) {
        this.currentTarget = targetName;
        this.updateCallback = onColorChosen;
        this.container.style.display = 'flex';

        // تمييز اللون المختار حالياً إن وجد
        const currentColor = this.getCurrentTargetColor(targetName);
        this.highlightActive(currentColor);
    },

    close() {
        if (this.container) this.container.style.display = 'none';
    },

    getCurrentTargetColor(target) {
        if (target === 'collageStroke') return Store.collageStrokeColor || '#FF3B5C';
        if (target === 'collageBg') return Store.collageBgColor || '#FFFFFF';
        if (target === 'spriteBg') return Store.spriteBgColor || '#FFFFFF';
        return '#FFFFFF';
    },

    highlightActive(color) {
        document.querySelectorAll('.palette-swatch').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color?.toUpperCase() === color?.toUpperCase());
        });
    },

    selectColor(color) {
        if (this.updateCallback) {
            this.updateCallback(color);
        }
        this.highlightActive(color);
    }
};