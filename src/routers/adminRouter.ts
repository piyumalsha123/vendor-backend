import express from 'express';
import { UserModel, UserRole } from '../models/userModel';
import { OrderModel } from '../models/orderModel';
import { ProductModel } from '../models/productModel';
import StoreModel from '../models/storeModel'; 
import { authenticate, isAdmin } from '../middleware/auth'; 
import { deleteStore } from '../controllers/storeController';

const router = express.Router();

router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    
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
    const stores = await StoreModel.find()
      .populate({
        path: 'vendorId',
        select: 'name email phone', 
        model: 'user_details'      
      })
      .lean(); 
    
    res.json(stores || []); 
  } catch (err) {
    console.error("Store Fetch Error:", err);
    res.status(500).json([]); 
  }
});

router.get('/users', authenticate, isAdmin, async (req, res) => {
  const users = await UserModel.find({  roles: { $in: [UserRole.USER] } });
  res.json(users);
});

router.get('/users-all', authenticate, isAdmin, async (req, res) => {
  try {
    const allUsers = await UserModel.find({}); 
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put('/users/:userId/toggle-block', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.approved = !user.approved; 
    await user.save();

    res.json({ message: `User status updated`, approved: user.approved });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

router.delete('/stores/:id', authenticate, isAdmin, deleteStore);

export default router;
