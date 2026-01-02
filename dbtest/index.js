const express = require('express');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Health Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Health server running on port ${PORT}`);
});

// DB Connection Testing Loop
const checkDatabase = async () => {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('DATABASE_URL environment variable is not set.');
        return;
    }

    // Obscure password for logging
    // Assuming format: postgres://user:password@host:port/db
    let obscuredUrl = dbUrl;
    try {
        const url = new URL(dbUrl);
        if (url.password) {
            url.password = '******';
            obscuredUrl = url.toString();
        }
    } catch (e) {
        // Fallback or ignore if URL parsing fails (might not be a standard URL)
        console.warn('Could not parse DATABASE_URL for obscuring:', e.message);
    }

    console.log(`[${new Date().toISOString()}] Testing connection to: ${obscuredUrl}`);

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log(`[${new Date().toISOString()}] Connection SUCCESS. DB Time: ${res.rows[0].now}`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Connection FAILED:`, err.message);
    } finally {
        await client.end().catch(() => { });
    }
};

// Run immediately then loop
checkDatabase();
setInterval(checkDatabase, 5000);
