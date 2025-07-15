import { Router } from 'express';

import {
    getNotifications,
    getNotificationsFromStaff,
    markAllNotificationsAsRead,
    markAllNotificationsAsReadFromStaff,
    markNotificationAsRead,
    markNotificationAsReadFromStaff,
} from '../controllers/NotificationController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const notificationRouter = Router();

// USER
notificationRouter.post('/markNotificationAsRead/:notificationId', verifyAccessToken, markNotificationAsRead);
notificationRouter.post('/markAllNotificationsAsRead', verifyAccessToken, markAllNotificationsAsRead);
notificationRouter.get('/getNotifications', verifyAccessToken, getNotifications);

// STAFF
notificationRouter.post(
    '/markNotificationAsReadFromStaff/:notificationId',
    verifyAccessToken,
    markNotificationAsReadFromStaff
);
notificationRouter.post('/markAllNotificationsAsReadFromStaff', verifyAccessToken, markAllNotificationsAsReadFromStaff);
notificationRouter.get('/getNotificationsFromStaff', verifyAccessToken, getNotificationsFromStaff);

export default notificationRouter;
