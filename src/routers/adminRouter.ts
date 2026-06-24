import express from 'express';
import { UserModel, UserRole } from '../models/userModel';
import { OrderModel } from '../models/orderModel';
import { ProductModel } from '../models/productModel';
import StoreModel from '../models/storeModel'; 
import { authenticate, isAdmin } from '../middleware/auth'; 

const router = express.Router();

router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    // Array එකක් තුළ අගයක් සෙවීමට නිවැරදි Enum භාවිතය
    const users = await UserModel.countDocuments({ roles: { $in: [UserRole.USER] } });
    const vendors = await UserModel.countDocuments({ roles: { $in: [UserRole.VENDOR] } }); 
    const orders = await OrderModel.countDocuments();
    
    res.json({ users, vendors, orders });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.put('/vendors/:storeId/toggle-block', authenticate, isAdmin, async (req, res) => {
  try {
    const store = await StoreModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.isActive = !store.isActive;
    await store.save();

    res.json({ 
      message: `Store is now ${store.isActive ? 'Active' : 'Blocked'}`, 
      isActive: store.isActive 
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update block status" });
  }
});

router.get('/orders', authenticate, isAdmin, async (req, res) => {
  try {
    const orders = await OrderModel.find().populate('customerId', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get('/stores', authenticate, isAdmin, async (req, res) => {
  try {
    const stores = await StoreModel.find().populate('vendorId', 'name email phone'); 
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

router.get('/users', authenticate, isAdmin, async (req, res) => {
  const users = await UserModel.find({  roles: { $in: [UserRole.USER] } });
  res.json(users);
});

export default router;