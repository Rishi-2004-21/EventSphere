// Supabase Edge Function: send-booking-confirmation
// Deploy with: supabase functions deploy send-booking-confirmation
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxx

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build QR code URL using a public QR service
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
  <title>Your Ticket is Confirmed — EventSphere</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a2235;border-radius:16px;overflow:hidden;border:1px solid #2a3a55;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-1px;">EventSphere</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Your Event Ticketing Platform</div>
            </td>
          </tr>

          <!-- Green checkmark -->
          <tr>
            <td style="background:#1a2235;padding:40px 32px 24px;text-align:center;">
              <div style="width:72px;height:72px;background:#10b981;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:36px;color:white;line-height:1;">✓</span>
              </div>
              <h1 style="color:#f0f4ff;font-size:26px;font-weight:800;margin:0 0 8px;">You're going! 🎉</h1>
              <h2 style="color:#7c3aed;font-size:20px;font-weight:700;margin:0;">${event_title}</h2>
            </td>
          </tr>

          <!-- Event details card -->
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
                          <span style="font-size:15px;color:#f0f4ff;font-weight:600;">${event_venue || "TBA"}, ${event_city || ""}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">🎤 Organizer</span><br/>
                          <span style="font-size:15px;color:#f0f4ff;font-weight:600;">${organizer_name || "EventSphere"}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Booking ref -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;border:1px solid #2a3a55;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <div style="font-size:11px;color:#556080;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Booking Reference</div>
                    <div style="font-size:18px;color:#7c3aed;font-weight:700;font-family:monospace;letter-spacing:2px;">${booking_id?.toUpperCase()}</div>
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
              <div style="font-size:22px;font-weight:900;color:#7c3aed;margin-bottom:8px;">EventSphere</div>
              <div style="font-size:12px;color:#556080;line-height:1.6;">
                This is an automated confirmation email. Please do not reply.<br/>
                If you have questions, contact support@eventsphere.in
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

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EventSphere <onboarding@resend.dev>",
        to: [attendee_email],
        subject: `Your ticket is confirmed for ${event_title} 🎟️`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const err = await resendResponse.text()
      return new Response(
        JSON.stringify({ error: `Resend API error: ${err}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
