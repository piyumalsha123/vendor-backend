import express from 'express';
import { saveStoreSettings, getStoreSettings, checkStore, createStore, getStoreById, getProductsByVendor } from '../controllers/storeController';
import { authenticate } from '../middleware/auth'; 

const router = express.Router();

router.post('/save', authenticate, saveStoreSettings);
router.get('/settings', authenticate, getStoreSettings);

router.get('/check', authenticate, checkStore);
router.post('/create', authenticate, createStore);

router.get('/:vendorId', getStoreById);
router.get('/products/:vendorId', getProductsByVendor);

export default router;