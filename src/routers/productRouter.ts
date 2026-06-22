// routers/productRouter.ts
import { Router } from "express";
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getMyProducts, 
  getAllPublicProducts, 
  getProducts,
  getAiSuggestions 
} from "../controllers/productController";
import { UserRole } from "../models/userModel";
import { requireRole } from "../middleware/role";
import { authenticate } from "../middleware/auth";

const router = Router();

// Vendor-only routes
router.post("/save", authenticate, requireRole([UserRole.VENDOR]), createProduct);
router.put("/update/:id", authenticate, requireRole([UserRole.VENDOR]), updateProduct);
router.delete("/delete/:id", authenticate, requireRole([UserRole.VENDOR]), deleteProduct);

// AI Suggestion route - මෙය Vendor සඳහා පමණක් ආරක්ෂිතව තැබීම වඩා සුදුසුයි
router.post("/ai/suggest", authenticate, requireRole([UserRole.VENDOR]), getAiSuggestions);

// Public/All user routes
router.get('/my-products', authenticate, getMyProducts);
router.get('/public-products', getAllPublicProducts);

router.get('/', getProducts);

export default router;