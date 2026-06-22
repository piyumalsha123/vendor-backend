import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import dotenv from "dotenv";

// Import Routers
import AuthRouter from "./routers/authRouter";
import ProductRouter from "./routers/productRouter";
import orderRouter from "./routers/orderRouter";
import uploadRouter from "./routers/uploadRouter";
import StoreRouter from "./routers/storeRouter"; 
import profileRouter from './routers/profileRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL as string;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY as string; 

// 1. CORS සහ Middleware නිවැරදි අනුපිළිවෙල
app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request Logger (සෑම ඉල්ලීමක්ම Terminal එකේ බලන්න)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// 3. Routes
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/store", StoreRouter); 
app.use('/api/v1/stores', StoreRouter);
app.use('/api/v1/products', ProductRouter);
app.use('/api/v1/profile', profileRouter); // මෙය නිවැරදිව Mount වී ඇත

// AI Route
app.post("/api/v1/generate-attributes", async (req, res) => {
  // ... (ඔබේ AI logic එක මෙහි තබා ගන්න)
});

// 4. අවසාන 404 Handler (සියලුම Routes වලට පහළින්)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// DB Connection
mongoose.connect(DB_URL)
  .then(() => {
    console.log("DB connected...");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => console.error("DB Connection Error:", err));