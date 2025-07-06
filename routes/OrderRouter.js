import { Router } from 'express';

import {
    cancelOrderFromUser,
    createOrder,
    getAllOrders,
    getDetailsOrder,
    updateOrderStatusByAdmin,
} from '../controllers/OrderController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const orderRouter = Router();

orderRouter.post('/createOrder', verifyAccessToken, createOrder);
orderRouter.post('/cancelOrderFromUser', verifyAccessToken, cancelOrderFromUser);
orderRouter.put('/updateOrderStatusByAdmin', verifyAccessToken, updateOrderStatusByAdmin);

orderRouter.post('/:orderId', verifyAccessToken, getDetailsOrder);
orderRouter.get('/', verifyAccessToken, getAllOrders);

export default orderRouter;
