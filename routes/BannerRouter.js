import { Router } from 'express';

import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';
import {
    createBanner,
    deleteMultipleBanner,
    deleteBanner,
    getBanners,
    updateBanner,
    getBanner,
} from '../controllers/BannerController.js';

const homeSlideRouter = Router();

homeSlideRouter.delete('/deleteMultipleBanner', verifyAccessToken, deleteMultipleBanner);

homeSlideRouter.post('/create', verifyAccessToken, upload.array('images'), createBanner);
homeSlideRouter.get('/all-banners', getBanners);

homeSlideRouter.put('/:id', verifyAccessToken, upload.array('images'), updateBanner);
homeSlideRouter.delete('/:id', verifyAccessToken, deleteBanner);
homeSlideRouter.get('/:id', verifyAccessToken, getBanner);

export default homeSlideRouter;
