const { z } = require("zod");
require("dotenv").config();
const parsed = z.object({ SUPABASE_URL: z.string().url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), SUPABASE_ANON_KEY: z.string().min(1), PORT: z.coerce.number().int().positive().default(3000), FRONTEND_URL: z.string().url().default("http://localhost:5173"), CORS_ORIGINS: z.string().optional(), ADMIN_REGISTRATION_CODE: z.string().min(8).optional(), AUTH_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(60).default(30) }).safeParse(process.env);
if (!parsed.success) { console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors); process.exit(1); }
module.exports = parsed.data;
