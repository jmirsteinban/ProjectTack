import { createClient } from "npm:@supabase/supabase-js@2";

const GOD_MODE_EMAIL = "jmirsteinban@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SB_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing authorization header." }, 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const authClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await authClient.auth.getUser(token);

  if (actorError || !actor) {
    return jsonResponse({ error: "Invalid or expired session." }, 401);
  }

  if (String(actor.email ?? "").trim().toLowerCase() !== GOD_MODE_EMAIL) {
    return jsonResponse({ error: "Admin access required." }, 403);
  }

  const payload = await req.json().catch(() => null) as {
    userId?: string;
    password?: string;
  } | null;

  const targetUserId = String(payload?.userId ?? "").trim();
  const nextPassword = String(payload?.password ?? "");

  if (!targetUserId) {
    return jsonResponse({ error: "userId is required." }, 400);
  }

  if (nextPassword.length < 12) {
    return jsonResponse({ error: "Password must be at least 12 characters long." }, 400);
  }

  if (targetUserId === actor.id) {
    return jsonResponse({ error: "Use the regular account settings flow to change the God account password." }, 400);
  }

  const { error: updateError } = await serviceClient.auth.admin.updateUserById(targetUserId, {
    password: nextPassword,
  });

  if (updateError) {
    return jsonResponse({ error: updateError.message || "Could not update the user password." }, 500);
  }

  return jsonResponse({
    ok: true,
    message: "Password updated successfully.",
    userId: targetUserId,
  });
});
