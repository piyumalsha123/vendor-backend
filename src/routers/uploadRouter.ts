import express, { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadImage } from "../controllers/uploadController";
import { authenticate } from "../middleware/auth";

const router: Router = express.Router();

router.post("/", authenticate, upload.single("image"), uploadImage);

export default router;