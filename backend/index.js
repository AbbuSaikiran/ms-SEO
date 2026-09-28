const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*'
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: "WarpIndex Backend is running (Node.js)" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
