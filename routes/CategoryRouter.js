import { Router } from 'express';

import {
    createCategory,
    getCategories,
    getCategoriesCount,
    getSubCategoriesCount,
    getDetailsCategory,
    deleteCategory,
    updateCategory,
} from '../controllers/CategoryController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const categoryRouter = Router();

categoryRouter.get('/categories/count', getCategoriesCount);
categoryRouter.get('/sub-categories/count', getSubCategoriesCount);

categoryRouter.post('/create', verifyAccessToken, upload.array('images'), createCategory);
categoryRouter.get('/categories', getCategories);
categoryRouter.get('/:id', getDetailsCategory);
categoryRouter.delete('/:id', verifyAccessToken, deleteCategory);
categoryRouter.put('/:id', verifyAccessToken, upload.array('images'), updateCategory);

export default categoryRouter;
