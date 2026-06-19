require('dotenv').config();
const app = require('../app'); // Changed from '../vercel'

module.exports = async (req, res) => {
  try {
    await app(req, res);
  } catch (err) {
    console.error('Vercel function error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// For local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}