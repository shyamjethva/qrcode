const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// Serve frontend files
app.use(express.static(__dirname));

// In-memory database
const urlMappings = new Map();

/**
 * API: Upsert Link Mapping
 */
app.post('/api/upsert', (req, res) => {
    const { slug, url } = req.body;

    if (!slug || !url) {
        return res.status(400).json({ error: 'Slug and URL are required' });
    }

    urlMappings.set(slug, url);
    console.log(`[API] Saved: ${slug} -> ${url}`);

    // Detect domain for short link
    const domain = req.protocol + '://' + req.get('host');

    res.json({
        success: true,
        slug,
        url,
        shortLink: `${domain}/s/${slug}`
    });
});

/**
 * Redirect Handler
 */
app.get('/s/:slug', (req, res) => {
    const { slug } = req.params;
    const targetUrl = urlMappings.get(slug);

    if (targetUrl) {
        let redirectUrl = targetUrl;
        if (!/^https?:\/\//i.test(redirectUrl)) {
            redirectUrl = 'https://' + redirectUrl;
        }
        console.log(`[Redirect] ${slug} -> ${redirectUrl}`);
        return res.redirect(redirectUrl);
    }

    res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>404 - Link Not Found</h1>
            <p>The requested QR code destination does not exist or has expired.</p>
            <a href="/" style="color: #4F46E5; text-decoration: none; font-weight: bold;">Create New QR Code</a>
        </div>
    `);
});

// Single Page App routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/upsert`);
});