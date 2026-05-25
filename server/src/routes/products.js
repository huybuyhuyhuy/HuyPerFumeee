import { Router } from 'express';
import {
  detailProduct,
  homepageData,
  listBrands,
  listCategories,
  listProducts,
  randomProducts,
  searchProductList,
} from '../controllers/productController.js';
import {
  personalizedRecommendations,
  recentlyViewedProducts,
  recordView,
  relatedProducts,
  trendingProducts,
} from '../controllers/recommendationController.js';
import { createReview, listProductReviews } from '../controllers/reviewController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/homepage', homepageData);
router.get('/', listProducts);
router.get('/random', randomProducts);
router.get('/search', searchProductList);
router.get('/recommendations/trending', authMiddleware.optional, trendingProducts);
router.get('/recommendations/personalized', authMiddleware.optional, personalizedRecommendations);
router.get('/recently-viewed', authMiddleware.optional, recentlyViewedProducts);
router.get('/:id/related', authMiddleware.optional, relatedProducts);
router.get('/:id/reviews', authMiddleware.optional, listProductReviews);
router.post('/:id/reviews', authMiddleware, createReview);
router.post('/:id/view', authMiddleware.optional, recordView);
router.get('/:id', authMiddleware.optional, detailProduct);

export default router;
export { listCategories, listBrands };
