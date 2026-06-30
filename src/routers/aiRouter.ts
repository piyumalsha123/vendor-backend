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
        message: "Category is required",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON array. No text.",
        },
        {
          role: "user",
          content: `Generate ecommerce attributes for: ${category}`,
        },
      ],
      temperature: 0.2,
    });

    console.log(
      "FULL RESPONSE:",
      JSON.stringify(completion, null, 2)
    );

    // ✅ SAFE CHECK (important fix)
    if (!completion?.choices || completion.choices.length === 0) {
      return res.status(500).json({
        message: "No response from AI model",
        raw: completion,
      });
    }

    let aiText = completion.choices[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({
        message: "Empty AI response",
      });
    }

    // cleanup
    const cleaned = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let attributes;

    try {
      attributes = JSON.parse(cleaned);
    } catch (err) {
      console.log("RAW AI TEXT:", aiText);

      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: aiText,
      });
    }

    return res.json({
      success: true,
      category,
      attributes,
    });

  } catch (err: any) {
    console.error("OPENROUTER ERROR:", err);

    return res.status(500).json({
      message: "AI request failed",
      error: err.message,
    });
  }
});

export default router;