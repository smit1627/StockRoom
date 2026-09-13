const { fail } = require("../utils/response");
exports.notFound = (req, res) => fail(res, "Route not found", [], 404);
exports.errorHandler = (error, req, res, next) => { console.error(error); if (error.code === "23505") return fail(res, "A record with this value already exists", [], 409); if (error.code === "23503") return fail(res, "This record is currently in use", [], 409); return fail(res, error.message || "Internal server error", error.errors || [], error.status || 500); };
