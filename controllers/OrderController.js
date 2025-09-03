import mongoose from 'mongoose';

import UserModel from '../models/UserModel.js';
import StaffModel from '../models/StaffModel.js';
import ProductModel from '../models/ProductModel.js';
import OrderModel from '../models/OrderModel.js';
import VoucherModel from '../models/VoucherModel.js';
import NotificationModel from '../models/NotificationModel.js';
import CheckoutTokenModel from '../models/CheckoutTokenModel.js';
import sendAccountConfirmationEmail from '../config/sendEmail.js';
import { createOrderEmailHtml } from '../utils/emailHtml.js';
import {
    emitNotificationOrder,
    emitNotificationStaffCancelOrder,
    emitNotificationStaffNewOrder,
    emitOrderStatusUpdated,
    emitStaffNewOrder,
} from '../config/socket.js';

const getStatusText = (status) => {
    switch (status) {
        case 'pending':
            return 'Chờ xác nhận';
        case 'shipping':
            return 'Đang giao hàng';
        case 'delivered':
            return 'Đã giao hàng';
        case 'cancelled':
            return 'Đã huỷ';
        default:
            return status;
    }
};

const createOrder = async (req, res) => {
    try {
        const { tokenId, paymentMethod, note } = req.body;
        const userId = req.user._id;

        const token = await CheckoutTokenModel.findById(tokenId);
        if (!token || token.userId.toString() !== userId.toString()) {
            return res.status(404).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const user = await UserModel.findById(userId);
        if (!user || !user.address || !user.address.streetLine) {
            return res.status(400).json({ success: false, message: 'Cần nhập đầy đủ địa chỉ nhận hàng' });
        }

        // Trừ số lượng tồn kho
        for (const item of token.selectedCartItems) {
            const product = await ProductModel.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm: ${item.name}` });
            }

            if (product.countInStock < item.quantityProduct) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm '${item.name}' không đủ số lượng trong kho`,
                });
            }

            product.countInStock -= item.quantityProduct;
            await product.save();
        }

        const paymentStatus = paymentMethod === 'cod' ? 'unpaid' : 'paid';

        // ✅ Nếu có dùng voucher → kiểm tra hạn sử dụng
        if (token.voucher?.code) {
            const voucherInDB = await VoucherModel.findOne({ code: token.voucher.code });

            if (!voucherInDB) {
                return res.status(400).json({
                    success: false,
                    message: 'Voucher không tồn tại',
                });
            }

            const now = new Date();
            if (new Date(voucherInDB.expiresAt) < now) {
                return res.status(400).json({
                    success: false,
                    message: 'Voucher đã hết hạn sử dụng',
                });
            }

            if (!voucherInDB.isActive || voucherInDB.quantityVoucher <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Voucher không còn hiệu lực',
                });
            }
        }

        // Tạo đơn hàng
        const orderData = {
            userId,
            selectedCartItems: token.selectedCartItems,
            shippingAddress: user.address,
            totalQuantity: token.totalQuantity,
            totalPrice: token.totalPrice,
            discountType: token.discountType,
            discountValue: token.discountValue,
            finalPrice: token.finalPrice,
            shippingFee: 0,
            paymentMethod,
            paymentStatus,
            note,
        };
        if (token.voucher && token.voucher.code) {
            orderData.voucher = token.voucher;

            // Trừ quantityVoucher -1
            const existingVoucher = await VoucherModel.findOne({ code: token.voucher.code });
            if (existingVoucher && existingVoucher.quantityVoucher > 0) {
                existingVoucher.quantityVoucher -= 1;

                // Nếu đã hết → có thể cập nhật isActive = false (tuỳ bạn)
                if (existingVoucher.quantityVoucher <= 0) {
                    existingVoucher.isActive = false;
                }

                await existingVoucher.save();
            }
        }

        const createdOrder = await OrderModel.create(orderData);

        // Populate user và product
        const newOrder = await OrderModel.findById(createdOrder._id).populate(
            'userId',
            'name email avatar phoneNumber address'
        );

        const orderedItemIds = token.selectedCartItems.map((item) => {
            return item._id.toString();
        });

        // Cập nhật lịch sử đơn hàng cho user
        user.orderHistory.push(newOrder._id);

        // Xoá checkout token và item đã chọn khỏi cart
        await CheckoutTokenModel.findByIdAndDelete(tokenId);
        user.shoppingCart = user.shoppingCart.filter(
            (cartItem) =>
                !token.selectedCartItems.some(
                    (sel) =>
                        sel.product.toString() === cartItem.product.toString() &&
                        sel.sizeProduct === cartItem.sizeProduct
                )
        );

        await user.save();

        // Nofication cho User
        const newNotification = await NotificationModel.create({
            userId: user._id,
            title: 'Tạo đơn hàng mới thành công',
            description: `Bạn vừa tạo đơn hàng #${newOrder._id} thành công`,
            type: 'order', // 👈 Thêm type
            isRead: false,
            targetUrl: '/order-history',
            bgColor: 'bg-blue-500',
        });

        // Notification cho Staff, Admin
        const staffList = await StaffModel.find();
        for (const staff of staffList) {
            const notification = await NotificationModel.create({
                userId: staff._id,
                title: 'Có đơn hàng mới',
                description: `Người dùng ${user.name} vừa tạo đơn hàng #${newOrder._id}`,
                type: 'order',
                isRead: false,
                targetUrl: `/orders`,
                bgColor: 'bg-blue-500',
            });
            emitNotificationStaffNewOrder(staff._id, notification);
            emitStaffNewOrder(staff._id, newOrder);
        }

        const emailHtml = await createOrderEmailHtml(user, newOrder);
        if (user.email) {
            await sendAccountConfirmationEmail(
                user.email,
                '[From RubyStore] Xác nhận tạo đơn hàng mới thành công',
                '',
                emailHtml
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            order: newOrder,
            orderId: newOrder._id,
            orderedItemIds,
            newNotification,
        });
    } catch (error) {
        console.error('createOrder error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const cancelOrderFromUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const { orderId } = req.body;
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy đơn hàng này',
            });
        }
        if (order.orderStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ được hủy đơn khi đơn đang chờ xử lý',
            });
        }

        order.orderStatus = 'cancelled';
        await order.save();

        // Cập nhật orderStatus trong user.orderHistory nếu có
        const orderIndex = user.orderHistory.findIndex((item) => item._id.toString() === orderId);

        if (orderIndex !== -1) {
            user.orderHistory[orderIndex].orderStatus = 'cancelled';
            await user.save();
        }

        const newCancelNotification = await NotificationModel.create({
            userId,
            title: 'Hủy đơn hàng thành công',
            description: `Bạn vừa hủy đơn hàng #${orderId} thành công'`,
            type: 'order',
            isRead: false,
            bgColor: 'bg-red-500', // Màu cho trạng thái cập nhật
            targetUrl: '/order-history',
        });
        // Emit event socket cho user
        emitOrderStatusUpdated(orderId.toString(), 'cancelled');

        // Notification cho Staff, Admin
        const staffList = await StaffModel.find();
        for (const staff of staffList) {
            const notification = await NotificationModel.create({
                userId: staff._id,
                title: 'Có đơn hàng đã bị hủy',
                description: `Người dùng ${user.name} vừa hủy đơn hàng #${orderId}`,
                type: 'order',
                isRead: false,
                targetUrl: `/orders`,
                bgColor: 'bg-red-500',
            });
            emitNotificationStaffCancelOrder(staff._id, notification);
        }

        return res.status(200).json({
            success: true,
            message: 'Hủy đơn hàng thành công',
            order,
            newCancelNotification,
        });
    } catch (error) {
        console.error('getDetailsOrder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

const updateOrderStatusByAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus } = req.body;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã bị hủy, không thể cập nhật trạng thái',
            });
        }

        order.orderStatus = newStatus;
        await order.save();

        const userId = order.userId;
        const statusText = getStatusText(newStatus);

        const newUpdateNotification = await NotificationModel.create({
            userId,
            title: 'Đơn hàng đã được cập nhật',
            description: `Trạng thái đơn hàng #${orderId} đã được chuyển sang trạng thái '${statusText}'`,
            type: 'order',
            isRead: false,
            bgColor: 'bg-green-500', // Màu cho trạng thái cập nhật
            targetUrl: '/order-history',
        });

        // ✅ Emit thông báo socket tới riêng người dùng
        emitNotificationOrder(userId, newUpdateNotification);

        // ✅ Emit cập nhật trạng thái cho tất cả admin, nhân viên, người dùng
        emitOrderStatusUpdated(orderId.toString(), newStatus);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            order,
            orderId,
            newUpdateNotification,
        });
    } catch (error) {
        console.error('updateOrderStatusByAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: error.response.data.message,
        });
    }
};

const getAllOrdersFromUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        // Lọc theo tất cả hoặc orderStatus
        const { orderStatus } = req.query;
        const filter = {
            userId,
        };
        if (orderStatus) {
            filter.orderStatus = orderStatus;
        }

        const orders = await OrderModel.find(filter)
            .populate('userId', 'name email phoneNumber')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error('getAllOrders error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getAllOrdersFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        // Lọc theo tất cả hoặc orderStatus
        const { orderStatus } = req.query;
        const filter = {};
        if (orderStatus) {
            filter.orderStatus = orderStatus;
        }

        let { field, value } = req.query;

        let query = {};

        // Nếu search theo ngày tạo thì parse sang Date
        if (field && value) {
            if (typeof value === 'string') {
                value = value.trim();
            }
            if (field === 'createdAt') {
                const date = new Date(value);
                if (!isNaN(date)) {
                    // tìm trong ngày đó
                    const nextDay = new Date(date);
                    nextDay.setDate(date.getDate() + 1);
                    query[field] = { $gte: date, $lt: nextDay };
                } else {
                    return res.status(400).json({ message: 'Giá trị ngày không hợp lệ' });
                }
            } else if (['name', 'email', 'phoneNumber'].includes(field)) {
                const users = await UserModel.find({
                    [field]: { $regex: value, $options: 'i' },
                }).select('_id');

                filter.userId = { $in: users.map((u) => u._id) };
            } else if (field === 'paymentMethod' || field === 'orderStatus') {
                filter[field] = value;
            } else if (field === 'totalPrice') {
                if (value === '<200') {
                    filter[field] = { $lt: 200000 };
                } else if (value === '200-500') {
                    filter[field] = { $gte: 200000, $lte: 500000 };
                } else if (value === '500-1000') {
                    filter[field] = { $gte: 500000, $lte: 1000000 };
                } else if (value === '1000-5000') {
                    filter[field] = { $gte: 1000000, $lte: 5000000 };
                } else if (value === '>5000') {
                    filter[field] = { $gt: 5000000 };
                }
            } else {
                filter[field] = { $regex: value, $options: 'i' };
            }
        }

        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || process.env.LIMIT_DEFAULT;
        const skip = (page - 1) * perPage;

        const [orders, totalOrders] = await Promise.all([
            OrderModel.find(filter).populate('userId').sort({ createdAt: -1 }).skip(skip).limit(perPage),
            OrderModel.countDocuments(filter),
        ]);

        res.json({
            success: true,
            orders,
            totalPages: Math.ceil(totalOrders / perPage),
            totalOrders,
            page,
            perPage,
        });
    } catch (error) {
        console.error('getAllOrders error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getDetailsOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;

        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền vào đơn hàng này',
            });
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('getDetailsOrder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

const deleteDetailsOrderFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        const { orderId } = req.params;
        const order = await OrderModel.findByIdAndDelete(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa đơn hàng thành công',
            order,
        });
    } catch (error) {
        console.error('deleteDetailsOrder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

const deleteMultipleOrdersFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        const { orderIds } = req.body;
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách đơn hàng không hợp lệ',
            });
        }

        const result = await OrderModel.deleteMany({ _id: { $in: orderIds } });
        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} đơn hàng`,
        });
    } catch (error) {
        console.error('deleteMultipleOrdersFromAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

export {
    createOrder,
    getAllOrdersFromUser,
    getAllOrdersFromAdmin,
    getDetailsOrder,
    cancelOrderFromUser,
    updateOrderStatusByAdmin,
    deleteDetailsOrderFromAdmin,
    deleteMultipleOrdersFromAdmin,
};
