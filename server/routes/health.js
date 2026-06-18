const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint — Render uses this to confirm the server is alive
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Tixque Backend',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    env: {
      supabase: !!process.env.SUPABASE_URL,
      razorpay: !!process.env.RAZORPAY_KEY_ID,
      resend: !!process.env.RESEND_API_KEY,
    },
  });
});

module.exports = router;
