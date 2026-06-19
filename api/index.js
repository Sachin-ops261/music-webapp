require('dotenv').config();
const app = require('../server/app');

console.log('ROOT API ENTRYPOINT LOADED: cwd=', process.cwd(), '__dirname=', __dirname);
console.log('ROOT ENV CHECK:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
});

module.exports = async (req, res) => {
  try {
    await app(req, res);
  } catch (err) {
    console.error('Vercel function error:', err.stack || err);
    res.status(500).json({ error: 'Server error' });
  }
};

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
