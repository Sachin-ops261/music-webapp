const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

//routes
const songRoutes = require('./routes/songs');
app.use('/api/songs', songRoutes);

//serve frontend for any other route
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

//start server
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
})