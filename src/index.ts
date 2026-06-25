
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import adminRouter from "./routers/adminRouter"
import AuthRouter from "./routers/authRouter";
import ProductRouter from "./routers/productRouter";
import orderRouter from "./routers/orderRouter";
import uploadRouter from "./routers/uploadRouter";
import StoreRouter from "./routers/storeRouter";
import profileRouter from "./routers/profileRouter";
import vendorRouter from "./routers/vendorRouter";
import axios from "axios";
import OpenAI from "openai";

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
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/store", StoreRouter);
app.use("/api/v1/stores", StoreRouter);
app.use("/api/v1/products", ProductRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/vendor", vendorRouter);


// app.post("/api/v1/generate-attributes", async (req, res) => {
//   try {
//     const { category } = req.body;

//     if (!category) {
//       return res.status(400).json({
//         error: "Category is required"
//       });
//     }

//     const prompt = `
// Generate 10 ecommerce product attributes for ${category}.

// Return ONLY a JSON array.

// Example:
// ["Color","Size","Material"]
// `;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [
//               {
//                 text: prompt
//               }
//             ]
//           }
//         ]
//       }
//     );

//     const text =
//       response.data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

//     console.log("AI RAW RESPONSE:", text);

//     const cleaned = text
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();

//     const attributes = JSON.parse(cleaned);

//     return res.json({
//       attributes
//     });

//   } catch (err: any) {
//     console.error(
//       "AI ERROR:",
//       err.response?.data || err.message
//     );

//     return res.status(500).json({
//       error: err.response?.data || err.message
//     });
//   }
// });

app.post("/api/v1/generate-attributes", async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        error: "Category is required"
      });
    }

    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    const prompt = `
You are an ecommerce assistant.

Generate 10 relevant product attributes for this store category:

${category}

Return ONLY a JSON array.

Example:
["Color","Size","Material"]
`;

    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content || "[]";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const attributes = JSON.parse(cleaned);

    return res.json({
      attributes,
    });

  } catch (err: any) {
    console.error("XAI ERROR:", err);

    return res.status(500).json({
      error: err.message,
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