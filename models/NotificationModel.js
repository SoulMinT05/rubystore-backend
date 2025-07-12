import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // người nhận
        avatarSender: { type: String }, // avatar người gửi
        title: { type: String, required: true },
        description: { type: String },
        image: { type: String },
        type: { type: String, enum: ['order', 'review', 'reply', 'system', 'chat'], required: true },
        targetUrl: { type: String },
        isRead: { type: Boolean, default: false },
        expiredAt: { type: Date },
        bgColor: { type: String },
    },
    {
        timestamps: true,
    }
);

const NotificationModel = mongoose.model('notification', notificationSchema);
export default NotificationModel;
