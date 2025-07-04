import CheckoutTokenModel from '../models/CheckoutTokenModel.js';
import UserModel from '../models/UserModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createCheckoutToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { selectedCartItems, totalQuantity, totalPrice, discountType, discountValue, finalPrice, voucher } =
            req.body;

        // ✅ Validate
        if (!Array.isArray(selectedCartItems) || selectedCartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có sản phẩm nào được chọn.',
            });
        }

        // ✅ Tạo token
        const newToken = await CheckoutTokenModel.create({
            userId,
            selectedCartItems,
            totalQuantity,
            totalPrice,
            discountType,
            discountValue,
            finalPrice,
            voucher,
        });

        // ✅ Optionally push vào user (nếu muốn tracking)
        await UserModel.findByIdAndUpdate(userId, {
            $push: { checkoutToken: newToken._id },
        });

        // ✅ Trả về URL checkout
        return res.status(201).json({
            success: true,
            message: 'Tạo token thanh toán thành công',
            tokenId: newToken._id,
            redirectUrl: `/checkout?state=${newToken._id}`,
        });
    } catch (error) {
        console.error('Lỗi tạo checkoutToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const getCheckoutTokenById = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const userId = req.user._id;

        const token = await CheckoutTokenModel.findById(tokenId).populate('selectedCartItems.product');
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token không tồn tại hoặc đã hết hạn.',
            });
        }

        // 🧠 Check user sở hữu token
        if (token.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập token này.',
            });
        }

        return res.status(200).json({
            success: true,
            checkoutData: token,
        });
    } catch (error) {
        console.error('Lỗi lấy checkoutToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

export { createCheckoutToken, getCheckoutTokenById };
