/**
 * Media & Sprite Studio - Floating Color Palette Module
 */
export const ColorPalette = {
  bar: document.getElementById('floatingColorBar'),
  scrollArea: document.getElementById('floatingColorScrollArea'),
  closeBtn: document.getElementById('closeFloatingColorBarBtn'),
  noneBtn: document.getElementById('colorPickerNoneBtn'),
  customBtn: document.getElementById('colorPickerCustomTriggerBtn'),

  activeTargetInputId: null,
  activeTriggerCircleBtn: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // التقاط النقر على جميع دوائر اختيار الألوان في التطبيق
    document.querySelectorAll('.custom-color-circle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open(btn);
      });
    });

    // إغلاق الشريط عند النقر خارجه
    document.addEventListener('click', (e) => {
      if (this.bar && !this.bar.contains(e.target) && !e.target.closest('.custom-color-circle-btn')) {
        this.close();
      }
    });

    this.closeBtn?.addEventListener('click', () => this.close());

    // اختيار لون شفاف / بدون لون
    this.noneBtn?.addEventListener('click', () => {
      this.applyColor('transparent');
    });

    // اختيار لون مخصص عبر نافذة الألوان الأصلية
    this.customBtn?.addEventListener('click', () => {
      if (!this.activeTargetInputId) return;
      const nativeInput = document.getElementById(this.activeTargetInputId);
      if (nativeInput) nativeInput.click();
    });

    // الاستماع لاختيار الألوان الجاهزة داخل الشريط
    this.scrollArea?.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch-circle');
      if (swatch && swatch.dataset.color) {
        this.applyColor(swatch.dataset.color);
      }
    });

    // تمرير شريط الألوان أفوقياً بسكرول الفأرة
    this.scrollArea?.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollArea.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  },

  open(triggerBtn) {
    this.activeTriggerCircleBtn = triggerBtn;
    this.activeTargetInputId = triggerBtn.dataset.target;
    this.bar.style.display = 'flex';

    // تمييز اللون النشط حالياً
    const currentColor = triggerBtn.style.backgroundColor;
    document.querySelectorAll('.color-swatch-circle').forEach(sw => sw.classList.remove('active'));
    
    // سحب العرض الأفقي بسلاسة
    if (this.scrollArea) this.scrollArea.scrollLeft = 0;
  },

  close() {
    if (this.bar) this.bar.style.display = 'none';
    this.activeTargetInputId = null;
    this.activeTriggerCircleBtn = null;
  },

  applyColor(color) {
    if (!this.activeTargetInputId) return;
    const targetInput = document.getElementById(this.activeTargetInputId);
    
    if (targetInput) {
      targetInput.value = color === 'transparent' ? '#000000' : color;
      targetInput.dataset.transparent = (color === 'transparent') ? 'true' : 'false';
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (this.activeTriggerCircleBtn) {
      if (color === 'transparent') {
        this.activeTriggerCircleBtn.style.backgroundColor = 'transparent';
        this.activeTriggerCircleBtn.style.backgroundImage = 'repeating-conic-gradient(#CCCCCC 0% 25%, #FFFFFF 0% 50%)';
        this.activeTriggerCircleBtn.style.backgroundSize = '8px 8px';
      } else {
        this.activeTriggerCircleBtn.style.backgroundImage = 'none';
        this.activeTriggerCircleBtn.style.backgroundColor = color;
      }
    }

    this.close();
  }
};
