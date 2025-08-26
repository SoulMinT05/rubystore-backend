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
// FOR USER
messageRouter.get('/getMessagesForStaffs/:userId', verifyAccessToken, getMessagesForStaffs);
messageRouter.get('/getStaffDetails/:staffId', verifyAccessToken, getStaffDetails);
messageRouter.get('/getStaffsInSidebar', verifyAccessToken, getStaffsInSidebar);

// FOR STAFFS
messageRouter.get('/getMessagesForUsers/:staffId', verifyAccessToken, getMessagesForUsers);
messageRouter.get('/getUserDetails/:userId', verifyAccessToken, getUserDetails);
messageRouter.get('/getUsersInSidebar', verifyAccessToken, getUsersInSidebar);

messageRouter.post('/sendMessage/:receiverId', verifyAccessToken, upload.array('images'), sendMessage);

export default messageRouter;
