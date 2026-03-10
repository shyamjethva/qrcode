const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// In-memory store (temporary DB)
const urlMappings = new Map();

/**
 * API: Create or Update mapping
 * POST /api/upsert
 */
app.post('/api/upsert', (req, res) => {
    const { slug, url } = req.body;

    if (!slug || !url) {
        return res.status(400).json({ error: 'Slug and URL are required' });
    }

    urlMappings.set(slug, url);
    console.log(`Mapping updated: ${slug} -> ${url}`);

    // detect domain automatically
    const domain = req.protocol + '://' + req.get('host');

    res.json({
        success: true,
        slug,
        url,
        shortLink: `${domain}/s/${slug}`
    });
});

/**
 * Redirect
 * GET /s/:slug
 */
app.get('/s/:slug', (req, res) => {
    const { slug } = req.params;
    const targetUrl = urlMappings.get(slug);

    if (targetUrl) {
        console.log(`Redirecting ${slug} to ${targetUrl}`);
        // Ensure URL has protocol
        let redirectUrl = targetUrl;
        if (!/^https?:\/\//i.test(redirectUrl)) {
            redirectUrl = 'https://' + redirectUrl;
        }
        return res.redirect(redirectUrl);
    }

    res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>Link not found</h1>
            <p>The requested QR code destination does not exist.</p>
            <a href="/">Create a new one</a>
        </div>
    `);
});

// For SPA routing - if someone goes to a route that's not /api or /s, send index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`QR Backend running at http://localhost:${PORT}`);
});