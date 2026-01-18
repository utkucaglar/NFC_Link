// Supabase Edge Function - Send Email via Resend
// Deploy: npx supabase functions deploy send-email

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from_name?: string;
  from_email?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Received email request");
    
    // API key kontrolü
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not found in environment");
      throw new Error("RESEND_API_KEY is not configured. Please set it using: npx supabase secrets set RESEND_API_KEY=your_key");
    }

    console.log("API Key found, length:", RESEND_API_KEY.length);

    const body = await req.json();
    console.log("Request body:", JSON.stringify({ to: body.to, subject: body.subject }));
    
    const { to, subject, html, from_name, from_email }: EmailRequest = body;

    // Validasyon
    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    // Resend free tier için onboarding email kullan
    const fromAddress = from_email || "onboarding@resend.dev";
    const fromName = from_name || "Esdodesign";

    console.log("Sending email to:", to, "from:", `${fromName} <${fromAddress}>`);

    // Resend API'ye gönder
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();
    console.log("Resend response:", JSON.stringify(result));

    if (!response.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || result.error || "Failed to send email");
    }

    console.log("Email sent successfully, id:", result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Email error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 even on error to avoid CORS issues
      }
    );
  }
});
