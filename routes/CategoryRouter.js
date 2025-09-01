import { Router } from 'express';

import {
    createCategory,
    getCategoriesCount,
    getSubCategoriesCount,
    getDetailsCategory,
    deleteCategory,
    updateCategory,
    getCategoriesFromUser,
    getCategoriesFromAdmin,
    deleteMultipleCategories,
} from '../controllers/CategoryController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const categoryRouter = Router();

// CHƯA XÀI
categoryRouter.get('/categories/count', getCategoriesCount);
categoryRouter.get('/sub-categories/count', getSubCategoriesCount);

categoryRouter.post('/create', verifyAccessToken, upload.array('images'), createCategory);
categoryRouter.get('/all-categories', getCategoriesFromUser);
categoryRouter.get('/all-categories-admin', getCategoriesFromAdmin);
categoryRouter.delete('/deleteMultipleCategories', verifyAccessToken, deleteMultipleCategories);
categoryRouter.delete('/:id', verifyAccessToken, deleteCategory);
categoryRouter.get('/:id', getDetailsCategory);
categoryRouter.put('/:id', verifyAccessToken, upload.array('images'), updateCategory);

export default categoryRouter;
