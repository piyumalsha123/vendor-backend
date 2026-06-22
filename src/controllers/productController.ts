import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { CounterModel } from "../models/counterModel";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

import { GoogleGenerativeAI } from "@google/generative-ai";

// AI setup (server.ts එකේ වගේම)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.sub;
    if (!vendorId) return res.status(400).json({ message: "Vendor ID not found!" });

    const { title, description, price, stock, category, images, variants, paymentMethods, deliveryCharge } = req.body;

    // --- AI කොටස ආරම්භය ---
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
      } catch (aiErr) {
        console.error("AI Classification Failed, using fallback:", aiErr);
        metadata = {}; // AI වැරදුනොත් හිස් එකක් යවන්න
      }
    }
    // --- AI කොටස අවසානය ---

    const counter = await CounterModel.findOneAndUpdate(
      { id: "product_code" },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true, new: true }
    );

    const productId = `P${String(counter?.seq || 1).padStart(3, '0')}`;

    const newProduct = new ProductModel({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      productId,
      title,
      description,
      price,
      stock,
      category,
      images: images || [],
      variants: variants || {},
      variantsMetadata: metadata, // AI මගින් ලැබුණු Metadata එක මෙතැනට දාන්න
      isAvailable: true,
      paymentMethods: paymentMethods || { cod: false, bankTransfer: false },
      deliveryCharge: deliveryCharge || 0
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({ message: "Product added successfully!", data: savedProduct });
  } catch (err: any) {
    console.error("CREATE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

export const getAiSuggestions = async (req: Request, res: Response) => {
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
  } catch (err) {
    res.status(500).json({ message: "AI suggestion failed" });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.sub;

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      { $set: req.body },
      { new: true } // updated document එකම ලබාගැනීමට
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found or unauthorized!" });
    }

    res.status(200).json({ message: "Product updated successfully!", data: updatedProduct });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Internal server error during update!" });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.sub;

    const deletedProduct = await ProductModel.findOneAndDelete({ _id: id, vendorId: vendorId });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found or unauthorized!" });
    }

    res.status(200).json({ message: "Product deleted successfully!", data: deletedProduct });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Internal server error during deletion!" });
  }
};

export const getMyProducts = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.sub; 

    const products = await ProductModel.find({ vendorId: vendorId });
    
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllPublicProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({}); 
    console.log("Found products:", products);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ success: false, message: "Error fetching products" });
  }
};

// productController.ts
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.query; // URL එකේ එන query parameter එක
        let query = {};
        
        if (vendorId) {
            query = { vendorId: vendorId };
        }
        
        const products = await ProductModel.find(query);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// Backend: productController.ts
export const getPublicProducts = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        let query: any = {};

        if (search) {
            // $regex: search මගින් වචනයක කොටසක් (partial match) හඳුනා ගන්නවා
            // $options: "i" මගින් case-insensitive කරනවා (FROCK/frock දෙකටම වැඩ)
            query.title = { $regex: search, $options: "i" };
        }

        const products = await ProductModel.find(query);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};