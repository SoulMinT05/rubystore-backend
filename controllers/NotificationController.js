import UserModel from '../models/UserModel.js';
import NotificationModel from '../models/NotificationModel.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const limit = parseInt(req.query.limit || 0);
        const notifications = await NotificationModel.find({
            $or: [
                { userId: userId },
                { userId: null }, // Thông báo toàn hệ thống
            ],
        })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCountNotifications = await NotificationModel.countDocuments({ userId, isRead: false });

        return res.status(200).json({
            success: true,
            notifications,
            unreadCountNotifications,
        });
    } catch (error) {
        console.error('Lỗi khi get notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        await NotificationModel.updateMany(
            {
                $or: [
                    { userId: userId },
                    { userId: null }, // nếu bạn có thông báo global thì nên đánh dấu luôn
                ],
                isRead: false,
            },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: 'Tất cả thông báo đã được đánh dấu là đã đọc',
        });
    } catch (error) {
        console.error('Lỗi khi mark all notifications as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const { notificationId } = req.params;
        const notification = await NotificationModel.findById(notificationId);
        if (!notification) {
            return res.status(403).json({
                success: false,
                message: 'Không tìm thấy thông báo',
            });
        }
        if (notification.userId.toString() !== userId.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Không có quyền xem thông báo',
            });
        }
        notification.isRead = true;
        await notification.save();
        return res.status(200).json({
            success: true,
            message: 'Thông báo đã được đánh dấu là đã đọc',
            notification,
            notificationId,
            targetUrl: notification.targetUrl,
        });
    } catch (error) {
        console.error('Lỗi khi mark notification as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

export { getNotifications, markAllNotificationsAsRead, markNotificationAsRead };
