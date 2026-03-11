const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// Session Configuration
app.use(session({
    secret: 'qrgen-super-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 Day
}));

// Serve frontend files
app.use(express.static(__dirname));

// Dummy Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

/**
 * API: Login
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isLoggedIn = true;
        return res.json({ success: true, message: 'Logged in successfully' });
    }
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

/**
 * API: Logout
 */
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, error: 'Could not log out' });
        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});

/**
 * API: Check Auth
 */
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.isLoggedIn) {
        return res.json({ authenticated: true });
    }
    return res.status(401).json({ authenticated: false });
});

// In-memory database
const urlMappings = new Map();

/**
 * API: Upsert Link Mapping
 */
app.post('/api/upsert', (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }

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
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/upsert`);
});