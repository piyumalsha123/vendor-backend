
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
import { ProductModel } from "../models/productModel";

const router = Router();

// Vendor-only routes
router.post("/save", authenticate, requireRole([UserRole.VENDOR]), createProduct);
router.put("/update/:id", authenticate, requireRole([UserRole.VENDOR]), updateProduct);
router.delete("/delete/:id", authenticate, requireRole([UserRole.VENDOR]), deleteProduct);

// AI Suggestion 
router.post("/ai/suggest", authenticate, requireRole([UserRole.VENDOR]), getAiSuggestions);

// Public/All user routes
router.get('/my-products', authenticate, getMyProducts);
router.get('/public-products', getAllPublicProducts);

router.get('/', getProducts);

router.get('/store/:storeId', async (req, res) => {
  try {
    const products = await ProductModel.find({ storeId: req.params.storeId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;