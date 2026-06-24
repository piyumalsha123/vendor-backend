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
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

import AuthRouter from "./routers/authRouter";
import ProductRouter from "./routers/productRouter";
import orderRouter from "./routers/orderRouter";
import uploadRouter from "./routers/uploadRouter";
import StoreRouter from "./routers/storeRouter";
import profileRouter from "./routers/profileRouter";
import vendorRouter from "./routers/vendorRouter";

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
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        error: "Category is required"
      });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({
        error: "Missing GOOGLE_AI_API_KEY"
      });
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
     You are an expert e-commerce assistant.

Store category: ${category}

Generate 10 relevant product attributes.

Return ONLY JSON array.

Example:
["Size", "Color", "Material"]
`;
    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    console.log("RAW AI RESPONSE:", text);

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const attributes = JSON.parse(cleaned);

    return res.json({
      attributes
    });

  } catch (err: any) {
    console.error("AI ERROR:", err);

    return res.status(500).json({
      error: err.message
    });
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