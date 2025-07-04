import { Router } from 'express';

import { createOrder } from '../controllers/OrderController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const orderRouter = Router();

orderRouter.post('/createOrder', verifyAccessToken, createOrder);

export default orderRouter;
