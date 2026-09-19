/**
 * Media & Sprite Studio - Shared Utilities & Progress Controller
 */

// تحويل الأرقام لأرقام إنجليزية نقية
export function toEnDigits(val) {
    return String(val).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// عناصر التحكم بشريط التقدم
const progressContainer = document.getElementById('progressContainer');
const progressTitle = document.getElementById('progressTitle');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

export function showProgress(title) {
    if (!progressContainer) return;
    progressTitle.textContent = title;
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    progressContainer.style.display = 'flex';
}

export function updateProgress(percent) {
    if (!progressBar) return;
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    progressBar.style.width = `${p}%`;
    progressText.textContent = `${toEnDigits(p)}%`;
}

export function hideProgress() {
    if (!progressContainer) return;
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 350);
}