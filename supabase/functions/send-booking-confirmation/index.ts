// Supabase Edge Function: send-booking-confirmation
// Uses Brevo (formerly Sendinblue) — 300 free emails/day, sends to any email address
// Deploy: supabase functions deploy send-booking-confirmation
// Set secret: supabase secrets set BREVO_API_KEY=xkeysib-...

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
      attendee_name,
      attendee_email,
      event_title,
      event_date,
      event_venue,
      event_city,
      booking_id,
      ticket_qr_code,
      amount_paid,
      organizer_name,
    } = await req.json()

    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: "BREVO_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build QR code image via public API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket_qr_code)}&bgcolor=ffffff&color=0a0f1e`

    // Format amount
    const formattedAmount = amount_paid
      ? `₹${Number(amount_paid).toLocaleString("en-IN")}`
      : "FREE"

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Ticket is Confirmed — Tixque</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a2235;border-radius:16px;overflow:hidden;border:1px solid #2a3a55;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-1px;">Tixque</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Your Event Ticketing Platform</div>
            </td>
          </tr>

          <!-- Confirmation -->
          <tr>
            <td style="background:#1a2235;padding:40px 32px 24px;text-align:center;">
              <div style="width:72px;height:72px;background:#10b981;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:36px;color:white;line-height:1;">✓</span>
              </div>
              <h1 style="color:#f0f4ff;font-size:26px;font-weight:800;margin:0 0 8px;">You're going! 🎉</h1>
              <h2 style="color:#7c3aed;font-size:20px;font-weight:700;margin:0;">${event_title}</h2>
            </td>
          </tr>

          <!-- Event Details -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;border:1px solid #2a3a55;overflow:hidden;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a3a55;">
                          <span style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">📅 Date</span><br/>
                          <span style="font-size:15px;color:#f0f4ff;font-weight:600;">${event_date || "See event page"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a3a55;">
                          <span style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">📍 Venue</span><br/>
                          <span style="font-size:15px;color:#f0f4ff;font-weight:600;">${event_venue || "TBA"}${event_city ? ", " + event_city : ""}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">🎤 Organizer</span><br/>
                          <span style="font-size:15px;color:#f0f4ff;font-weight:600;">${organizer_name || "Tixque"}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Booking Reference -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;border:1px solid #2a3a55;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <div style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Booking Reference</div>
                    <div style="font-size:18px;color:#7c3aed;font-weight:700;font-family:monospace;letter-spacing:2px;">${(booking_id || "").toUpperCase()}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <div style="background:white;display:inline-block;padding:16px;border-radius:12px;">
                <img src="${qrImageUrl}" width="160" height="160" alt="Ticket QR Code" style="display:block;" />
              </div>
              <div style="font-size:13px;color:#8899bb;margin-top:12px;">📱 Show this QR code at the venue for entry</div>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;border:1px solid #2a3a55;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#8899bb;">Ticket Price</td>
                        <td align="right" style="font-size:15px;color:#f0f4ff;font-weight:700;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #2a3a55;padding-top:8px;margin-top:8px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#8899bb;padding-top:8px;">Payment Status</td>
                              <td align="right" style="padding-top:8px;">
                                <span style="background:rgba(16,185,129,0.15);color:#10b981;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;">CONFIRMED ✓</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111827;border-top:1px solid #2a3a55;padding:24px 32px;text-align:center;">
              <div style="font-size:22px;font-weight:900;color:#7c3aed;margin-bottom:8px;">Tixque</div>
              <div style="font-size:12px;color:#556080;line-height:1.6;">
                This is an automated confirmation email. Please do not reply.<br/>
                If you have questions, contact support@tixque.in
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Send via Brevo (Sendinblue) API
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Tixque",
          email: "rishienjamuri@gmail.com",
        },
        to: [
          {
            email: attendee_email,
            name: attendee_name || "Attendee",
          },
        ],
        subject: `Your ticket is confirmed for ${event_title} 🎟️`,
        htmlContent: emailHtml,
      }),
    })

    if (!brevoResponse.ok) {
      const err = await brevoResponse.text()
      return new Response(
        JSON.stringify({ error: `Brevo API error: ${err}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const brevoData = await brevoResponse.json()

    // Write to email_logs so admin Email Logs page shows this entry
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      if (supabaseUrl && supabaseServiceKey) {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        await adminClient.from("email_logs").insert({
          recipient_name: attendee_name || null,
          recipient_email: attendee_email || null,
          event_title: event_title || null,
          organizer_name: organizer_name || null,
          email_subject: `Your ticket is confirmed for ${event_title}`,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
      }
    } catch (logErr) {
      // Don't fail the main response if logging fails
      console.error("email_logs insert failed:", logErr)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: brevoData.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
