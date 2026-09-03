// Vercel serverless function to serve static HTML
module.exports = (req, res) => {
    res.status(200).send('Hello from Vercel!');
};
