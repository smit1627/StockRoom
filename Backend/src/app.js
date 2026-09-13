const express = require("express"),
    helmet = require("helmet"),
    cors = require("cors"),
    rateLimit = require("express-rate-limit"),
    env = require("./config/env"),
    { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

const configuredOrigins = (
  env.CORS_ORIGINS ||
  env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as health checks.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (configuredOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      if (isPrivateDevOrigin(normalizedOrigin)) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

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
