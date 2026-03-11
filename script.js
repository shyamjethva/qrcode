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
    const editBtn = document.getElementById('edit-btn');
    const qrHistoryContainer = document.getElementById('qr-history');
    const qrModalOverlay = document.getElementById('qr-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalDestUrl = document.getElementById('modal-dest-url');
    const modalSuccessMsg = document.getElementById('modal-success-msg');
    const editBtnText = document.getElementById('edit-btn-text');
    const editIcon = document.getElementById('edit-icon');
    const saveIcon = document.getElementById('save-icon');

    // API Endpoint (Relative to current domain)
    const BACKEND_API = '/api/upsert';

    // QR Code Generation Service
    const QR_SERVICE_API = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=';

    // Load History from LocalStorage
    let qrHistory = JSON.parse(localStorage.getItem('qr_history') || '[]');

    /**
     * Render History UI
     */
    const renderHistory = () => {
        if (!qrHistoryContainer) return;

        if (qrHistory.length === 0) {
            qrHistoryContainer.innerHTML = '<div class="history-empty">No previous QR codes yet</div>';
            return;
        }

        qrHistoryContainer.innerHTML = qrHistory.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <img src="${QR_SERVICE_API}${encodeURIComponent(item.shortLink)}" alt="QR" class="history-qr">
                <span class="history-name">${item.slug}</span>
                <span class="history-url">${item.url}</span>
                <button class="btn btn-secondary btn-sm history-download-btn" data-shortlink="${item.shortLink}" data-slug="${item.slug}">
                    Download
                </button>
            </div>
        `).join('');

        // Add Click Events to History Items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-download-btn')) {
                    e.stopPropagation();
                    const btn = e.target.closest('.history-download-btn');
                    downloadSpecificQR(btn.getAttribute('data-shortlink'), btn.getAttribute('data-slug'));
                    return;
                }
                const index = item.getAttribute('data-index');
                const data = qrHistory[index];
                showResult(data.shortLink, data.slug, data.url);
            });
        });
    };

    /**
     * Show QR Result in UI
     */
    const showResult = (shortLink, slug, url) => {
        const qrImgUrl = `${QR_SERVICE_API}${encodeURIComponent(shortLink)}`;
        qrImage.src = qrImgUrl;
        displayShortLink.innerText = shortLink;
        displayShortLink.href = shortLink;
        qrSlug.value = slug;
        if (url) {
            qrUrlInput.value = url;
            modalDestUrl.value = url;
            modalDestUrl.dataset.slug = slug;
        }

        modalDestUrl.disabled = true;
        modalDestUrl.style.backgroundColor = '#f8fafc';
        editBtnText.innerText = 'Edit';
        editIcon.style.display = 'inline-block';
        saveIcon.style.display = 'none';
        modalSuccessMsg.style.display = 'none';

        qrModalOverlay.classList.remove('hidden');
    };

    /**
     * Save to History
     */
    const saveToHistory = (slug, url, shortLink) => {
        // Remove duplicate slugs if they exist
        qrHistory = qrHistory.filter(item => item.slug !== slug);

        // Add to beginning
        qrHistory.unshift({ slug, url, shortLink });

        // Keep only last 50
        if (qrHistory.length > 50) qrHistory.pop();

        localStorage.setItem('qr_history', JSON.stringify(qrHistory));
        renderHistory();
    };

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
        generateBtn.innerText = 'Syncing...';

        try {
            const response = await fetch(BACKEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, url: targetUrl })
            });

            if (!response.ok) throw new Error('API server error');

            const data = await response.json();

            if (data.success) {
                showResult(data.shortLink, data.slug, data.url);
                saveToHistory(data.slug, data.url, data.shortLink);
            } else {
                throw new Error(data.error || 'Server rejected the request.');
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            alert(`Backend Connection Error! Check if server is running.`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = originalBtnText;
        }
    };

    /**
     * Download Specific QR 
     */
    const downloadSpecificQR = async (shortLink, slug) => {
        const imageUrl = `${QR_SERVICE_API}${encodeURIComponent(shortLink)}`;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr-${slug || 'code'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Direct download blocked. Use "Save Image As".');
        }
    };

    /**
     * Reset Form / Close Modal
     */
    const closeAndResetModal = () => {
        qrModalOverlay.classList.add('hidden');
        qrSlug.value = '';
        qrUrlInput.value = '';
        qrSlug.disabled = false;
    };

    // Initial Render
    renderHistory();

    // Event Bindings
    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);
    if (editBtn) editBtn.addEventListener('click', async () => {
        const isEditing = !modalDestUrl.disabled;

        if (!isEditing) {
            // Switch to edit mode
            modalDestUrl.disabled = false;
            modalDestUrl.style.backgroundColor = '#fff';
            modalDestUrl.focus();

            editBtnText.innerText = 'Save';
            editIcon.style.display = 'none';
            saveIcon.style.display = 'inline-block';
            modalSuccessMsg.style.display = 'none';
        } else {
            // Save mode
            const slug = modalDestUrl.dataset.slug;
            const newUrl = modalDestUrl.value.trim();

            if (!newUrl) {
                alert('Please enter a destination URL.');
                modalDestUrl.focus();
                return;
            }

            editBtn.disabled = true;
            editBtnText.innerText = 'Saving...';

            try {
                const response = await fetch(BACKEND_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, url: newUrl })
                });

                if (!response.ok) throw new Error('API server error');

                const data = await response.json();

                if (data.success) {
                    modalDestUrl.disabled = true;
                    modalDestUrl.style.backgroundColor = '#f8fafc';
                    editBtnText.innerText = 'Edit';
                    editIcon.style.display = 'inline-block';
                    saveIcon.style.display = 'none';

                    modalSuccessMsg.style.display = 'block';
                    setTimeout(() => {
                        modalSuccessMsg.style.display = 'none';
                    }, 3000);

                    qrUrlInput.value = data.url;
                    saveToHistory(data.slug, data.url, data.shortLink);
                } else {
                    throw new Error(data.error || 'Server rejected the request.');
                }
            } catch (error) {
                console.error('Fetch Error:', error);
                alert('Error saving! Check if server is running.');
                editBtnText.innerText = 'Save';
            } finally {
                editBtn.disabled = false;
            }
        }
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAndResetModal);
    if (qrModalOverlay) {
        qrModalOverlay.addEventListener('click', (e) => {
            if (e.target === qrModalOverlay) {
                closeAndResetModal();
            }
        });
    }

    if (qrUrlInput) {
        qrUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleGenerate();
        });
    }
});
