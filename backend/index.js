const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*'
}));

app.use(express.json());

// Add this GitHub App Callback Route
app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    try {
        // Exchange the code for an access token using GitHub App credentials
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, {
            headers: {
                accept: 'application/json'
            }
        });

        const accessToken = response.data.access_token;
        
        // Redirect the user back to the frontend with the token
        res.redirect(`http://localhost:5173/projects?token=${accessToken}`);
        
    } catch (error) {
        console.error('Error during GitHub OAuth:', error.message);
        res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
});

app.get('/', (req, res) => {
    res.json({ status: "WarpIndex Backend is running (Node.js)" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
