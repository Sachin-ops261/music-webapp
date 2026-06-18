const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const songRoutes = require('./routes/songs');
const youtubeRoutes = require('./routes/youtube');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/youtube', youtubeRoutes);

// Export for Vercel
module.exports = app;