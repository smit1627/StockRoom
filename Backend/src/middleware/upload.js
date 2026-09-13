const multer = require("multer"); const { fail } = require("../utils/response");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, done) => done(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) });
exports.uploadImage = upload.single("image");
exports.uploadError = (error, req, res, next) => error ? fail(res, error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Only JPG, PNG, and WebP images are allowed") : next();
