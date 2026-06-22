"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProducts = exports.getProducts = exports.getAllPublicProducts = exports.getMyProducts = exports.deleteProduct = exports.updateProduct = exports.getAiSuggestions = exports.createProduct = void 0;
const productModel_1 = require("../models/productModel");
const counterModel_1 = require("../models/counterModel");
const mongoose_1 = __importDefault(require("mongoose"));
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const createProduct = async (req, res) => {
    try {
        const vendorId = req.user?.sub;
        if (!vendorId)
            return res.status(400).json({ message: "Vendor ID not found!" });
        const { title, description, price, stock, category, images, variants, paymentMethods, deliveryCharge } = req.body;
        let metadata = {};
        if (variants && Object.keys(variants).length > 0) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `Classify these product attributes into 'display', 'select', or 'input'.
          - 'display': Information like Expiry Date, Production Date, Ingredients, Price.
          - 'select': Options like Size, Color, Flavor, Sweetness Level.
          - 'input': Custom text like Custom Message, Customer Name.
          Attributes: ${JSON.stringify(Object.keys(variants))}.
          Return ONLY valid JSON format like {"AttributeName": "category"}.`;
                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json|```/g, "").trim();
                metadata = JSON.parse(text);
            }
            catch (aiErr) {
                console.error("AI Classification Failed, using fallback:", aiErr);
                metadata = {};
            }
        }
        const counter = await counterModel_1.CounterModel.findOneAndUpdate({ id: "product_code" }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true, new: true });
        const productId = `P${String(counter?.seq || 1).padStart(3, '0')}`;
        const newProduct = new productModel_1.ProductModel({
            vendorId: new mongoose_1.default.Types.ObjectId(vendorId),
            productId,
            title,
            description,
            price,
            stock,
            category,
            images: images || [],
            variants: variants || {},
            variantsMetadata: metadata,
            isAvailable: true,
            paymentMethods: paymentMethods || { cod: false, bankTransfer: false },
            deliveryCharge: deliveryCharge || 0
        });
        const savedProduct = await newProduct.save();
        res.status(201).json({ message: "Product added successfully!", data: savedProduct });
    }
    catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        res.status(500).json({ message: "Internal server error!" });
    }
};
exports.createProduct = createProduct;
const getAiSuggestions = async (req, res) => {
    const { attributeName, category, productTitle } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
Act as a professional e-commerce product manager.
For a product titled '${productTitle}' in the '${category}' category, suggest 6 highly relevant and common options for the attribute '${attributeName}'. 
Return ONLY a comma-separated list of values. 
Do not include any extra text, labels, or explanation.
Example format: Red,Blue,Green,Yellow,Black,White
`;
        const result = await model.generateContent(prompt);
        const options = result.response.text().split(",").map(item => item.trim());
        res.status(200).json({ suggestions: options });
    }
    catch (err) {
        res.status(500).json({ message: "AI suggestion failed" });
    }
};
exports.getAiSuggestions = getAiSuggestions;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user?.sub;
        const updatedProduct = await productModel_1.ProductModel.findOneAndUpdate({ _id: id, vendorId: vendorId }, { $set: req.body }, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found or unauthorized!" });
        }
        res.status(200).json({ message: "Product updated successfully!", data: updatedProduct });
    }
    catch (err) {
        console.error("UPDATE PRODUCT ERROR:", err);
        res.status(500).json({ message: "Internal server error during update!" });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user?.sub;
        const deletedProduct = await productModel_1.ProductModel.findOneAndDelete({ _id: id, vendorId: vendorId });
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found or unauthorized!" });
        }
        res.status(200).json({ message: "Product deleted successfully!", data: deletedProduct });
    }
    catch (err) {
        console.error("DELETE PRODUCT ERROR:", err);
        res.status(500).json({ message: "Internal server error during deletion!" });
    }
};
exports.deleteProduct = deleteProduct;
const getMyProducts = async (req, res) => {
    try {
        const vendorId = req.user?.sub;
        const products = await productModel_1.ProductModel.find({ vendorId: vendorId });
        res.status(200).json({ success: true, data: products });
    }
    catch (err) {
        console.error("GET PRODUCTS ERROR:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getMyProducts = getMyProducts;
const getAllPublicProducts = async (req, res) => {
    try {
        const products = await productModel_1.ProductModel.find({});
        console.log("Found products:", products);
        res.status(200).json({ success: true, data: products });
    }
    catch (err) {
        console.error("Controller Error:", err);
        res.status(500).json({ success: false, message: "Error fetching products" });
    }
};
exports.getAllPublicProducts = getAllPublicProducts;
// productController.ts
const getProducts = async (req, res) => {
    try {
        const { vendorId } = req.query;
        let query = {};
        if (vendorId) {
            query = { vendorId: vendorId };
        }
        const products = await productModel_1.ProductModel.find(query);
        res.status(200).json(products);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getProducts = getProducts;
// Backend: productController.ts
const getPublicProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        const products = await productModel_1.ProductModel.find(query);
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};
exports.getPublicProducts = getPublicProducts;
