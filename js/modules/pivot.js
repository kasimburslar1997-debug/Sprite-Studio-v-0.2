/**
 * Media & Sprite Studio - Pivot Editor Modal Module
 */
import { Store } from '../state.js';
import { toEnDigits } from '../utils.js';
import { Sprite } from './sprite.js';

export const Pivot = {
    modal: document.getElementById('pivotEditorModal'),
    canvas: document.getElementById('pivotCanvas'),
    ctx: document.getElementById('pivotCanvas')?.getContext('2d'),
    grid: document.getElementById('pivotFramesGrid'),
    xInput: document.getElementById('pivotXInput'),
    yInput: document.getElementById('pivotYInput'),
    onionBtn: document.getElementById('toggleOnionSkinBtn'),
    presetsBtn: document.getElementById('openPivotPresetsBtn'),
    presetsPopup: document.getElementById('pivotPresetsPopup'),
    saveBtn: document.getElementById('savePivotBtn'),
    cancelBtn: document.getElementById('cancelPivotBtn'),

    init() {
        this.bindEvents();
    },

    bindEvents() {
        Sprite.openPivotBtn?.addEventListener('click', () => this.open());
        this.canvas?.addEventListener('pointerdown', (e) => {
            Store.isDraggingPivot = true;
            this.handlePointer(e);
        });
        window.addEventListener('pointermove', (e) => {
            if (Store.isDraggingPivot) this.handlePointer(e);
        });
        window.addEventListener('pointerup', () => {
            Store.isDraggingPivot = false;
        });

        this.xInput?.addEventListener('input', (e) => {
            const v = Math.max(0, Math.min(1, parseFloat(toEnDigits(e.target.value)) || 0));
            Store.framePivots[Store.activePivotFrameIdx].x = v;
            this.render();
        });

        this.yInput?.addEventListener('input', (e) => {
            const v = Math.max(0, Math.min(1, parseFloat(toEnDigits(e.target.value)) || 0));
            Store.framePivots[Store.activePivotFrameIdx].y = v;
            this.render();
        });

        this.onionBtn?.addEventListener('click', () => {
            Store.onionSkinActive = !Store.onionSkinActive;
            this.onionBtn.classList.toggle('active-onion', Store.onionSkinActive);
            this.render();
        });

        this.presetsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = this.presetsPopup.style.display === 'none';
            this.presetsPopup.style.display = isHidden ? 'flex' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (this.presetsPopup && !this.presetsPopup.contains(e.target) && e.target !== this.presetsBtn) {
                this.presetsPopup.style.display = 'none';
            }
        });

        document.querySelectorAll('.preset-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const dx = parseFloat(dot.dataset.x);
                const dy = parseFloat(dot.dataset.y);
                Store.framePivots[Store.activePivotFrameIdx] = { x: dx, y: dy };
                this.updateInputsUI();
                this.render();
                this.presetsPopup.style.display = 'none';
            });
        });

        this.saveBtn?.addEventListener('click', () => {
            this.modal.classList.remove('active');
            Store.backupPivots = [];
        });

        this.cancelBtn?.addEventListener('click', () => {
            if (Store.backupPivots.length) {
                Store.framePivots = Store.backupPivots.map(p => ({ ...p }));
            }
            this.modal.classList.remove('active');
        });
    },

    open() {
        if (!Store.slicedFrames.length) return;
        if (Store.isPlaying) Sprite.stopAnimation();

        Store.backupPivots = Store.framePivots.map(p => ({ ...p }));
        Store.activePivotFrameIdx = 0;

        this.modal.classList.add('active');
        this.buildGrid();
        this.render();
        this.updateInputsUI();
    },

    buildGrid() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        Store.slicedFrames.forEach((fCanvas, idx) => {
            const card = document.createElement('div');
            card.className = `pivot-frame-thumb-card ${idx === Store.activePivotFrameIdx ? 'active-thumb' : ''}`;

            const img = document.createElement('img');
            img.src = fCanvas.toDataURL();

            const num = document.createElement('span');
            num.className = 'thumb-number';
            num.textContent = toEnDigits(idx + 1);

            card.appendChild(img);
            card.appendChild(num);

            card.addEventListener('click', () => {
                Store.activePivotFrameIdx = idx;
                document.querySelectorAll('.pivot-frame-thumb-card').forEach(c => c.classList.remove('active-thumb'));
                card.classList.add('active-thumb');
                this.updateInputsUI();
                this.render();
            });

            this.grid.appendChild(card);
        });
    },

    updateInputsUI() {
        const p = Store.framePivots[Store.activePivotFrameIdx] || { x: 0.5, y: 0.5 };
        if (this.xInput) this.xInput.value = toEnDigits(p.x.toFixed(2));
        if (this.yInput) this.yInput.value = toEnDigits(p.y.toFixed(2));

        document.querySelectorAll('.preset-dot').forEach(dot => {
            const dx = parseFloat(dot.dataset.x);
            const dy = parseFloat(dot.dataset.y);
            dot.classList.toggle('active', Math.abs(dx - p.x) < 0.05 && Math.abs(dy - p.y) < 0.05);
        });
    },

    drawTinted(targetCtx, srcCanvas, color, alpha) {
        const off = document.createElement('canvas');
        off.width = srcCanvas.width;
        off.height = srcCanvas.height;
        const oCtx = off.getContext('2d');
        oCtx.drawImage(srcCanvas, 0, 0);
        oCtx.globalCompositeOperation = 'source-in';
        oCtx.fillStyle = color;
        oCtx.fillRect(0, 0, off.width, off.height);

        targetCtx.save();
        targetCtx.globalAlpha = alpha;
        targetCtx.drawImage(off, 0, 0);
        targetCtx.restore();
    },

    render() {
        if (!Store.slicedFrames.length) return;
        const current = Store.slicedFrames[Store.activePivotFrameIdx];
        this.canvas.width = current.width;
        this.canvas.height = current.height;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;

        if (Store.onionSkinActive && Store.slicedFrames.length > 1) {
            const prev = (Store.activePivotFrameIdx - 1 + Store.slicedFrames.length) % Store.slicedFrames.length;
            this.drawTinted(this.ctx, Store.slicedFrames[prev], '#FF4D6D', 0.45);
            const next = (Store.activePivotFrameIdx + 1) % Store.slicedFrames.length;
            this.drawTinted(this.ctx, Store.slicedFrames[next], '#38B6FF', 0.45);
        }

        this.ctx.drawImage(current, 0, 0);
        const p = Store.framePivots[Store.activePivotFrameIdx] || { x: 0.5, y: 0.5 };
        this.drawCrosshair(p.x * this.canvas.width, p.y * this.canvas.height);
    },

    drawCrosshair(px, py) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const fade = Math.max(w, h) * 0.7;

        this.ctx.save();
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([4, 4]);

        const line = (x1, y1, x2, y2, grad) => {
            this.ctx.strokeStyle = grad;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        };

        const gL = this.ctx.createLinearGradient(px, py, px - fade, py);
        gL.addColorStop(0, '#FF3B5C'); gL.addColorStop(1, 'rgba(255, 59, 92, 0)');
        line(px, py, 0, py, gL);

        const gR = this.ctx.createLinearGradient(px, py, px + fade, py);
        gR.addColorStop(0, '#FF3B5C'); gR.addColorStop(1, 'rgba(255, 59, 92, 0)');
        line(px, py, w, py, gR);

        const gT = this.ctx.createLinearGradient(px, py, px, py - fade);
        gT.addColorStop(0, '#FF3B5C'); gT.addColorStop(1, 'rgba(255, 59, 92, 0)');
        line(px, py, px, 0, gT);

        const gB = this.ctx.createLinearGradient(px, py, px, py + fade);
        gB.addColorStop(0, '#FF3B5C'); gB.addColorStop(1, 'rgba(255, 59, 92, 0)');
        line(px, py, px, h, gB);

        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.arc(px, py, 11, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FF3B5C';
        this.ctx.lineWidth = 3.5;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(px, py, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF3B5C';
        this.ctx.fill();
        this.ctx.restore();
    },

    handlePointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;

        const x = (cx - rect.left) * scaleX;
        const y = (cy - rect.top) * scaleY;

        Store.framePivots[Store.activePivotFrameIdx] = {
            x: Math.max(0, Math.min(1, x / this.canvas.width)),
            y: Math.max(0, Math.min(1, y / this.canvas.height))
        };

        this.updateInputsUI();
        this.render();
    }
};
