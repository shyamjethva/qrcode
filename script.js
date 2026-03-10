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

    // Backend API URL (Ensure server.js is running on this port)
    const BACKEND_API = 'http://localhost:3000/api/upsert';

    // QR Code Image API (using public service)
    const QR_SERVICE = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=';

    /**
     * Generate or Update Dynamic Link
     */
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
            // 1. Save/Update mapping on the backend
            const response = await fetch(BACKEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, url: targetUrl })
            });

            const data = await response.json();

            if (data.success) {
                // 2. Generate QR for the SHORT LINK (which is static)
                const shortLink = data.shortLink;
                const qrImgUrl = `${QR_SERVICE}${encodeURIComponent(shortLink)}`;

                qrImage.src = qrImgUrl;
                displayShortLink.innerText = shortLink;
                qrResult.classList.remove('hidden');

                // If the user didn't provide a slug, show the auto-generated one
                qrSlug.value = slug;

                console.log('Static QR generated for:', shortLink);
                console.log('Redirects to:', targetUrl);
            } else {
                throw new Error(data.error || 'Sync failed');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Backend Not Found! \n\nTo use dynamic QR codes, you must run the backend server first:\n1. Open your terminal in this folder\n2. Run "npm install"\n3. Run "node server.js"');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = 'Save & Generate QR';
        }
    };

    /**
     * Download QR
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
            a.download = `qr-${qrSlug.value}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Download failed. You can right-click the QR and save image.');
        }
    };

    /**
     * Reset
     */
    const reset = () => {
        qrSlug.value = '';
        qrUrlInput.value = '';
        qrResult.classList.add('hidden');
    };

    // Events
    generateBtn.addEventListener('click', handleGenerate);
    downloadBtn.addEventListener('click', downloadQR);
    resetBtn.addEventListener('click', reset);

    // Enter key support
    qrUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGenerate();
    });
});
