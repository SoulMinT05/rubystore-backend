import { Router } from 'express';

import { createCheckoutToken, getCheckoutTokenById } from '../controllers/CheckoutTokenController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const voucherRouter = Router();

voucherRouter.post('/createCheckoutToken', verifyAccessToken, createCheckoutToken);
voucherRouter.get('/:tokenId', verifyAccessToken, getCheckoutTokenById);

export default voucherRouter;
