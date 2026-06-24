// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import { GoogleGenerativeAI } from "@google/generative-ai"; 
// import dotenv from "dotenv";


// import AuthRouter from "./routers/authRouter";
// import ProductRouter from "./routers/productRouter";
// import orderRouter from "./routers/orderRouter";
// import uploadRouter from "./routers/uploadRouter";
// import StoreRouter from "./routers/storeRouter"; 
// import profileRouter from './routers/profileRouter';
// import vendorRouter from './routers/vendorRouter';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const DB_URL = process.env.DB_URL as string;
// const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY as string; 

// app.use(cors({
//   origin: "http://localhost:5173", 
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   console.log(`[${req.method}] ${req.originalUrl}`);
//   next();
// });


// app.use("/api/v1/auth", AuthRouter);
// app.use("/api/v1/upload", uploadRouter);
// app.use("/api/v1/orders", orderRouter);
// app.use("/api/v1/store", StoreRouter); 
// app.use('/api/v1/stores', StoreRouter);
// app.use('/api/v1/products', ProductRouter);
// app.use('/api/v1/profile', profileRouter); 
// app.use("/api/v1/vendor", vendorRouter);

// app.post("/api/v1/generate-attributes", async (req, res) => {
 
// });

// app.use((req, res) => {
//   res.status(404).json({ message: `Route ${req.originalUrl} not found` });
// });

// mongoose.connect(DB_URL)
//   .then(() => {
//     console.log("DB connected...");
//     app.listen(PORT, () => {
//       console.log(`Server is running on port: ${PORT}`);
//     });
//   })
//   .catch((err) => console.error("DB Connection Error:", err));


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import AuthRouter from "./routers/authRouter";
import ProductRouter from "./routers/productRouter";
import orderRouter from "./routers/orderRouter";
import uploadRouter from "./routers/uploadRouter";
import StoreRouter from "./routers/storeRouter";
import profileRouter from "./routers/profileRouter";
import vendorRouter from "./routers/vendorRouter";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://vendor-frontend-rose.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.get("/", (req, res) => {
  res.json({ message: "Vendor Backend API is running successfully!" });
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/store", StoreRouter);
app.use("/api/v1/stores", StoreRouter);
app.use("/api/v1/products", ProductRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/vendor", vendorRouter);

app.post("/api/v1/generate-attributes", async (req, res) => {
  const { category } = req.body;
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Category: "${category}". Suggest 10-15 relevant custom product attributes. Return as a JSON array only.`;
console.log("NEW CODE RUNNING");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[.*\]/s);
    
    if (!jsonMatch) throw new Error("Invalid response format");
    
    const attributes = JSON.parse(jsonMatch[0]);
    res.json({ attributes });
  } catch (err: any) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to generate" });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.DB_URL as string);
    console.log("DB connected...");
  } catch (err) {
    console.error("DB Connection Error:", err);
    throw err;
  }
};


export default async (req: any, res: any) => {
  await connectDB();
  return app(req, res);
};

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  });
}