# EventSphere Backend — Render Deployment Guide

## What this server does

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check (Render uses this) |
| `POST /api/payments/create-order` | Creates Razorpay order (secret key stays server-side) |
| `POST /api/payments/verify` | Verifies payment signature |
| `POST /api/payments/webhook` | Receives Razorpay payment events |
| `POST /api/email/send-confirmation` | Sends booking confirmation email via Resend |

---

## Deploy to Render (Step by Step)

### Step 1 — Push this code to GitHub
The server lives at `/server` in your main repo. Just push normally:
```bash
git add .
git commit -m "Add Render backend server"
git push
```

### Step 2 — Create a Render account
Go to → https://render.com → Sign up with GitHub

### Step 3 — Create a Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repo: `Rishi-2004-21/EventSphere`
3. Fill in:

| Setting | Value |
|---------|-------|
| **Name** | `eventsphere-backend` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Plan** | Free |

4. Click **Create Web Service**

### Step 4 — Add Environment Variables
In Render → your service → **Environment** tab → Add:

```
SUPABASE_URL=https://foexoyakzskviskmkqqn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API → service_role key>
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<your razorpay secret>
RAZORPAY_WEBHOOK_SECRET=<set this in Razorpay Dashboard → Webhooks>
RESEND_API_KEY=re_...
```

### Step 5 — Get your Render URL
After deploy, Render gives you:
`https://eventsphere-backend.onrender.com`

### Step 6 — Add backend URL to Vercel
In Vercel → your project → **Settings → Environment Variables**:
```
VITE_BACKEND_URL=https://eventsphere-backend.onrender.com
```

### Step 7 — Set up Razorpay Webhook (for payments)
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add URL: `https://eventsphere-backend.onrender.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy the webhook secret → paste it in Render env as `RAZORPAY_WEBHOOK_SECRET`

---

## Test your server
```bash
curl https://eventsphere-backend.onrender.com/api/health
```
Should return: `{"status":"ok","service":"EventSphere Backend",...}`

---

## ⚠️ Note on Render Free Plan
Render free services **spin down after 15 minutes of inactivity** and take ~30 seconds to wake up on the next request. For production, upgrade to a paid plan ($7/mo).
