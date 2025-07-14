import UserModel from '../models/UserModel.js';
import StaffModel from '../models/StaffModel.js';
import { v2 as cloudinary } from 'cloudinary';
import MessageModel from '../models/MessageModel.js';
import mongoose from 'mongoose';
import { populateUsersStaffsInMessages } from '../utils/populateUserStaffInMessages.js';
import { emitSendMessage } from '../config/socket.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const images = req.files;
        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images?.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path); // upload ảnh lên Cloudinary (hoặc bất kỳ dịch vụ nào khác)
                    return uploadedImage.url; // trả về URL ảnh đã tải lên
                })
            );
        }

        const newMessage = new MessageModel({
            receiverId,
            senderId,
            text,
            images: imageUrls,
        });

        await newMessage.save();
        const populatedMessage = await populateUsersStaffsInMessages([newMessage]);
        emitSendMessage(receiverId, populatedMessage[0]);

        return res.status(200).json({
            success: true,
            newMessage: populatedMessage[0],
        });
    } catch (error) {
        console.error('sendMessage error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getMessagesForUsers = async (req, res) => {
    try {
        const { staffId } = req.params;
        const myId = req.user._id;

        const messages = await MessageModel.find({
            $or: [
                { receiverId: staffId, senderId: myId },
                { receiverId: myId, senderId: staffId },
            ],
        });

        const populatedMessages = await populateUsersStaffsInMessages(messages);

        return res.status(200).json({
            success: true,
            messages: populatedMessages,
        });
    } catch (error) {
        console.error('getMessages error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getMessagesForStaffs = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        const messages = await MessageModel.find({
            $or: [
                { receiverId: userId, senderId: myId },
                { receiverId: myId, senderId: userId },
            ],
        });

        const populatedMessages = await populateUsersStaffsInMessages(messages);

        return res.status(200).json({
            success: true,
            messages: populatedMessages,
        });
    } catch (error) {
        console.error('getMessages error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getStaffsInSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        const staffs = await StaffModel.find();
        return res.status(200).json({
            success: true,
            staffs,
        });
    } catch (error) {
        console.error('getStaffsInSidebar error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getUsersInSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        const users = await UserModel.find();
        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error('getUsersInSidebar error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('getMessages error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export const getStaffDetails = async (req, res) => {
    try {
        const { staffId } = req.params;

        const staff = await StaffModel.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên',
            });
        }

        return res.status(200).json({
            success: true,
            staff,
        });
    } catch (error) {
        console.error('getMessages error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};
