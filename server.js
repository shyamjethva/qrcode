const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory store for mappings (Slug -> Target URL)
// In a real app, this would be a database.
const urlMappings = new Map();

/**
 * API: Create or Update a mapping
 * POST /api/upsert
 */
app.post('/api/upsert', (req, res) => {
    const { slug, url } = req.body;

    if (!slug || !url) {
        return res.status(400).json({ error: 'Slug and URL are required' });
    }

    urlMappings.set(slug, url);
    console.log(`Mapping updated: ${slug} -> ${url}`);

    res.json({
        success: true,
        slug,
        url,
        shortLink: `http://localhost:${PORT}/s/${slug}`
    });
});

/**
 * Redirect: Slug -> Target URL
 * GET /s/:slug
 */
app.get('/s/:slug', (req, res) => {
    const { slug } = req.params;
    const targetUrl = urlMappings.get(slug);

    if (targetUrl) {
        console.log(`Redirecting ${slug} to ${targetUrl}`);
        return res.redirect(targetUrl);
    }

    res.status(404).send('<h1>Link not found</h1><p>The requested QR code destination does not exist.</p>');
});

app.listen(PORT, () => {
    console.log(`QR Backend running at http://localhost:${PORT}`);
});
