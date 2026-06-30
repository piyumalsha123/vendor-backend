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
      return res.status(400).json({ message: "Category is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini", // ✅ SAFE MODEL (important)
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON array. No text.",
        },
        {
          role: "user",
          content: `
Generate ecommerce product attributes.

Category: ${category}

Return ONLY JSON array like:
["Color","Size","Material"]
          `,
        },
      ],
      temperature: 0.2,
    });

    console.log("FULL RESPONSE:", JSON.stringify(completion, null, 2));

    // ✅ SAFE CHECK 1
    if (!completion?.choices?.length) {
      return res.status(500).json({
        message: "No AI response",
        raw: completion,
      });
    }

    // ✅ SAFE TEXT EXTRACTION
    const aiText = completion.choices[0].message?.content ?? "[]";

    console.log("AI TEXT:", aiText);

    // clean response
    const cleaned = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let attributes;

    try {
      attributes = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({
        message: "Invalid JSON from AI",
        raw: aiText,
      });
    }

    return res.json({
      success: true,
      category,
      attributes,
    });

  } catch (err: any) {
    console.log("AI ERROR:", err);

    return res.status(500).json({
      message: "AI request failed",
      error: err.message,
    });
  }
});

export default router;