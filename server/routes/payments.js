const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Razorpay is loaded lazily so the server starts even without a key configured
let razorpay;
function getRazorpay() {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order server-side (secret key stays hidden)
 *
 * Body: { amount: number (in rupees), currency?: string, receipt?: string }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = `receipt_${Date.now()}` } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number in rupees.' });
    }

    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // Razorpay needs paise (1 rupee = 100 paise)
      currency,
      receipt,
    });

    console.log(`[Payments] Created order ${order.id} for ₹${amount}`);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (err) {
    console.error('[Payments] create-order error:', err.message);
    res.status(500).json({ error: 'Failed to create payment order', details: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature after successful payment
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification fields' });
    }

    // Build the expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[Payments] Signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    console.log(`[Payments] Payment verified: ${razorpay_payment_id}`);
    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error('[Payments] verify error:', err.message);
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay sends events here after payment (capture, refund, etc.)
 * The body must be raw bytes for signature verification.
 *
 * In Razorpay Dashboard → Settings → Webhooks → add your Render URL:
 *   https://eventsphere-backend.onrender.com/api/payments/webhook
 */
router.post('/webhook', (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check');
      return res.json({ received: true });
    }

    // Verify Razorpay webhook signature
    const receivedSignature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body) // raw body
      .digest('hex');

    if (receivedSignature !== expectedSignature) {
      console.error('[Webhook] Invalid signature — possible spoofed request');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Parse the raw body
    const event = JSON.parse(req.body.toString());
    const eventType = event.event;

    console.log(`[Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment.captured':
        console.log(`[Webhook] Payment captured: ${event.payload.payment.entity.id}`);
        // TODO: update booking status in Supabase if needed
        break;

      case 'payment.failed':
        console.log(`[Webhook] Payment failed: ${event.payload.payment.entity.id}`);
        // TODO: mark booking as failed in Supabase
        break;

      case 'refund.created':
        console.log(`[Webhook] Refund created: ${event.payload.refund.entity.id}`);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
