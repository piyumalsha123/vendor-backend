import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/generate-attributes", async (req, res) => {
  try {
    const { category } = req.body;

    const prompt = `
Generate ONLY JSON array of attributes for: ${category}
Example: ["Size","Color","Material"]
`;

    // ✅ THIS IS WHERE YOUR CODE GOES
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-2",
        messages: [
          {
            role: "system",
            content: "Return ONLY JSON array. No text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = response.data.choices[0].message.content;

    let attributes;
    try {
      attributes = JSON.parse(aiText);
    } catch (err) {
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: aiText
      });
    }

    return res.json({ category, attributes });

  } catch (err: any) {
  console.error("🔥 FULL AI ERROR:", err?.response?.data || err.message || err);

  return res.status(500).json({
    message: "AI request failed",
    error: err?.response?.data || err.message
  });
}
});

export default router;