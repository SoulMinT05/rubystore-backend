import { Router } from 'express';

import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';
import {
    createHomeSlideImage,
    deleteAllHomeSlides,
    deleteHomeSlide,
    getAllHomeSlides,
    getHomeSlide,
    updateHomeSlide,
} from '../controllers/HomeSlideController.js';

const homeSlideRouter = Router();

homeSlideRouter.delete('/deleteMultiple/:id', verifyAccessToken, deleteAllHomeSlides);

homeSlideRouter.post('/create', verifyAccessToken, upload.single('image'), createHomeSlideImage);
homeSlideRouter.get('/all-home-slides', getAllHomeSlides);

homeSlideRouter.get('/:id', getHomeSlide);
homeSlideRouter.put('/:id', verifyAccessToken, upload.single('image'), updateHomeSlide);
homeSlideRouter.delete('/:id', verifyAccessToken, deleteHomeSlide);

export default homeSlideRouter;
