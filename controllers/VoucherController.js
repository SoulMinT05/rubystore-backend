import VoucherModel from '../models/VoucherModel.js';
import StaffModel from '../models/StaffModel.js';
import { v2 as cloudinary } from 'cloudinary';
import UserModel from '../models/UserModel.js';

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
        const { code, discountType, discountValue, minOrderValue, expiresAt, quantityVoucher } = req.body;
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
            quantityVoucher: quantityVoucher || 100,
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

const getAllVouchersFromUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const now = new Date();
        const vouchers = await VoucherModel.find({
            expiresAt: { $gte: now },
        });
        return res.status(200).json({
            success: true,
            vouchers,
        });
    } catch (error) {
        console.error('getAllVouchersFromUser error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getAllVouchersFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        const vouchers = await VoucherModel.find();
        return res.status(200).json({
            success: true,
            vouchers,
        });
    } catch (error) {
        console.error('getAllVouchersFromAdmin error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const updateVoucher = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { code, discountType, discountValue, minOrderValue, quantityVoucher, isActive, expiresAt } = req.body;

        const voucher = await VoucherModel.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher',
            });
        }

        // Nếu admin đổi code thì cần kiểm tra trùng
        if (code && code !== voucher.code) {
            const existing = await VoucherModel.findOne({ code: code.trim().toUpperCase() });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã voucher đã tồn tại',
                });
            }
            voucher.code = code.trim().toUpperCase();
        }

        // Cập nhật các trường còn lại nếu có
        if (discountType) voucher.discountType = discountType;
        if (discountValue !== undefined) voucher.discountValue = discountValue;
        if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
        if (quantityVoucher !== undefined) voucher.quantityVoucher = quantityVoucher;
        if (isActive !== undefined) voucher.isActive = isActive;
        if (expiresAt) voucher.expiresAt = new Date(expiresAt);

        await voucher.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật voucher thành công',
            voucher,
            voucherId,
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật voucher:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const getDetailsVoucher = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher',
            });
        }

        const { voucherId } = req.params;

        const voucher = await VoucherModel.findById(voucherId);

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        return res.status(200).json({
            success: true,
            voucher,
        });
    } catch (error) {
        console.error('getDetailsOrder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

const deleteVoucher = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const voucher = await VoucherModel.findByIdAndDelete(voucherId);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher',
            });
        }

        res.status(200).json({ success: true, message: 'Xóa voucher thành công', voucher });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách review:', error.message);
        res.status(500).json({ message: 'Lỗi server khi lấy đánh giá.' });
    }
};

const deleteMultipleVouchers = async (req, res) => {
    try {
        const { voucherIds } = req.body;
        if (!Array.isArray(voucherIds) || voucherIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách voucher không hợp lệ',
            });
        }

        const result = await VoucherModel.deleteMany({ _id: { $in: voucherIds } });
        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} voucher`,
            voucherIds,
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách review:', error.message);
        res.status(500).json({ message: 'Lỗi server khi lấy đánh giá.' });
    }
};

const toggleVoucherActiveStatus = async (req, res) => {
    try {
        const { voucherId } = req.params;

        const voucher = await VoucherModel.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        // Toggle trạng thái isActive
        voucher.isActive = !voucher.isActive;
        await voucher.save();

        return res.status(200).json({
            success: true,
            message: `Voucher đã được ${voucher.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
            isActive: voucher.isActive,
        });
    } catch (error) {
        console.error('Lỗi khi đổi trạng thái khóa voucher:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi trạng thái khóa voucher.',
        });
    }
};

// console.log('Generated Code:', generateRandomVoucherCode(12));

export {
    applyVoucher,
    createVoucher,
    getAllVouchersFromUser,
    getAllVouchersFromAdmin,
    updateVoucher,
    getDetailsVoucher,
    deleteVoucher,
    deleteMultipleVouchers,
    toggleVoucherActiveStatus,
};
