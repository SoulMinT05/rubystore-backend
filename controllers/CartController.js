import CartModel from '../models/CartModel.js';

import { v2 as cloudinary } from 'cloudinary';
import UserModel from '../models/UserModel.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productId',
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const cartItemIndex = user.shoppingCart.findIndex((item) => item.product.toString() === productId);

        let message = '';
        if (cartItemIndex !== -1) {
            // Tăng số lượng nếu sản phẩm đã có trong giỏ
            user.shoppingCart[cartItemIndex].quantity += 1;
            message = 'Tăng số lượng sản phẩm trong giỏ hàng';
        } else {
            // Thêm mới sản phẩm nếu chưa có
            user.shoppingCart.push({
                product: productId,
                quantity: 1,
            });
            message = 'Thêm sản phẩm vào giỏ hàng thành công';
        }

        await user.save();

        return res.status(200).json({
            success: true,
            shoppingCart: user.shoppingCart,
            message,
        });
    } catch (error) {
        console.error('Lỗi addToCart:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const decreaseQuantityCart = async (req, res) => {
    try {
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getDetailsCartFromUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await CartModel.find({
            userId,
        }).populate([{ path: 'productId' }, { path: 'userId', select: 'name email address' }]);

        return res.status(200).json({
            success: true,
            cart,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const getDetailsCartFromAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const cart = await CartModel.find({
            userId,
        }).populate([{ path: 'productId' }, { path: 'userId', select: 'name email address' }]);

        return res.status(200).json({
            success: true,
            cart,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

export { addToCart, decreaseQuantityCart, getDetailsCartFromUser, getDetailsCartFromAdmin };
