const express = require('express');
const axios = require('axios'); // Use axios instead of node-fetch
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }

    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch from Google AI API.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
