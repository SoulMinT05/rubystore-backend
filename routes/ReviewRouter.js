import { Router } from 'express';

import { addReplyToReview, getAllReviewsFromAdmin, getDetailsReview } from '../controllers/ReviewController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const reviewRouter = Router();

reviewRouter.post('/addReplyToReview/:reviewId', verifyAccessToken, addReplyToReview);
reviewRouter.get('/getDetailsReview/:reviewId', verifyAccessToken, getDetailsReview);
reviewRouter.get('/getAllReviews', verifyAccessToken, getAllReviewsFromAdmin);

export default reviewRouter;
