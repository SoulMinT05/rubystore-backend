import { Router } from 'express';

import {
    createProduct,
    getProductsAdmin,
    getProductsUser,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsBySubCategoryId,
    getProductsBySubCategoryName,
    getProductsByThirdSubCategoryId,
    getProductsByThirdSubCategoryName,
    getProductsByPrice,
    getProductsByRating,
    getProductsCount,
    getProductsByFeature,
    deleteProduct,
    getDetailsProduct,
    updateProduct,
    deleteMultipleProduct,
} from '../controllers/ProductController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const productRouter = Router();

productRouter.get('/all-products-category-id/:id', getProductsByCategoryId);
productRouter.get('/all-products-sub-category-id/:id', getProductsBySubCategoryId);
productRouter.get('/all-products-third-sub-category-id/:id', getProductsByThirdSubCategoryId);

productRouter.post('/create', verifyAccessToken, upload.array('images'), createProduct);
productRouter.get('/all-products-admin', getProductsAdmin);
productRouter.get('/all-products-user', getProductsUser);

productRouter.get('/all-products-category-name', getProductsByCategoryName);
productRouter.get('/all-products-sub-category-name', getProductsBySubCategoryName);
productRouter.get('/all-products-third-sub-category-name', getProductsByThirdSubCategoryName);

productRouter.get('/all-products-price', getProductsByPrice);
productRouter.get('/all-products-rating', getProductsByRating);
productRouter.get('/count', getProductsCount);
productRouter.get('/feature', getProductsByFeature);

productRouter.delete('/deleteMultipleProduct', verifyAccessToken, deleteMultipleProduct);
productRouter.delete('/:id', verifyAccessToken, deleteProduct);
productRouter.get('/:id', getDetailsProduct);
productRouter.put('/:id', verifyAccessToken, upload.array('images'), updateProduct);

export default productRouter;
