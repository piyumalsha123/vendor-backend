import express from 'express';
import { UserModel } from '../models/userModel';
import { OrderModel } from '../models/orderModel';
import { ProductModel } from '../models/productModel';
import StoreModel from '../models/storeModel'; 
// Middleware ගොනු නිවැරදිව import කරගන්න
import { authenticate, isAdmin } from '../middleware/auth'; 

const router = express.Router();

// 1. Dashboard Stats (Admin පමණක් සඳහා)
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await UserModel.countDocuments({ role: 'user' });
    const vendors = await UserModel.countDocuments({ role: 'vendor' }); 
    const orders = await OrderModel.countDocuments();
    
    res.json({ users, vendors, orders });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 2. Product Moderation (Admin පමණක් සඳහා)
router.delete('/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await ProductModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// 3. Vendor Block/Unblock (Admin පමණක් සඳහා)
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

// 4. Order Overview (Admin පමණක් සඳහා)
router.get('/orders', authenticate, isAdmin, async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate('customerId', 'name email') // පාරිභෝගිකයාගේ විස්තර පෙන්වීමට
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 5. Order Status Update (Admin පමණක් සඳහා)
router.put('/orders/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; 
    const order = await OrderModel.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.get('/stores', authenticate, isAdmin, async (req, res) => {
  try {
    const stores = await StoreModel.find(); 
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

export default router;