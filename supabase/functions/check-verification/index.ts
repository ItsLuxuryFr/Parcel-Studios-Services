import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `${SUPABASE_URL.replace(/\/$/, "")}/admin/v1/users?email=eq.${encodeURIComponent(email)}`;

    const r = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("Admin API request failed:", r.status, text);
      return new Response(
        JSON.stringify({ error: "admin request failed", status: r.status, body: text }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let json;
    try { 
      json = JSON.parse(text);
    } catch { 
      json = null;
    }

    let user = null;
    if (Array.isArray(json)) {
      user = json[0] ?? null;
    } else if (json?.users) {
      user = json.users[0] ?? null;
    } else if (json && typeof json === "object") {
      if (json.id || json.email || json.user_metadata) {
        user = json;
      }
    }

    if (!user) {
      return new Response(
        JSON.stringify({ verified: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ verified: !!user.email_confirmed_at, email_confirmed_at: user.email_confirmed_at ?? null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error("check-verification function error:", err);
    return new Response(
      JSON.stringify({ error: "internal error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
