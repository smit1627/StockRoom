const entries = new Map();

exports.get = (key) => {
    const entry = entries.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return null;
    }
    return entry.value;
};

exports.set = (key, value, ttlMs) => {
    entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
};

exports.remove = (key) => entries.delete(key);
