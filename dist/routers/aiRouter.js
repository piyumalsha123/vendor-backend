"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.post("/generate-attributes", async (req, res) => {
    try {
        const { category } = req.body;
        const prompt = `
Generate ONLY JSON array of attributes for: ${category}
Example: ["Size","Color","Material"]
`;
        // ✅ THIS IS WHERE YOUR CODE GOES
        const response = await axios_1.default.post("https://api.x.ai/v1/chat/completions", {
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
        }, {
            headers: {
                Authorization: `Bearer ${process.env.XAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        const aiText = response.data.choices[0].message.content;
        let attributes;
        try {
            attributes = JSON.parse(aiText);
        }
        catch (err) {
            return res.status(500).json({
                message: "AI returned invalid JSON",
                raw: aiText
            });
        }
        return res.json({ category, attributes });
    }
    catch (err) {
        console.error("AI ERROR:", err?.response?.data || err.message);
        return res.status(500).json({
            message: "AI request failed"
        });
    }
});
exports.default = router;
