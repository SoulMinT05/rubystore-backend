import { Router } from 'express';

import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';
import {
    createHomeSlideImage,
    deleteMultipleHomeSlide,
    deleteHomeSlide,
    getAllHomeSlidesFromUser,
    getDetailsHomeSlide,
    updateHomeSlide,
    getAllHomeSlidesFromAdmin,
} from '../controllers/HomeSlideController.js';

const homeSlideRouter = Router();

homeSlideRouter.delete('/deleteMultipleHomeSlides', verifyAccessToken, deleteMultipleHomeSlide);

homeSlideRouter.post('/create', verifyAccessToken, upload.single('image'), createHomeSlideImage);
homeSlideRouter.get('/all-home-slides', getAllHomeSlidesFromUser);
homeSlideRouter.get('/all-home-slides-admin', [verifyAccessToken], getAllHomeSlidesFromAdmin);

homeSlideRouter.get('/:id', getDetailsHomeSlide);
homeSlideRouter.put('/:id', verifyAccessToken, upload.single('image'), updateHomeSlide);
homeSlideRouter.delete('/:id', verifyAccessToken, deleteHomeSlide);

export default homeSlideRouter;
