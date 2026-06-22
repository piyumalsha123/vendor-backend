import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticate } from '../middleware/auth'; 

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Profile route hit: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);

export default router;