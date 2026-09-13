const { createClient } = require("@supabase/supabase-js");
const env = require("./env");
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
// Keep privileged operations separate from password sign-in requests.  The
// latter must use the public anon key so Supabase creates a normal user session.
const authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { admin, authClient };
