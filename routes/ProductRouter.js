import { Router } from 'express';

import {
    createProduct,
    getProducts,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsBySubCategoryId,
    getProductsBySubCategoryName,
    getProductsByThirdSubCategoryId,
    getProductsByThirdSubCategoryName,
    getProductsByPrice,
    getProductsByRating,
} from '../controllers/ProductController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const productRouter = Router();

productRouter.get('/all-products-category-id/:id', getProductsByCategoryId);
productRouter.get('/all-products-sub-category-id/:id', getProductsBySubCategoryId);
productRouter.get('/all-products-third-sub-category-id/:id', getProductsByThirdSubCategoryId);

productRouter.post('/create', verifyAccessToken, upload.array('images'), createProduct);
productRouter.get('/all-products', getProducts);

productRouter.get('/all-products-category-name', getProductsByCategoryName);
productRouter.get('/all-products-sub-category-name', getProductsBySubCategoryName);
productRouter.get('/all-products-third-sub-category-name', getProductsByThirdSubCategoryName);

productRouter.get('/all-products-price', getProductsByPrice);
productRouter.get('/all-products-rating', getProductsByRating);

export default productRouter;
