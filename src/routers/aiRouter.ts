import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/generate-attributes", async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const prompt = `
Generate ONLY a JSON array of product attributes.

Category: ${category}

Return format:
["Size", "Color", "Material"]
`;

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-2", // ✅ FIX HERE
        messages: [
          {
            role: "system",
            content: "Return only JSON arrays. No explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = response.data?.choices?.[0]?.message?.content;

    let attributes: string[] = [];

    try {
      attributes = JSON.parse(aiText);
    } catch (err) {
      console.error("RAW AI OUTPUT:", aiText);

      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: aiText
      });
    }

    return res.json({
      category,
      attributes
    });

  } catch (err: any) {
    console.error("AI ERROR:", err?.response?.data || err.message);

    return res.status(500).json({
      message: "AI request failed",
      error: err?.response?.data || err.message
    });
  }
});

export default router;