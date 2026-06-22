import { Request, Response } from 'express';
import Store from '../models/storeModel';
import { AuthRequest } from '../middleware/auth'; 
import mongoose from 'mongoose';
import { ProductModel } from '../models/productModel';
import { UserModel } from '../models/userModel';

export const saveStoreSettings = async (req: AuthRequest, res: Response) => {
  try {
  const { customAttributes, deliveryMethods, category } = req.body;
  const userId = req.user?.sub;

    const attributesArray = typeof customAttributes === 'string' 
      ? customAttributes.split(',').map((item: string) => item.trim()) 
      : customAttributes;

    const updatedStore = await Store.findOneAndUpdate(
      { userId: userId }, 
      { 
        customAttributes: attributesArray, 
        deliveryMethods, 
        category, 
        vendorId: new mongoose.Types.ObjectId(userId),
        userId: userId
      },
      { upsert: true, new: true }
    );
    res.status(200).json(updatedStore);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// storeController.ts - checkStore
export const checkStore = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.sub;
        const store = await Store.findOne({ userId: userId });
        
        if (store) {
            return res.json({ 
                hasStore: true, 
                category: store.category,
                settings: {
                    deliveryMethods: store.deliveryMethods || [],
                    customAttributes: store.customAttributes || [], // මෙතන Array එකක් විදිහට යවන්න
                    deliveryCharge: "" 
                } 
            });
        }
        return res.json({ hasStore: false });
    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};

export const createStore = async (req: AuthRequest, res: Response) => {
    try {
        const { category,storeName, phone } = req.body;
        const userId = req.user?.sub;

        const newStore = new Store({
            vendorId: new mongoose.Types.ObjectId(userId),
            userId: userId,
            category,
            storeName: storeName,
            phone
        });
        await newStore.save();
        return res.status(201).json({ success: true, store: newStore });
    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};

// storeController.ts එකේ අගට මේක එකතු කරන්න
export const getStoreSettings = async (req: AuthRequest, res: Response) => {
  try {
    const store = await Store.findOne({ userId: req.user?.sub });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.status(200).json(store); 
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateStorePhone = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { phone } = req.body; // Frontend එකෙන් එවන අලුත් අංකය

    const updatedStore = await Store.findOneAndUpdate(
      { userId: userId },
      { $set: { phone: phone } },
      { new: true }
    );

    res.status(200).json({ success: true, store: updatedStore });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// storeController.ts හි getStoreById ශ්‍රිතය මෙසේ සකසන්න
export const getStoreById = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.params;
        
        // 1. Store එක හොයන්න
        const store = await Store.findOne({ vendorId: vendorId }).lean();
        if (!store) return res.status(404).json({ message: "Store not found" });

        // 2. Vendor ගේ email එක ගන්න (User model එකේ තිබේ නම්)
        const vendor = await UserModel.findById(vendorId); // ඔබේ User model එක මෙතන දාන්න
        
        // 3. Store object එකට email එක append කරන්න
        const storeWithEmail = {
            ...store,
            email: vendor ? vendor.email : "N/A" // මෙතැනදී email එක තනියම දානවා
        };

        res.status(200).json(storeWithEmail);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// 2. එම Store එකේ සියලුම Products ලබා ගැනීමට
export const getProductsByVendor = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.params;
        // ProductModel එක හදලා තියෙන විදියට වෙනස් කරගන්න
        const products = await ProductModel.find({ vendorId: vendorId }); 
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};