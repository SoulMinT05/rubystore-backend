import { Router } from 'express';

import {
    createCategory,
    getCategories,
    getCategoriesCount,
    getSubCategoriesCount,
} from '../controllers/CategoryController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const categoryRouter = Router();

categoryRouter.get('/categories/count', verifyAccessToken, getCategoriesCount);
categoryRouter.get('/sub-categories/count', verifyAccessToken, getSubCategoriesCount);

categoryRouter.post('/create', verifyAccessToken, upload.array('images'), createCategory);
categoryRouter.get('/categories', verifyAccessToken, getCategories);

export default categoryRouter;
