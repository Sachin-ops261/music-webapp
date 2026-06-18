const app = require('../app'); // Changed from '../vercel'

module.exports = async (req, res) => {
  await app(req, res);
};

// For local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}