"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storeController_1 = require("../controllers/storeController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
router.post('/save', auth_1.authenticate, storeController_1.saveStoreSettings);
router.get('/settings', auth_1.authenticate, storeController_1.getStoreSettings);
router.get('/check', auth_1.authenticate, storeController_1.checkStore);
router.post('/create', auth_1.authenticate, storeController_1.createStore);
router.get('/:vendorId', storeController_1.getStoreById);
router.get('/products/:vendorId', storeController_1.getProductsByVendor);
router.post("/upload-logo", auth_1.authenticate, upload_1.upload.single("logo"), uploadController_1.uploadImage);
exports.default = router;
