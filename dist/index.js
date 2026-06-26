"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const adminRouter_1 = __importDefault(require("./routers/adminRouter"));
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const productRouter_1 = __importDefault(require("./routers/productRouter"));
const orderRouter_1 = __importDefault(require("./routers/orderRouter"));
const uploadRouter_1 = __importDefault(require("./routers/uploadRouter"));
const storeRouter_1 = __importDefault(require("./routers/storeRouter"));
const profileRouter_1 = __importDefault(require("./routers/profileRouter"));
const vendorRouter_1 = __importDefault(require("./routers/vendorRouter"));
const aiRouter_1 = __importDefault(require("./routers/aiRouter"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://vendor-frontend-rose.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});
// Routes
app.get("/", (req, res) => {
    res.json({ message: "Vendor Backend API is running successfully!" });
});
app.use("/api/v1/admin", adminRouter_1.default);
app.use("/api/v1/auth", authRouter_1.default);
app.use("/api/v1/upload", uploadRouter_1.default);
app.use("/api/v1/orders", orderRouter_1.default);
app.use("/api/v1/store", storeRouter_1.default);
app.use("/api/v1/stores", storeRouter_1.default);
app.use("/api/v1/products", productRouter_1.default);
app.use("/api/v1/profile", profileRouter_1.default);
app.use("/api/v1/vendor", vendorRouter_1.default);
app.use("/api/v1", aiRouter_1.default);
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
const connectDB = async () => {
    try {
        if (mongoose_1.default.connection.readyState >= 1)
            return;
        await mongoose_1.default.connect(process.env.DB_URL);
        console.log("DB connected...");
    }
    catch (err) {
        console.error("DB Connection Error:", err);
        throw err;
    }
};
// Export for Serverless or Production
exports.default = async (req, res) => {
    await connectDB();
    return app(req, res);
};
// Local Development Server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    });
}
