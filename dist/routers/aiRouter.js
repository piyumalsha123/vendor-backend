"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const router = express_1.default.Router();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
router.post("/generate-attributes", async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.status(400).json({
                message: "Category is required"
            });
        }
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash"
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
        console.log("GEMINI ERROR:", err);
        return res.status(500).json({
            message: "AI request failed",
            error: err.message
        });
    }
});
exports.default = router;
