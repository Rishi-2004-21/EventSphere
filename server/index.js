require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health');
const paymentsRouter = require('./routes/payments');
const emailRouter = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS ─────────────────────────────────────────────────────
// Allow requests from your Vercel frontend and localhost dev
const allowedOrigins = [
  'https://event-sphere-psi-ebon.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────
// Raw body needed for Razorpay webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/email', emailRouter);

// ── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'EventSphere Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET  /api/health',
      'POST /api/payments/create-order',
      'POST /api/payments/verify',
      'POST /api/payments/webhook',
      'POST /api/email/send-confirmation',
    ],
  });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ EventSphere Backend running on port ${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Razorpay Key: ${process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Resend Key:   ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
});
