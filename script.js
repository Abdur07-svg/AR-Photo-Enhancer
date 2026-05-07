let originalImage = null;
        let enhancedImageData = null;
        let selectedMode = 'auto';
        let isEnhancing = false;

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
        const previewModal = document.getElementById('previewModal');
        const previewModalImg = document.getElementById('previewModalImg');

        // Drag & Drop
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

        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) processFile(file);
        }

        function processFile(file) {
            if (!file.type.startsWith('image/')) {
                showToast('❌ Upload only image files!');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                originalImage = e.target.result;
                originalImg.src = originalImage;
                enhancedImg.src = originalImage;
                enhancedImg.classList.remove('preview-ready');

                uploadArea.style.display = 'none';
                enhanceOptions.classList.add('active');
                previewArea.classList.add('active');
                saveBtn.style.display = 'none';
                enhanceBtn.style.display = 'inline-flex';
                enhancingOverlay.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }

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
                enhanceBtn.style.display = 'inline-flex';
                hideImagePreview();
            }
        }

        function enhancePhoto() {
            if (isEnhancing) return;
            isEnhancing = true;

            enhancingOverlay.classList.remove('hidden');
            enhanceBtn.disabled = true;
            enhanceBtn.style.opacity = '0.5';

            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15 + 5;
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
                    isEnhancing = false;
                    showToast('✨ Image enhanced successfully!');
                }, 500);
            }, 2500);
        }

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
                        return; // sharpen handles its own output
                    case 'bw':
                        blackAndWhite(data);
                        break;
                }

                ctx.putImageData(imageData, 0, 0);
                enhancedImageData = canvas.toDataURL('image/jpeg', 0.95);
                enhancedImg.src = enhancedImageData;
                enhancedImg.classList.add('preview-ready');
            };
            img.src = originalImage;
        }

        function autoEnhance(data) {
            // Auto levels + slight contrast + saturation boost
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

                // Slight brightness
                data[i] = Math.min(255, data[i] * 1.1);
                data[i+1] = Math.min(255, data[i+1] * 1.1);
                data[i+2] = Math.min(255, data[i+2] * 1.1);

                // Saturation boost
                const avg = (data[i] + data[i+1] + data[i+2]) / 3;
                const sat = 1.2;
                data[i] = avg + (data[i] - avg) * sat;
                data[i+1] = avg + (data[i+1] - avg) * sat;
                data[i+2] = avg + (data[i+2] - avg) * sat;

                // Clamp
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
                // Slight contrast for B&W pro look
                const adjusted = ((gray - 128) * 1.2) + 128;
                data[i] = data[i+1] = data[i+2] = Math.max(0, Math.min(255, adjusted));
            }
        }

        function sharpen(ctx, canvas) {
            // Simple unsharp mask
            const w = canvas.width, h = canvas.height;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);

            const src = ctx.getImageData(0, 0, w, h);
            const dst = ctx.createImageData(w, h);
            const s = src.data, d = dst.data;

            // Gaussian blur approximation then subtract
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
            enhancedImageData = canvas.toDataURL('image/jpeg', 0.95);
            enhancedImg.src = enhancedImageData;
            enhancedImg.classList.add('preview-ready');
        }

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

        function saveToGallery() {
            if (!enhancedImageData) return;

            const link = document.createElement('a');
            link.download = 'enhanced-photo-' + Date.now() + '.jpg';
            link.href = enhancedImageData;
            link.click();

            showToast('📥 Image saved to Gallery!');
        }

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
            enhanceBtn.style.display = 'inline-flex';
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toastMsg');
            toastMsg.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
