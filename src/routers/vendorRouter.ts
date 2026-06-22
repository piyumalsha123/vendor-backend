import { Router } from "express";
import { getDashboardStats } from "../controllers/vendorController"; // Controller එක පමණක් මෙහි ඉන්න
import { authenticate } from "../middleware/auth"; // Middleware එක වෙනම import කරන්න

const router = Router();

// දැන් මෙය නිවැරදියි
router.get("/dashboard-stats", authenticate, getDashboardStats);

export default router;