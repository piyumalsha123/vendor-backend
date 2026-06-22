import { Router } from "express";
// මෙතැනට getCustomerOrders එකත් එකතු කරන්න
import { createOrder, getVendorOrders, updateOrder, getCustomerOrders, cancelOrder } from "../controllers/orderController";
import { authenticate } from "../middleware/auth"; 

const router = Router();

router.post("/", authenticate, createOrder);        
// දැන් මෙය Uncomment කරන්න
router.get("/customer/me", authenticate, getCustomerOrders); 
router.get("/vendor/me", authenticate, getVendorOrders);  
router.put("/status/:id", authenticate, updateOrder); 
// Example in orderRoutes.js
// orderRoutes.ts තුළ
router.put("/cancel/:orderId", authenticate, cancelOrder);

export default router;