import UserModel from '../models/UserModel.js';
import StaffModel from '../models/StaffModel.js';
import ProductModel from '../models/ProductModel.js';
import CategoryModel from '../models/CategoryModel.js';
import OrderModel from '../models/OrderModel.js';
import VoucherModel from '../models/VoucherModel.js';
import BlogModel from '../models/BlogModel.js';
import ReviewModel from '../models/ReviewModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});
const getDashboardStatistics = async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalStaffs = await StaffModel.countDocuments();
        const totalProducts = await ProductModel.countDocuments();
        const totalCategories = await CategoryModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments();
        const totalBlogs = await BlogModel.countDocuments();
        const totalReviews = await ReviewModel.countDocuments();
        const totalVouchers = await VoucherModel.countDocuments();

        // Tổng doanh thu (đơn hàng đã thanh toán)
        const totalRevenueResult = await OrderModel.aggregate([
            {
                $match: {
                    $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
                },
            },
            {
                $group: {
                    _id: null,
                    finalPrice: { $sum: '$finalPrice' },
                },
            },
        ]);
        const totalRevenue = totalRevenueResult[0]?.finalPrice || 0;

        return res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalStaffs,
                totalProducts,
                totalCategories,
                totalOrders,
                totalBlogs,
                totalReviews,
                totalVouchers,
                totalRevenue,
            },
        });
    } catch (error) {
        console.error('Lỗi dashboard:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê',
        });
    }
};

export { getDashboardStatistics };
