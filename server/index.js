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

// ✅ ADD YOUTUBE ROUTES HERE (BEFORE THE CATCH-ALL ROUTE!)
const youtubeRoutes = require('./routes/youtube');
app.use('/api/youtube', youtubeRoutes);

//start server
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
})