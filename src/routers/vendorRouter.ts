import { Router } from "express";
import { getDashboardStats } from "../controllers/vendorController"; 
import { authenticate } from "../middleware/auth"; 

const router = Router();

router.get("/dashboard-stats", authenticate, getDashboardStats);

export default router;