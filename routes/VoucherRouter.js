import { Router } from 'express';

import {
    createVoucher,
    applyVoucher,
    getAllVouchersFromUser,
    getAllVouchersFromAdmin,
    getDetailsVoucher,
    deleteVoucher,
    deleteMultipleVouchers,
    toggleVoucherActiveStatus,
    updateVoucher,
} from '../controllers/VoucherController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const voucherRouter = Router();

voucherRouter.get('/getDetailsVoucher/:voucherId', verifyAccessToken, getDetailsVoucher);
voucherRouter.delete('/deleteVoucher/:voucherId', verifyAccessToken, deleteVoucher);
voucherRouter.patch('/toggleVoucherActiveStatus/:voucherId', verifyAccessToken, toggleVoucherActiveStatus);
voucherRouter.patch('/updateVoucher/:voucherId', verifyAccessToken, updateVoucher);

voucherRouter.post('/createVoucher', verifyAccessToken, createVoucher);
voucherRouter.post('/applyVoucher', verifyAccessToken, applyVoucher);
voucherRouter.get('/getAllVouchersFromUser', verifyAccessToken, getAllVouchersFromUser);
voucherRouter.get('/getAllVouchers', verifyAccessToken, getAllVouchersFromAdmin);
voucherRouter.delete('/deleteMultipleVouchers', verifyAccessToken, deleteMultipleVouchers);

export default voucherRouter;
