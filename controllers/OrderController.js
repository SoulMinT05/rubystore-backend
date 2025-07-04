import UserModel from '../models/UserModel.js';
import ProductModel from '../models/ProductModel.js';
import OrderModel from '../models/OrderModel.js';
import CheckoutTokenModel from '../models/CheckoutTokenModel.js';
import sendAccountConfirmationEmail from '../config/sendEmail.js';
import { createOrderEmailHtml } from '../utils/emailHtml.js';

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

        // Tạo đơn hàng
        const orderData = await OrderModel.create({
            userId,
            selectedCartItems: token.selectedCartItems,
            shippingAddress: user.address,
            totalQuantity: token.totalQuantity,
            totalPrice: token.totalPrice,
            discountType: token.discountType,
            discountValue: token.discountValue,
            finalPrice: token.finalPrice,
            shippingFee: 0, // có thể tính sau
            paymentMethod,
            paymentStatus,
            note,
        });
        if (token.voucher && token.voucher.code) {
            orderData.voucher = token.voucher;
        }

        const newOrder = await OrderModel.create(orderData);

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
            orderId: newOrder._id,
            orderedItemIds,
        });
    } catch (error) {
        console.error('createOrder error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

export { createOrder };
