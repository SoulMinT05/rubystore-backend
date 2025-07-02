import VoucherModel from '../models/VoucherModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

// Hàm sinh mã random
const generateRandomVoucherCode = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const createVoucher = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, expiresAt } = req.body;
        if (!discountType || !discountValue) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc để tạo voucher',
            });
        }

        // Gán expiresAt mặc định nếu không nhập
        let expires = expiresAt;
        if (!expires) {
            const now = new Date();
            now.setDate(now.getDate() + 7); // +7 ngày
            expires = now;
        }

        let finalCode = code?.toUpperCase().trim();
        if (!finalCode) {
            let isUnique = false;
            while (!isUnique) {
                const randomCode = generateRandomVoucherCode(12);
                const existing = await VoucherModel.findOne({ code: randomCode });
                if (!existing) {
                    finalCode = randomCode;
                    isUnique = true;
                }
            }
        } else {
            // Nếu admin nhập mã → kiểm tra trùng
            const existing = await VoucherModel.findOne({ code: finalCode });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã voucher đã tồn tại',
                });
            }
        }

        const newVoucher = new VoucherModel({
            code: finalCode,
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            expiresAt: expires,
        });

        await newVoucher.save();

        return res.status(201).json({
            success: true,
            message: 'Tạo voucher thành công',
            voucher: newVoucher,
        });
    } catch (error) {
        console.error('Lỗi khi tạo voucher:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const applyVoucher = async (req, res) => {
    try {
        const { code, totalPrice } = req.body;

        code;
        if (!code) {
            return res.status(404).json({ success: false, message: 'Cần nhập code voucher.' });
        }
        const voucher = await VoucherModel.findOne({ code });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher không tồn tại.' });
        }
        if (!voucher.isActive) {
            return res.status(400).json({ success: false, message: 'Voucher đã bị vô hiệu hoá.' });
        }
        if (voucher.isUsed) {
            return res.status(400).json({ success: false, message: 'Voucher này đã được sử dụng.' });
        }

        if (new Date() > new Date(voucher.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Voucher đã hết hạn.' });
        }

        if (totalPrice < voucher.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng phải tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để áp dụng voucher.`,
            });
        }

        let discount = 0;
        if (voucher.discountType === 'percent') {
            discount = (voucher.discountValue / 100) * totalPrice;
        } else if (voucher.discountType === 'fixed') {
            discount = voucher.discountValue;
        }

        const finalPrice = Math.max(totalPrice - discount, 0);

        return res.status(200).json({
            success: true,
            message: 'Áp dụng voucher thành công.',
            discountValue: discount,
            finalPrice,
            voucher,
        });
    } catch (error) {
        console.error('Lỗi áp dụng voucher:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

console.log('Generated Code:', generateRandomVoucherCode(12));

export { applyVoucher, createVoucher };
