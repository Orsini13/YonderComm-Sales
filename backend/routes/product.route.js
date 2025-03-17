import express from "express";
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';
import {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  toggleFeaturedProduct,
} from '../controllers/product.controller.js'


const router = express.Router();

router.get("/",protectRoute, adminRoute, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/recommendations', getRecommendedProducts)

router.post("/",protectRoute, adminRoute, createProduct);
router.patch('/', protectRoute, adminRoute, toggleFeaturedProduct);
router.delete('/:id', protectRoute, adminRoute, deleteProduct); 

export default router;
