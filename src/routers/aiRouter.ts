import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY as string
);

router.post("/generate-attributes", async (req, res) => {
try {
const { category } = req.body;

if (!category) {
  return res.status(400).json({
    message: "Category is required"
  });
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

const prompt = `


Generate useful ecommerce product attributes for this category.

Category: ${category}

Rules:

* Return ONLY valid JSON array
* No explanation
* No markdown

Example:
["Color","Size","Material"]
`;


const result = await model.generateContent(prompt);

const aiText = result.response
  .text()
  .trim();

let attributes: string[] = [];

try {
  attributes = JSON.parse(aiText);
} catch (err) {
  console.log("AI RAW:", aiText);

  return res.status(500).json({
    message: "Invalid AI JSON",
    raw: aiText
  });
}

return res.json({
  success: true,
  category,
  attributes
});


} catch (err: any) {
console.log("GEMINI ERROR:", err);


return res.status(500).json({
  message: "AI request failed",
  error: err.message
});


}
});

export default router;
