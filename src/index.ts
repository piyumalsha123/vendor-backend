import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"; 

import AuthRouter from "./routers/authRouter";
import ProductRouter from "./routers/productRouter";
import orderRouter from "./routers/orderRouter";
import uploadRouter from "./routers/uploadRouter";
import StoreRouter from "./routers/storeRouter"; 
import profileRouter from './routers/profileRouter';


import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL as string;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY as string; 

const app = express();

const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

const attributeCache: Record<string, string[]> = {}; 

app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.post('/api/v1/orders', async (req, res) => {
//     try {
//         const { order_id, amount, items, user_id } = req.body;
//         console.log("Order Saved Successfully:", order_id);
//         res.status(200).json({ success: true, message: "Order placed!" });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Database Error" });
//     }
// });

// app.use("/api/v1/product", ProductRouter);
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/store", StoreRouter); 
app.use('/api/v1/stores', StoreRouter);
app.use('/api/v1/products', ProductRouter);
app.use('/api/v1/profile', profileRouter);


app.post("/api/v1/generate-attributes", async (req, res) => {
  const { category } = req.body;
  
  if (!category) return res.status(400).json({ error: "Category is required" });

  if (attributeCache[category]) {
    console.log(`Serving ${category} from cache...`);
    return res.json({ attributes: attributeCache[category] });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `You are a strict E-commerce expert. Generate a JSON array of strings containing exactly 25 highly relevant product attributes for the category: "${category}".

Follow these strict category rules:
${category === "Cakes" || category === "Bakery & Sweets" || category === "Healthy Snacks" ? 
  "- Include: Flavor, Main Ingredients, Dietary Info, Serving Size, Weight, Expiry Date, Storage Instructions, Packaging Type, Calorie Count, Allergen Info, Sweetness Level, Texture, Decoration Type, Occasion, Origin, Shelf Life, Production Date, Preservatives Used, Organic Status, Gluten-Free Status, Halal/Kosher Status, Serving Suggestion, Temperature Requirement, Unit Price, Brand." :
  category === "Handmade Flowers" || category === "Floral Arrangements" || category === "Plants" ?
  "- Include: Flower Type, Plant Variety, Pot Material, Pot Size, Height, Color Palette, Sunlight Requirement, Water Frequency, Pet-Friendly, Air Purifying, Longevity, Vase Included, Stem Length, Blooming Season, Fragrance, Maintenance Difficulty, Fertilizer Needs, Temperature Tolerance, Indoor/Outdoor, Propagation Method, Origin, Style, Theme, Occasion, Packaging." :
  "- Include: Material, Size, Weight, Color, Finish, Care Instructions, Customization Options, Durability, Features, Usage, Style, Theme, Dimensions, Brand, Origin, Warranty, Assembly Required, Safety Standards, Packaging, Components, Texture, Water Resistance, Heat Resistance, UV Resistance, Base Material."}

STRICT OUTPUT RULES:
1. Return ONLY the raw JSON array.
2. NO conversational text, NO explanations, NO markdown code blocks like \`\`\`json.
3. Start the response with [ and end with ].
4. Ensure exactly 25 items are in the array.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Markdown ඉවත් කිරීම සහ JSON Parse කිරීම
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const attributes = JSON.parse(text); 
    attributeCache[category] = attributes;
    
    res.json({ attributes });
  } catch (error: any) {
    console.error("AI Error:", error);
    const fallbackAttributes = ["Size", "Material", "Color", "Weight", "Care Instructions"];
    res.status(200).json({ attributes: fallbackAttributes }); 
  }
});


mongoose.connect(DB_URL)
  .then(() => {
    console.log("DB connected...");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => console.error("DB Connection Error:", err));