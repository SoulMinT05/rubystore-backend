import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        images: [
            {
                type: String,
            },
        ],
        isRead: {
            type: Boolean,
            default: false,
        },
        deletedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
    },
    {
        timestamps: true, // ✅ createdAt, updatedAt
    }
);

const MessageModel = mongoose.model('message', messageSchema);
export default MessageModel;
