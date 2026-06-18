const app = require('../vercel');

// Vercel serverless handler
module.exports = async (req, res) => {
  await app(req, res);
};

// Start the server if this file is run directly (for local testing)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}