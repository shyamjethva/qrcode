/**
 * QRGen Pro - Dynamic QR Code Client
 */

document.addEventListener('DOMContentLoaded', () => {
    const qrSlug = document.getElementById('qr-slug');
    const qrUrlInput = document.getElementById('qr-url');
    const generateBtn = document.getElementById('generate-btn');
    const qrResult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qr-image');
    const displayShortLink = document.getElementById('display-short-link');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    // API Endpoint (Relative to current domain)
    const BACKEND_API = '/api/upsert';

    // QR Code Generation Service
    const QR_SERVICE_API = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=';

    /**
     * Handle Link Generation
     */
    const handleGenerate = async () => {
        const slug = qrSlug.value.trim() || Math.random().toString(36).substring(7);
        const targetUrl = qrUrlInput.value.trim();

        if (!targetUrl) {
            alert('Please enter a destination URL.');
            qrUrlInput.focus();
            return;
        }

        // UI Loading State
        generateBtn.disabled = true;
        const originalBtnText = generateBtn.innerText;
        generateBtn.innerText = 'Syncing with Server...';

        try {
            // 1. Sync data with the backend
            const response = await fetch(BACKEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, url: targetUrl })
            });

            if (!response.ok) {
                const errorHtml = await response.text();
                console.error('Server error response:', errorHtml);
                throw new Error('API server returned 404 or Error. Check your proxy settings.');
            }

            const data = await response.json();

            if (data.success) {
                // 2. Display results
                const shortLink = data.shortLink;
                const qrImgUrl = `${QR_SERVICE_API}${encodeURIComponent(shortLink)}`;

                qrImage.src = qrImgUrl;
                displayShortLink.innerText = shortLink;
                qrResult.classList.remove('hidden');

                qrSlug.value = slug;

                console.log('Static Link:', shortLink);
                console.log('Updating to:', targetUrl);
            } else {
                throw new Error(data.error || 'Server rejected the request.');
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            alert(`Backend Connection Error!\n\nPlease ensure node server.js is running on port 5003 and your domain/proxy is configured correctly.`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = originalBtnText;
        }
    };

    /**
     * Download Image Logic
     */
    const downloadQR = async () => {
        const imageUrl = qrImage.src;
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr-${qrSlug.value || 'code'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Direct download blocked by browser. Please right-click the QR image and select "Save Image As".');
        }
    };

    /**
     * Reset Form
     */
    const reset = () => {
        if (confirm('Create a new QR code? This will clear current fields.')) {
            qrSlug.value = '';
            qrUrlInput.value = '';
            qrResult.classList.add('hidden');
            qrSlug.focus();
        }
    };

    // Event Bindings
    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadQR);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    if (qrUrlInput) {
        qrUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleGenerate();
        });
    }
});