
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string
);

router.post(
  "/generate-attributes",
  async (req, res) => {
    try {
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }

      const model =
        genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
        });

      const prompt = `
Generate useful ecommerce product attributes for this category.

Category: ${category}

Rules:
- Return ONLY valid JSON array
- No explanation
- No markdown

Example:
["Color","Size","Material"]
`;

      const result =
        await model.generateContent(prompt);

      const response =
        await result.response;

      const text = response.text();

      console.log("AI RAW:", text);

      let attributes: string[] = [];

      try {
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        attributes = JSON.parse(cleaned);
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Invalid AI JSON",
          raw: text,
        });
      }

      return res.json({
        success: true,
        category,
        attributes,
      });
    } catch (err: any) {
      console.log("GEMINI ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "AI request failed",
        error: err.message,
      });
    }
  }
);

export default router;

