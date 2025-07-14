import { Router } from 'express';

import {
    getMessagesForStaffs,
    getMessagesForUsers,
    getStaffDetails,
    getStaffsInSidebar,
    getUserDetails,
    getUsersInSidebar,
    sendMessage,
} from '../controllers/MessageController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const messageRouter = Router();
messageRouter.get('/getMessagesForUsers/:staffId', verifyAccessToken, getMessagesForUsers);
messageRouter.get('/getMessagesForStaffs/:userId', verifyAccessToken, getMessagesForStaffs);
messageRouter.get('/getUserDetails/:userId', verifyAccessToken, getUserDetails);
messageRouter.get('/getStaffDetails/:staffId', verifyAccessToken, getStaffDetails);

messageRouter.post('/sendMessage/:receiverId', verifyAccessToken, upload.array('images'), sendMessage);

messageRouter.get('/getStaffsInSidebar', verifyAccessToken, getStaffsInSidebar);
messageRouter.get('/getUsersInSidebar', verifyAccessToken, getUsersInSidebar);

export default messageRouter;
