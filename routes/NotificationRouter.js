import { Router } from 'express';

import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../controllers/NotificationController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const notificationRouter = Router();

notificationRouter.post('/markNotificationAsRead/:notificationId', verifyAccessToken, markNotificationAsRead);
notificationRouter.post('/markAllNotificationsAsRead', verifyAccessToken, markAllNotificationsAsRead);
notificationRouter.get('/getNotifications', verifyAccessToken, getNotifications);

export default notificationRouter;
