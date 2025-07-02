import { Router } from 'express';

import { createVoucher, applyVoucher } from '../controllers/VoucherController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const voucherRouter = Router();

voucherRouter.post('/createVoucher', verifyAccessToken, createVoucher);
voucherRouter.post('/applyVoucher', verifyAccessToken, applyVoucher);

export default voucherRouter;
