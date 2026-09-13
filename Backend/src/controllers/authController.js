const { admin, authClient } = require("../config/supabase");
const env = require("../config/env");
const { ok, fail } = require("../utils/response");

const normaliseCredentials = ({ email, password } = {}) => ({
    email: typeof email === "string" ? email.trim().toLowerCase() : "",
    password,
});

const sessionPayload = (session) => ({
    user: session.user,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
});

exports.register = async (req, res, next) => {
    try {
        const { email, password } = normaliseCredentials(req.body);
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const role = req.body?.role === "admin" ? "admin" : "staff";
        const adminCode = typeof req.body?.adminCode === "string" ? req.body.adminCode : "";

        if (!email || !password || !name) return fail(res, "Name, email, and password are required");
        if (password.length < 8) return fail(res, "Password must be at least 8 characters");
        if (role === "admin" && (!env.ADMIN_REGISTRATION_CODE || adminCode !== env.ADMIN_REGISTRATION_CODE)) {
            return fail(res, "A valid admin registration code is required to create an administrator account", [], 403);
        }

        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        });
        if (createError) {
            return fail(res, createError.message, [], createError.message.toLowerCase().includes("already") ? 409 : 400);
        }

        // The database trigger also creates this record. Upsert keeps registration
        // compatible with existing projects that have not run the repair migration yet.
        const { error: profileError } = await admin
            .from("profiles")
            .upsert({ id: created.user.id, name, role }, { onConflict: "id" });
        if (profileError) {
            await admin.auth.admin.deleteUser(created.user.id);
            throw profileError;
        }

        const { data: session, error: sessionError } = await authClient.auth.signInWithPassword({ email, password });
        if (sessionError || !session.session) throw sessionError || new Error("Supabase did not return a session");

        return ok(res, "Registration successful", sessionPayload(session), 201);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { data, error } = await authClient.auth.signInWithPassword(normaliseCredentials(req.body));
        if (error || !data.session) return fail(res, "Invalid email or password", [], 401);
        return ok(res, "Login successful", sessionPayload(data));
    } catch (error) {
        next(error);
    }
};
exports.me = async (req,res)=>ok(res,"Current user fetched successfully",{id:req.user.id,email:req.user.email,profile:req.user.profile});
