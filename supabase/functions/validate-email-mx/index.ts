const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailValidationRequest {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EmailValidationRequest = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          error: "Geçersiz email formatı",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Extract domain from email
    const domain = email.split("@")[1];
    if (!domain) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          error: "Geçersiz email formatı",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check MX records
    try {
      const mxRecords = await Deno.resolveDns(domain, "MX");
      
      if (mxRecords && mxRecords.length > 0) {
        // MX records found - email domain is valid
        return new Response(
          JSON.stringify({
            success: true,
            valid: true,
            domain: domain,
            mxRecords: mxRecords.map((mx) => ({
              exchange: mx.exchange,
              priority: mx.priority,
            })),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else {
        // No MX records found
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            domain: domain,
            error: "Bu email adresinin domain'inde MX kaydı bulunamadı. Email alıcı sunucusu yapılandırılmamış olabilir.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    } catch (dnsError: any) {
      // DNS lookup failed
      console.error("DNS lookup error:", dnsError);
      
      // Check if it's a domain not found error
      if (dnsError.code === "NXDOMAIN" || dnsError.name === "NotFound") {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            domain: domain,
            error: "Lütfen geçerli bir email adresi giriniz.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Other DNS errors - might be temporary, allow but warn
      return new Response(
        JSON.stringify({
          success: true,
          valid: true, // Allow it, might be temporary DNS issue
          domain: domain,
          warning: "MX kaydı kontrol edilemedi, ancak email formatı geçerli görünüyor.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error: any) {
    console.error("Email validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Email doğrulama sırasında bir hata oluştu",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
