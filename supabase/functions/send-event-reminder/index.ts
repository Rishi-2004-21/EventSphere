// Supabase Edge Function: send-event-reminder
// Deploy this in Supabase Dashboard → Edge Functions → Create new function
// Name it: send-event-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const {
      organizer_id,
      organizer_name,
      event_id,
      new_event_title,
      new_event_date,
      new_event_city,
      new_event_price,
      new_event_category,
      attendees, // Array of { name, email }
    } = await req.json()

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not set in Edge Function secrets")
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formattedPrice = new_event_price > 0
      ? `₹${Number(new_event_price).toLocaleString("en-IN")}`
      : "Free"

    const formattedDate = new_event_date
      ? new Date(new_event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : new_event_date

    const categoryColors: Record<string, string> = {
      Tech: "#3b82f6",
      Art: "#a855f7",
      Fitness: "#10b981",
      Cultural: "#f59e0b",
      Community: "#0d9488",
      Lifestyle: "#ec4899",
    }
    const catColor = categoryColors[new_event_category] || "#7c3aed"

    let sentCount = 0
    const emailLogs = []

    for (const attendee of attendees) {
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Event from ${organizer_name}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#0d9488);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">⚡ Tixque</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px;">Your event discovery platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1e293b;padding:36px 32px;">
              <p style="color:#f1f5f9;font-size:16px;margin:0 0 8px;font-weight:600;">Hi ${attendee.name}! 👋</p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                You previously attended an event by <strong style="color:#c4b5fd;">${organizer_name}</strong> and they've just announced an exciting new event you might love!
              </p>

              <!-- Event Card -->
              <div style="background:#0f172a;border:1px solid #334155;border-radius:14px;padding:28px;margin-bottom:28px;">
                <div style="margin-bottom:14px;">
                  <span style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${new_event_category}</span>
                </div>
                <div style="font-size:22px;font-weight:800;color:#f1f5f9;margin-bottom:20px;line-height:1.3;">${new_event_title}</div>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                      <span style="color:#64748b;font-size:13px;">📅 Date</span>
                      <span style="float:right;color:#e2e8f0;font-size:13px;font-weight:600;">${formattedDate}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                      <span style="color:#64748b;font-size:13px;">📍 City</span>
                      <span style="float:right;color:#e2e8f0;font-size:13px;font-weight:600;">${new_event_city}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#64748b;font-size:13px;">🎟️ Price</span>
                      <span style="float:right;color:#c4b5fd;font-size:15px;font-weight:800;">${formattedPrice}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="https://tixque.app/discover" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.02em;">
                  🎫 View Event
                </a>
              </div>

              <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
                You're receiving this because you previously booked an event hosted by <strong>${organizer_name}</strong> on Tixque.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #1e293b;">
              <p style="color:#334155;font-size:12px;margin:0;">
                © 2025 Tixque · <a href="#" style="color:#4f46e5;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

      // Send email via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Tixque <onboarding@resend.dev>",
          to: attendee.email,
          subject: `${organizer_name} is hosting a new event you might love 🎉`,
          html: htmlBody,
        }),
      })

      const resData = await res.json()

      if (res.ok) {
        sentCount++
        emailLogs.push({
          id: crypto.randomUUID(),
          organizer_id,
          organizer_name,
          event_id,
          event_title: new_event_title,
          recipient_email: attendee.email,
          recipient_name: attendee.name,
          email_subject: `${organizer_name} is hosting a new event you might love 🎉`,
          sent_at: new Date().toISOString(),
          status: "sent",
        })
      } else {
        console.error("Resend error for", attendee.email, resData)
      }
    }

    // Insert all email logs at once
    if (emailLogs.length > 0) {
      const { error: logErr } = await supabase.from("email_logs").insert(emailLogs)
      if (logErr) console.error("Failed to insert email logs:", logErr)
    }

    return new Response(
      JSON.stringify({ success: true, emails_sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Edge function error:", err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
