/**
 * QRGen Pro - Dynamic QR Code Logic
 * Connects to the backend for static QR with dynamic redirects.
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

    // Backend API URL (Relative to domain)
    const BACKEND_API = '/api/upsert';

    // QR Code Image API
    const QR_SERVICE = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=';

    const handleGenerate = async () => {
        const slug = qrSlug.value.trim() || Math.random().toString(36).substring(7);
        const targetUrl = qrUrlInput.value.trim();

        if (!targetUrl) {
            alert('Please enter a destination URL.');
            qrUrlInput.focus();
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerText = 'Syncing...';

        try {
            const response = await fetch(BACKEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, url: targetUrl })
            });

            // Log response for debugging
            if (!response.ok) {
                const text = await response.text();
                console.error('Server responded with:', text);
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (data.success) {
                const shortLink = data.shortLink;
                const qrImgUrl = `${QR_SERVICE}${encodeURIComponent(shortLink)}`;

                qrImage.src = qrImgUrl;
                displayShortLink.innerText = shortLink;
                qrResult.classList.remove('hidden');

                qrSlug.value = slug;

                console.log('Static QR generated for:', shortLink);
                console.log('Redirects to:', targetUrl);
            } else {
                throw new Error(data.error || 'Sync failed');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Backend connection failed. Please ensure the server is running on port 5003.');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = 'Save & Generate QR';
        }
    };

    const downloadQR = async () => {
        const imageUrl = qrImage.src;
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr-${qrSlug.value || 'download'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Download failed. You can right-click the QR and save image.');
        }
    };

    const reset = () => {
        qrSlug.value = '';
        qrUrlInput.value = '';
        qrResult.classList.add('hidden');
    };

    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadQR);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    if (qrUrlInput) {
        qrUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleGenerate();
        });
    }
});