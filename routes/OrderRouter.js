import { Router } from 'express';

import {
    cancelOrderFromUser,
    createOrder,
    deleteDetailsOrderFromAdmin,
    deleteMultipleOrdersFromAdmin,
    getAllOrdersFromAdmin,
    getAllOrdersFromUser,
    getDetailsOrder,
    updateOrderStatusByAdmin,
} from '../controllers/OrderController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const orderRouter = Router();

orderRouter.post('/createOrder', verifyAccessToken, createOrder);
orderRouter.post('/cancelOrderFromUser', verifyAccessToken, cancelOrderFromUser);
orderRouter.put('/updateOrderStatusByAdmin', verifyAccessToken, updateOrderStatusByAdmin);

orderRouter.get('/ordersFromAdmin', verifyAccessToken, getAllOrdersFromAdmin);
orderRouter.delete('/deleteMultipleOrdersFromAdmin', verifyAccessToken, deleteMultipleOrdersFromAdmin);
orderRouter.post('/:orderId', verifyAccessToken, getDetailsOrder);
orderRouter.delete('/:orderId', verifyAccessToken, deleteDetailsOrderFromAdmin);
orderRouter.get('/', verifyAccessToken, getAllOrdersFromUser);

export default orderRouter;
