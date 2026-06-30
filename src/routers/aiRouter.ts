
import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

router.post("/generate-attributes", async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

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

const completion =
  await openai.chat.completions.create({
   model: "google/gemma-2-9b-it:free",

    messages: [
      {
        role: "system",
        content:
          "Return ONLY valid JSON array.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.2,
  });


    console.log(
      "OPENROUTER RESPONSE:",
      JSON.stringify(completion, null, 2)
    );

    // SAFE RESPONSE
    const aiText =
      completion?.choices?.[0]?.message
        ?.content || "[]";

    // CLEAN RESPONSE
    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let attributes: string[] = [];

    try {
      attributes = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.log(
        "INVALID JSON RESPONSE:",
        cleanedText
      );

      return res.status(500).json({
        success: false,
        message: "Invalid AI JSON",
        raw: cleanedText,
      });
    }

    return res.json({
      success: true,
      category,
      attributes,
    });
  } catch (err: any) {
    console.log(
      "OPENROUTER ERROR:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      message: "AI request failed",
      error: err?.message || "Unknown error",
    });
  }
});

export default router;

