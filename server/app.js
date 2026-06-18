const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const songRoutes = require('./routes/songs');
const youtubeRoutes = require('./routes/youtube');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Block AppsGeyser
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  
  if (referer.includes('appsgeyser') || userAgent.includes('AppMaker')) {
    return res.status(403).send('Access denied');
  }
  next();
});

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/youtube', youtubeRoutes);

// Export for Vercel
module.exports = app;