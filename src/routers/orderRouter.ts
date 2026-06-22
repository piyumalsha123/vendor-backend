import { Router } from "express";

import { createOrder, getVendorOrders, updateOrder, getCustomerOrders, cancelOrder } from "../controllers/orderController";
import { authenticate } from "../middleware/auth"; 

const router = Router();

router.post("/", authenticate, createOrder);        

router.get("/customer/me", authenticate, getCustomerOrders); 
router.get("/vendor/me", authenticate, getVendorOrders);  
router.put("/status/:id", authenticate, updateOrder); 
router.put("/cancel/:orderId", authenticate, cancelOrder);

export default router;