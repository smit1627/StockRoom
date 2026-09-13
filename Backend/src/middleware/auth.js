const { admin } = require("../config/supabase");
const env = require("../config/env");
const { fail } = require("../utils/response");
const cache = require("../utils/memoryCache");

const defaultProfileName = (user) =>
    user.user_metadata?.name?.trim() || user.email?.split("@")[0] || "User";

exports.requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
        if (!token) return fail(res, "Authentication required", [], 401);

        const cacheKey = `auth:${token}`;
        let cachedUser = cache.get(cacheKey);
        if (!cachedUser) {
            const { data, error } = await admin.auth.getUser(token);
            if (error || !data.user) return fail(res, "Invalid or expired token", [], 401);
            cachedUser = data.user;
            if (env.AUTH_CACHE_TTL_SECONDS) cache.set(cacheKey, cachedUser, env.AUTH_CACHE_TTL_SECONDS * 1000);
        }

        const profileCacheKey = `profile:${cachedUser.id}`;
        let profile = cache.get(profileCacheKey);
        let profileError = null;
        if (!profile) {
            const result = await admin
                .from("profiles")
                .select("id,name,role")
                .eq("id", cachedUser.id)
                .maybeSingle();
            profile = result.data;
            profileError = result.error;
            if (profile && env.AUTH_CACHE_TTL_SECONDS) cache.set(profileCacheKey, profile, env.AUTH_CACHE_TTL_SECONDS * 1000);
        }

        // A deleted/restored profiles table can leave valid Supabase Auth users
        // without a profile. Recreate only their own staff profile on first use.
        if (!profile && !profileError) {
            const recovered = await admin
                .from("profiles")
                .upsert(
                    { id: cachedUser.id, name: defaultProfileName(cachedUser), role: "staff" },
                    { onConflict: "id" },
                )
                .select("id,name,role")
                .single();
            profile = recovered.data;
            profileError = recovered.error;
            if (profile && env.AUTH_CACHE_TTL_SECONDS) cache.set(profileCacheKey, profile, env.AUTH_CACHE_TTL_SECONDS * 1000);
        }

        if (profileError || !profile) {
            return fail(res, "User profile could not be loaded. Run the Supabase profile repair migration.", [], 503);
        }

        req.user = { ...cachedUser, profile };
        next();
    } catch (error) {
        next(error);
    }
};
exports.allowRoles = (...roles) => (req, res, next) => roles.includes(req.user?.profile.role) ? next() : fail(res, "You do not have permission for this action", [], 403);
