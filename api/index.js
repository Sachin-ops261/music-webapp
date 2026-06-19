require('dotenv').config();
const app = require('../server/app');

module.exports = async (req, res) => {
  try {
    await app(req, res);
  } catch (err) {
    console.error('Vercel function error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
