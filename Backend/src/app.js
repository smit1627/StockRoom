const express = require("express"),
    helmet = require("helmet"),
    cors = require("cors"),
    rateLimit = require("express-rate-limit"),
    env = require("./config/env"),
    { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

const configuredOrigins = (env.CORS_ORIGINS || env.FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const isPrivateDevOrigin = (origin) => {
    if (process.env.NODE_ENV === "production") return false;
    try {
        const { hostname, port } = new URL(origin);
        const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
        const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
        return (isLocalHost || isPrivateIpv4) && ["5173", "4173"].includes(port);
    } catch {
        return false;
    }
};

app.use(cors({
    origin(origin, callback) {
        // Browsers send an Origin header; API tools and same-machine health checks may not.
        if (!origin || configuredOrigins.includes(origin) || isPrivateDevOrigin(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/company", require("./routes/companyRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

app.get("/health", (req, res) =>
    res.json({
        success: true,
        message: "Inventory API is healthy",
        data: {},
    })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
