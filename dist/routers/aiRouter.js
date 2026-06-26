"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const router = express_1.default.Router();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
router.post("/generate-attributes", async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.status(400).json({
                message: "Category is required"
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
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an ecommerce AI. Return only JSON arrays."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7
        });
        const aiText = completion.choices[0].message.content || "[]";
        let attributes = [];
        try {
            attributes = JSON.parse(aiText);
        }
        catch (err) {
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
    }
    catch (err) {
        console.log("OPENAI ERROR:", err);
        return res.status(500).json({
            message: "AI request failed",
            error: err.message
        });
    }
});
exports.default = router;
