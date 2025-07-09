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

const getMonthlyStatisticsBarChart = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Tổng người dùng theo tháng
        const users = await UserModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    totalUsers: { $sum: 1 },
                },
            },
        ]);

        // Tổng doanh thu theo tháng
        const orders = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`),
                    },
                    $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }],
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    totalRevenue: { $sum: '$finalPrice' },
                },
            },
        ]);

        // Gộp data 12 tháng
        const stats = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const userData = users.find((u) => u._id === month);
            const orderData = orders.find((o) => o._id === month);

            return {
                name: `Tháng ${month}`,
                'Tổng người dùng': userData?.totalUsers || 0,
                'Tổng doanh thu': orderData?.totalRevenue || 0,
            };
        });

        res.json({ success: true, barChartData: stats });
    } catch (error) {
        console.error('getMonthlyStatistics error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export { getDashboardStatistics, getMonthlyStatisticsBarChart };
