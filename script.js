let originalImage = null;
let enhancedImageData = null;
let selectedMode = 'auto';
let isEnhancing = false;
let compareMode = false;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const enhanceOptions = document.getElementById('enhanceOptions');
const originalImg = document.getElementById('originalImg');
const enhancedImg = document.getElementById('enhancedImg');
const enhancingOverlay = document.getElementById('enhancingOverlay');
const progressFill = document.getElementById('progressFill');
const enhanceBtn = document.getElementById('enhanceBtn');
const saveBtn = document.getElementById('saveBtn');
const compareBtn = document.getElementById('compareBtn');
const previewModal = document.getElementById('previewModal');
const previewModalImg = document.getElementById('previewModalImg');
const compareSlider = document.getElementById('compareSlider');
const compareBefore = document.getElementById('compareBefore');
const compareAfter = document.getElementById('compareAfter');
const compareOverlay = document.getElementById('compareOverlay');
const compareHandle = document.getElementById('compareHandle');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingProgressFill = document.getElementById('loadingProgressFill');

// ===================== DRAG & DROP =====================
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
});

enhancedImg.addEventListener('click', openImagePreview);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideImagePreview();
    }
});

// ===================== FILE HANDLING =====================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('❌ Upload only image files!');
        return;
    }

    showLoading();

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Resize large images for performance
            const maxDim = 2048;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                else { w = Math.round(w * maxDim / h); h = maxDim; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            originalImage = canvas.toDataURL('image/jpeg', 0.92);
            originalImg.src = originalImage;
            enhancedImg.src = originalImage;
            enhancedImg.classList.remove('preview-ready');

            uploadArea.style.display = 'none';
            enhanceOptions.classList.add('active');
            previewArea.classList.add('active');
            saveBtn.style.display = 'none';
            compareBtn.style.display = 'none';
            enhanceBtn.style.display = 'inline-flex';
            enhancingOverlay.classList.add('hidden');
            compareSlider.classList.remove('active');
            hideLoading();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===================== LOADING OVERLAY =====================
function showLoading() {
    loadingOverlay.classList.add('show');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20 + 10;
        if (progress > 95) progress = 95;
        loadingProgressFill.style.width = progress + '%';
    }, 200);
    loadingOverlay.dataset.interval = interval;
}

function hideLoading() {
    loadingProgressFill.style.width = '100%';
    clearInterval(parseInt(loadingOverlay.dataset.interval || 0));
    setTimeout(() => {
        loadingOverlay.classList.remove('show');
        loadingProgressFill.style.width = '0%';
    }, 400);
}

// ===================== MODE SELECTION =====================
function selectMode(card) {
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedMode = card.dataset.mode;

    if (enhancedImageData) {
        enhancedImageData = null;
        enhancedImg.src = originalImage;
        enhancedImg.classList.remove('preview-ready');
        progressFill.style.width = '0%';
        saveBtn.style.display = 'none';
        compareBtn.style.display = 'none';
        enhanceBtn.style.display = 'inline-flex';
        compareSlider.classList.remove('active');
        hideImagePreview();
    }
}

// ===================== ENHANCE PHOTO =====================
function enhancePhoto() {
    if (isEnhancing) return;
    isEnhancing = true;

    enhancingOverlay.classList.remove('hidden');
    enhanceBtn.disabled = true;
    enhanceBtn.style.opacity = '0.5';

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 12 + 4;
        if (progress > 90) progress = 90;
        progressFill.style.width = progress + '%';
    }, 300);

    setTimeout(() => {
        clearInterval(interval);
        progressFill.style.width = '100%';

        setTimeout(() => {
            applyEnhancement();
            enhancingOverlay.classList.add('hidden');
            enhanceBtn.disabled = false;
            enhanceBtn.style.opacity = '1';
            enhanceBtn.style.display = 'none';
            saveBtn.style.display = 'inline-flex';
            compareBtn.style.display = 'inline-flex';
            isEnhancing = false;
            showToast('✨ Image enhanced successfully!');
        }, 500);
    }, 2500);
}

// ===================== APPLY ENHANCEMENT =====================
function applyEnhancement() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        switch(selectedMode) {
            case 'auto':
                autoEnhance(data);
                break;
            case 'brightness':
                adjustBrightness(data, 40);
                break;
            case 'contrast':
                adjustContrast(data, 50);
                break;
            case 'vibrant':
                makeVibrant(data);
                break;
            case 'sharp':
                sharpen(ctx, canvas);
                return;
            case 'bw':
                blackAndWhite(data);
                break;
            case 'hd':
                hdBoost(data);
                break;
            case 'insta':
                instagramLook(data);
                break;
            case 'dark':
                darkModeEnhance(data);
                break;
        }

        ctx.putImageData(imageData, 0, 0);
        enhancedImageData = canvas.toDataURL('image/jpeg', 0.98);
        enhancedImg.src = enhancedImageData;
        enhancedImg.classList.add('preview-ready');

        // Set compare slider images
        compareBefore.src = originalImage;
        compareAfter.src = enhancedImageData;
    };
    img.src = originalImage;
}

// ===================== ENHANCEMENT ALGORITHMS =====================
function autoEnhance(data) {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;

    for (let i = 0; i < data.length; i += 4) {
        minR = Math.min(minR, data[i]); maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i+1]); maxG = Math.max(maxG, data[i+1]);
        minB = Math.min(minB, data[i+2]); maxB = Math.max(maxB, data[i+2]);
    }

    const rangeR = maxR - minR || 1;
    const rangeG = maxG - minG || 1;
    const rangeB = maxB - minB || 1;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = ((data[i] - minR) / rangeR) * 255;
        data[i+1] = ((data[i+1] - minG) / rangeG) * 255;
        data[i+2] = ((data[i+2] - minB) / rangeB) * 255;

        data[i] = Math.min(255, data[i] * 1.1);
        data[i+1] = Math.min(255, data[i+1] * 1.1);
        data[i+2] = Math.min(255, data[i+2] * 1.1);

        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        const sat = 1.2;
        data[i] = avg + (data[i] - avg) * sat;
        data[i+1] = avg + (data[i+1] - avg) * sat;
        data[i+2] = avg + (data[i+2] - avg) * sat;

        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]));
    }
}

function adjustBrightness(data, amount) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + amount);
        data[i+1] = Math.min(255, data[i+1] + amount);
        data[i+2] = Math.min(255, data[i+2] + amount);
    }
}

function adjustContrast(data, amount) {
    const factor = (259 * (amount + 255)) / (255 * (259 - amount));
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i+1] = Math.min(255, Math.max(0, factor * (data[i+1] - 128) + 128));
        data[i+2] = Math.min(255, Math.max(0, factor * (data[i+2] - 128) + 128));
    }
}

function makeVibrant(data) {
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        const sat = 1.5;
        data[i] = avg + (data[i] - avg) * sat;
        data[i+1] = avg + (data[i+1] - avg) * sat;
        data[i+2] = avg + (data[i+2] - avg) * sat;
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]));
    }
}

function blackAndWhite(data) {
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
        const adjusted = ((gray - 128) * 1.2) + 128;
        data[i] = data[i+1] = data[i+2] = Math.max(0, Math.min(255, adjusted));
    }
}

function sharpen(ctx, canvas) {
    const w = canvas.width, h = canvas.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const src = ctx.getImageData(0, 0, w, h);
    const dst = ctx.createImageData(w, h);
    const s = src.data, d = dst.data;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
                const blurred = (
                    s[i - w*4 + c] + s[i - 4 + c] + s[i + 4 + c] + s[i + w*4 + c]
                ) / 4;
                d[i + c] = Math.min(255, Math.max(0, s[i + c] + (s[i + c] - blurred) * 1.5));
            }
            d[i + 3] = 255;
        }
    }

    ctx.putImageData(dst, 0, 0);
    enhancedImageData = canvas.toDataURL('image/jpeg', 0.98);
    enhancedImg.src = enhancedImageData;
    enhancedImg.classList.add('preview-ready');
    compareBefore.src = originalImage;
    compareAfter.src = enhancedImageData;
}

// ===================== NEW PRESETS =====================
function hdBoost(data) {
    // Auto levels + strong contrast + saturation + clarity
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (let i = 0; i < data.length; i += 4) {
        minR = Math.min(minR, data[i]); maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i+1]); maxG = Math.max(maxG, data[i+1]);
        minB = Math.min(minB, data[i+2]); maxB = Math.max(maxB, data[i+2]);
    }
    const rangeR = maxR - minR || 1;
    const rangeG = maxG - minG || 1;
    const rangeB = maxB - minB || 1;

    for (let i = 0; i < data.length; i += 4) {
        // Auto levels
        data[i] = ((data[i] - minR) / rangeR) * 255;
        data[i+1] = ((data[i+1] - minG) / rangeG) * 255;
        data[i+2] = ((data[i+2] - minB) / rangeB) * 255;

        // Strong contrast
        const contrastFactor = (259 * (60 + 255)) / (255 * (259 - 60));
        data[i] = contrastFactor * (data[i] - 128) + 128;
        data[i+1] = contrastFactor * (data[i+1] - 128) + 128;
        data[i+2] = contrastFactor * (data[i+2] - 128) + 128;

        // Boost saturation
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        const sat = 1.4;
        data[i] = avg + (data[i] - avg) * sat;
        data[i+1] = avg + (data[i+1] - avg) * sat;
        data[i+2] = avg + (data[i+2] - avg) * sat;

        // Slight brightness
        data[i] += 15;
        data[i+1] += 15;
        data[i+2] += 15;

        // Clamp
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]));
    }
}

function instagramLook(data) {
    // Warm tones + fade + lifted blacks + slight saturation
    for (let i = 0; i < data.length; i += 4) {
        // Lift blacks
        data[i] = data[i] * 0.95 + 15;
        data[i+1] = data[i+1] * 0.95 + 15;
        data[i+2] = data[i+2] * 0.95 + 15;

        // Warm tone (more orange)
        data[i] = data[i] * 1.08 + 8;
        data[i+1] = data[i+1] * 1.02 + 2;
        data[i+2] = data[i+2] * 0.95 - 5;

        // Saturation boost
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        const sat = 1.25;
        data[i] = avg + (data[i] - avg) * sat;
        data[i+1] = avg + (data[i+1] - avg) * sat;
        data[i+2] = avg + (data[i+2] - avg) * sat;

        // Slight contrast
        data[i] = (data[i] - 128) * 1.1 + 128;
        data[i+1] = (data[i+1] - 128) * 1.1 + 128;
        data[i+2] = (data[i+2] - 128) * 1.1 + 128;

        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]));
    }
}

function darkModeEnhance(data) {
    // Deep blacks + cool shadows + cinematic contrast
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const luminance = r * 0.299 + g * 0.587 + b * 0.114;

        // Deepen shadows
        if (luminance < 100) {
            data[i] *= 0.7;
            data[i+1] *= 0.75;
            data[i+2] *= 0.85;
        }

        // Boost highlights
        if (luminance > 180) {
            data[i] = Math.min(255, data[i] * 1.15);
            data[i+1] = Math.min(255, data[i+1] * 1.12);
            data[i+2] = Math.min(255, data[i+2] * 1.08);
        }

        // Cool tone
        data[i] *= 0.95;
        data[i+1] *= 0.98;
        data[i+2] *= 1.08;

        // Strong contrast
        data[i] = (data[i] - 128) * 1.3 + 128;
        data[i+1] = (data[i+1] - 128) * 1.3 + 128;
        data[i+2] = (data[i+2] - 128) * 1.3 + 128;

        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]));
    }
}

// ===================== BEFORE/AFTER COMPARE SLIDER =====================
function toggleCompare() {
    compareMode = !compareMode;
    const imageContainer = document.querySelector('.image-container');

    if (compareMode) {
        imageContainer.style.display = 'none';
        compareSlider.classList.add('active');
        compareBtn.innerHTML = '<i class="fas fa-eye"></i> View Side by Side';
        initCompareSlider();
    } else {
        imageContainer.style.display = 'flex';
        compareSlider.classList.remove('active');
        compareBtn.innerHTML = '<i class="fas fa-columns"></i> Compare';
    }
}

function initCompareSlider() {
    let isDragging = false;

    const updateSlider = (x) => {
        const rect = compareSlider.getBoundingClientRect();
        let percent = ((x - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        compareOverlay.style.width = percent + '%';
        compareHandle.style.left = percent + '%';
    };

    compareHandle.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
        if (isDragging) updateSlider(e.clientX);
    });

    // Touch support
    compareHandle.addEventListener('touchstart', () => isDragging = true);
    document.addEventListener('touchend', () => isDragging = false);
    document.addEventListener('touchmove', (e) => {
        if (isDragging) updateSlider(e.touches[0].clientX);
    });

    // Click on slider to jump
    compareSlider.addEventListener('click', (e) => {
        if (e.target !== compareHandle) updateSlider(e.clientX);
    });

    // Reset to center
    compareOverlay.style.width = '50%';
    compareHandle.style.left = '50%';
}

// ===================== IMAGE PREVIEW MODAL =====================
function openImagePreview() {
    if (!enhancedImageData || isEnhancing) return;
    previewModalImg.src = enhancedImageData;
    previewModal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeImagePreview(e) {
    if (e && e.target !== previewModal && !e.target.closest('.preview-close')) return;
    hideImagePreview();
}

function hideImagePreview() {
    previewModal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

// ===================== SAVE TO GALLERY (HIGH QUALITY) =====================
function saveToGallery() {
    if (!enhancedImageData) return;

    const link = document.createElement('a');
    link.download = 'enhanced-photo-' + Date.now() + '.jpg';
    link.href = enhancedImageData;
    link.click();

    showToast('📥 Image saved in high quality!');
}

// ===================== RESET =====================
function resetApp() {
    uploadArea.style.display = 'block';
    enhanceOptions.classList.remove('active');
    previewArea.classList.remove('active');
    fileInput.value = '';
    originalImage = null;
    enhancedImageData = null;
    enhancedImg.classList.remove('preview-ready');
    hideImagePreview();
    progressFill.style.width = '0%';
    saveBtn.style.display = 'none';
    compareBtn.style.display = 'none';
    enhanceBtn.style.display = 'inline-flex';
    compareSlider.classList.remove('active');
    compareMode = false;
    document.querySelector('.image-container').style.display = 'flex';

    // Reset selected mode
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    document.querySelector('.option-card[data-mode="auto"]').classList.add('selected');
    selectedMode = 'auto';
}

// ===================== TOAST =====================
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}