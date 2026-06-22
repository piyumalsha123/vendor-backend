"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const productRouter_1 = __importDefault(require("./routers/productRouter"));
const orderRouter_1 = __importDefault(require("./routers/orderRouter"));
const uploadRouter_1 = __importDefault(require("./routers/uploadRouter"));
const storeRouter_1 = __importDefault(require("./routers/storeRouter"));
const profileRouter_1 = __importDefault(require("./routers/profileRouter"));
const vendorRouter_1 = __importDefault(require("./routers/vendorRouter"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});
app.use("/api/v1/auth", authRouter_1.default);
app.use("/api/v1/upload", uploadRouter_1.default);
app.use("/api/v1/orders", orderRouter_1.default);
app.use("/api/v1/store", storeRouter_1.default);
app.use('/api/v1/stores', storeRouter_1.default);
app.use('/api/v1/products', productRouter_1.default);
app.use('/api/v1/profile', profileRouter_1.default);
app.use("/api/v1/vendor", vendorRouter_1.default);
app.post("/api/v1/generate-attributes", async (req, res) => {
});
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
mongoose_1.default.connect(DB_URL)
    .then(() => {
    console.log("DB connected...");
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
})
    .catch((err) => console.error("DB Connection Error:", err));
