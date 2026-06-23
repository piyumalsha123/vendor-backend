import express from 'express';
import { saveStoreSettings, getStoreSettings, checkStore, createStore, getStoreById, getProductsByVendor } from '../controllers/storeController';
import { authenticate } from '../middleware/auth'; 
import { upload } from '../middleware/upload';
import { uploadImage } from '../controllers/uploadController';

const router = express.Router();

router.post('/save', authenticate, saveStoreSettings);
router.get('/settings', authenticate, getStoreSettings);

router.get('/check', authenticate, checkStore);
router.post('/create', authenticate, createStore);

router.get('/:vendorId', getStoreById);
router.get('/products/:vendorId', getProductsByVendor);

router.post("/upload-logo", authenticate, upload.single("logo"), uploadImage);


export default router;