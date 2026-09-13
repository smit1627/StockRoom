const camelize = (value) => { if (Array.isArray(value)) return value.map(camelize); if (value && typeof value === "object" && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), camelize(item)])); return value; };
exports.ok = (res, message, data, status = 200) => res.status(status).json({ success: true, message, data: camelize(data) });
exports.fail = (res, message, errors = [], status = 400) => res.status(status).json({ success: false, message, errors });
