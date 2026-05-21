import { Router } from 'express';
import {
  detailProduct,
  listBrands,
  listCategories,
  listProducts,
  randomProducts,
  searchProductList,
} from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.get('/random', randomProducts);
router.get('/search', searchProductList);
router.get('/:id', detailProduct);

export default router;
export { listCategories, listBrands };
