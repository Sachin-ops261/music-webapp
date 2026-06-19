const dotenv = require('dotenv');
dotenv.config(); // ✅ Load environment variables FIRST

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db'); // NOW it can access process.env.DATABASE_URL

const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

// Block AppsGeyser and other unwanted wrappers
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  
  if (referer.includes('appsgeyser') || userAgent.includes('AppMaker')) {
    return res.status(403).send('Access denied');
  }
  next();
});

//routes
const songRoutes = require('./routes/songs');
app.use('/api/songs', songRoutes);

const youtubeRoutes = require('./routes/youtube');
app.use('/api/youtube', youtubeRoutes);

//start server
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});