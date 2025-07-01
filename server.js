const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config(); // This line loads the .env file

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.')); // This serves your HTML, CSS, and client-side JS

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    const API_KEY = process.env.API_KEY; // This securely reads the key from your .env file

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server. Make sure you have a .env file.' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Google AI API error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to fetch from Google AI API.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
