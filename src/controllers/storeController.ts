import { Request, Response } from 'express';
import Store from '../models/storeModel';
import { AuthRequest } from '../middleware/auth'; 
import mongoose from 'mongoose';
import { ProductModel } from '../models/productModel';
import { UserModel } from '../models/userModel';

export const saveStoreSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { storeName, phone, email, address, customAttributes, category, deliveryMethods, logo } = req.body;
    const userId = req.user?.sub;

    const updateData: any = {
      storeName, phone, email, address, category,
      customAttributes: Array.isArray(customAttributes) ? customAttributes : [],
      deliveryMethods: Array.isArray(deliveryMethods) ? deliveryMethods : [],
      vendorId: new mongoose.Types.ObjectId(userId),
      userId: userId
    };

    if (logo) updateData.logo = logo;

    const updatedStore = await Store.findOneAndUpdate(
      { userId: userId }, 
      { $set: updateData }, 
      { upsert: true, new: true } // 'new: true' පාවිච්චි කරන්න
    );
    
    res.status(200).json(updatedStore);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkStore = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.sub;
        const store = await Store.findOne({ userId: userId });
        
        if (store) {
            return res.json({ 
                hasStore: true, 
                category: store.category,
                logo: store.logo,
                settings: {
                    storeName: store.storeName,
                    phone: store.phone,
                    email: store.email,
                    address: store.address,
                    deliveryMethods: store.deliveryMethods || [],
                    customAttributes: store.customAttributes || []
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
        // 1. Frontend එකෙන් එවන සියලුම දත්ත ලබා ගන්න (storeName ද ඇතුළුව)
        const { storeName, category, phone, logo, email, address } = req.body;
        const userId = req.user?.sub;

        // 2. Database එකට දත්ත ඇතුලත් කරන්න
        const newStore = new Store({
            vendorId: new mongoose.Types.ObjectId(userId),
            userId: userId,
            storeName: storeName || "My Store", // මෙතැනදී Frontend එකෙන් දෙන නම භාවිතා වේ
            category: category,
            phone: phone,
            logo: logo,
            email: email,
            address: address
        });

        await newStore.save();

        return res.status(201).json({
            success: true,
            store: newStore
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error"
        });
    }
};

export const getStoreSettings = async (req: AuthRequest, res: Response) => {
  try {
    const store = await Store.findOne({ userId: req.user?.sub });
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json(store); 
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const updateStorePhone = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { phone } = req.body; 

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

export const getStoreById = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.params;
        
        const store = await Store.findOne({ vendorId: vendorId }).lean();
        if (!store) return res.status(404).json({ message: "Store not found" });

        const vendor = await UserModel.findById(vendorId); 
        
        const storeData = {
            ...store,
            email: store.email || (vendor ? vendor.email : "N/A"),
            // මෙතැනදී ප්‍රධාන වෙනස:
            phone: store.phone && store.phone.trim() !== "" ? store.phone : (vendor ? vendor.phone : "No Phone")
        };

        res.status(200).json(storeData);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

export const getProductsByVendor = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.query; 
        console.log("Requested VendorID:", vendorId); 
        
        if (!vendorId || typeof vendorId !== 'string') {
            return res.status(400).json({ error: "Invalid Vendor ID" });
        }
       
        const products = await ProductModel.find({ vendorId: vendorId }); 
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

