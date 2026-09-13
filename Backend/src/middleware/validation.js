const { fail } = require("../utils/response");
exports.validate = (schema) => (req, res, next) => { const result = schema.safeParse({ body: req.body, query: req.query, params: req.params }); if (!result.success) return fail(res, "Validation failed", result.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message }))); req.validated = result.data; next(); };
