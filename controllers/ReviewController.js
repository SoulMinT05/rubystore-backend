import { emitNewReply, emitReplyToReview } from '../config/socket.js';
import ReviewModel from '../models/ReviewModel.js';
import StaffModel from '../models/StaffModel.js';
import NotificationModel from '../models/NotificationModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

export const addReplyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { replyText } = req.body;
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người gửi',
            });
        }

        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review không tồn tại' });
        }

        review.replies.push({
            userId,
            replyText,
        });

        await review.save();

        // Populate userId trong replies
        const populatedReview = await ReviewModel.findById(reviewId).populate('replies.userId', 'name avatar');

        // Lấy reply mới nhất
        const newReply = populatedReview.replies[populatedReview.replies.length - 1];

        // ✅ Emit cập nhật reply cho người dùng thấy
        emitNewReply({
            reviewId,
            newReply,
        });

        const receiverUserId = review.userId;
        const sender = await StaffModel.findById(userId).select('name avatar');

        const newReplyNotification = await NotificationModel.create({
            userId: receiverUserId,
            avatarSender: sender.avatar,
            title: `${sender.name} đã phản hồi đánh giá của bạn.`,
            description: newReply.replyText,
            type: 'reply',
            isRead: false,
            bgColor: 'bg-red-500', // Màu cho trạng thái cập nhật
            targetUrl: `/product/${review.productId}?tab=review`,
        });

        // ✅ Emit thông báo socket tới riêng người dùng
        emitReplyToReview(receiverUserId, newReplyNotification);

        res.status(200).json({
            success: true,
            message: 'Phản hồi thành công',
            review,
            reviewId,
            newReply,
            newReplyNotification,
        });
    } catch (err) {
        console.error('addReplyToReview error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getAllReviewsFromAdmin = async (req, res) => {
    try {
        const staffId = req.user._id;
        const staff = await StaffModel.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên',
            });
        }
        const reviews = await ReviewModel.find()
            .populate('userId', 'name email avatar')
            .populate('replies.userId', 'name avatar')
            .populate('productId', 'name images')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        console.log('getAllReviewsFromAdmin error: ', error);
    }
};

export const getDetailsReview = async (req, res) => {
    try {
        const staffId = req.user._id;
        const staff = await StaffModel.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên',
            });
        }

        const { reviewId } = req.params;
        const review = await ReviewModel.findById(reviewId)
            .populate('userId', 'name email avatar')
            .populate('replies.userId', 'name avatar')
            .populate('productId', 'name images');

        return res.status(200).json({
            success: true,
            review,
        });
    } catch (error) {
        console.log('getDetailsReview error: ', error);
    }
};
