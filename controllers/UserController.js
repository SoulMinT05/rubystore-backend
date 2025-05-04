import UserModel from '../models/UserModel.js';
import ProductModel from '../models/ProductModel.js';

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendAccountConfirmationEmail from '../config/sendEmail.js';
import verifyEmailHtml from '../utils/verifyEmailHtml.js';
import generateAccessToken from '../utils/generateAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const register = async (req, res) => {
    try {
        let user;
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Cần nhập đủ thông tin tên, email, password!',
                success: false,
            });
        }

        // Kiểm tra xem người dùng đã đăng ký chưa
        user = await UserModel.findOne({ email });
        if (user) {
            const isOtpExpired = user.otpExpires < Date.now();
            if (isOtpExpired) {
                const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpires = Date.now() + 600000; // 10 phút nữa hết hạn

                const salt = await bcryptjs.genSalt(10);
                const hashPassword = await bcryptjs.hash(password, salt);

                user.name = name;
                user.password = hashPassword;
                user.otp = verifyCode;
                user.otpExpires = otpExpires;

                // Lưu thông tin đã cập nhật vào cơ sở dữ liệu
                await user.save();

                const token = jwt.sign(
                    {
                        email: user.email,
                        id: user._id,
                    },
                    process.env.JSON_WEB_TOKEN_SECRET_KEY,
                );

                return res.status(200).json({
                    success: true,
                    message: 'Đăng ký tài khoản thành công. Vui lòng xác minh email!',
                    token,
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Email này đã được đăng ký! Vui lòng xác minh email trước khi đăng ký lại.',
                });
            }
        }

        // Nếu người dùng chưa đăng ký, tiến hành đăng ký mới
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const message = 'đăng ký tài khoản';
        // Gửi email xác minh
        await sendAccountConfirmationEmail(
            email,
            '[From RubyStore] Xác minh địa chỉ email',
            '',
            verifyEmailHtml(name, message, verifyCode),
        );

        // Lưu thông tin người dùng vào database
        user = new UserModel({
            name,
            email,
            password: hashPassword,
            otp: verifyCode,
            otpExpires: Date.now() + 600000, // 10 phút
        });
        await user.save();

        const token = jwt.sign(
            {
                email: user.email,
                id: user._id,
            },
            process.env.JSON_WEB_TOKEN_SECRET_KEY,
        );

        return res.status(200).json({
            success: true,
            message: 'Đăng ký tài khoản thành công. Vui lòng xác minh email!',
            token,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token, otp } = req.body;

        let decoded;
        decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn!',
            });
        }

        const email = decoded.email;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy người dùng!',
            });
        }
        const isCodeValid = user.otp === otp;
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.isVerifyEmail = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return res.status(200).json({
                success: true,
                message: 'Xác thực email thành công! Bạn đã có thể đăng nhập',
            });
        } else if (!isCodeValid) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ! Vui lòng thử lại sau',
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP hết hạn! Vui lòng thử lại sau',
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản chưa được đăng ký!',
            });
        }
        if (user.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản không hoạt động. Hãy liên hệ nhân viên / quản lý để được hỗ trợ!',
            });
        }
        if (!user.isVerifyEmail) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản chưa xác thực. Hãy xác thực tài khoản!',
            });
        }
        const checkPassword = await bcryptjs.compare(password, user.password);
        if (!checkPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không đúng. Hãy kiểm tra lại!',
            });
        }

        const accessToken = await generateAccessToken(user._id, user.role);
        const refreshToken = await generateRefreshToken(user._id);

        await UserModel.findByIdAndUpdate(user?._id, {
            lastLoginDate: new Date(),
        });

        const cookiesOptionAccessToken = {
            secure: true, // Dùng HTTPS
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000, // 10 phút (đổi theo bạn config expiresIn bên JW
        };
        const cookiesOptionRefreshToken = {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        };
        res.cookie('accessToken', accessToken, cookiesOptionAccessToken);
        res.cookie('refreshToken', refreshToken, cookiesOptionRefreshToken);

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        return res.status(500).json({
            er: 'Lỗi nè',
            message: error.message || error,
            success: false,
        });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.user._id;

        const cookie = req.cookies;
        if (!cookie || !cookie.refreshToken) throw new Error('Không tìm thấy refresh token trong cookies');

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
        };
        res.clearCookie('accessToken', cookiesOption);
        res.clearCookie('refreshToken', cookiesOption);

        await UserModel.findByIdAndUpdate(
            userId,
            {
                refreshToken: '',
            },
            { new: true },
        );
        return res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công',
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user._id;
        const image = req.file;

        const user = await UserModel.findOne({ _id: userId });
        if (!user) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        // first remove image from cloudinary
        if (user.avatar) {
            const urlArr = user.avatar.split('/');
            const publicIdWithExt = urlArr[urlArr.length - 1]; // vd: abc123.jpg
            const publicId = publicIdWithExt.split('.')[0]; // abc123
            await cloudinary.uploader.destroy(`rubystore/${publicId}`);
        }

        user.avatar = image.path;
        await user.save();

        return res.status(200).json({
            success: true,
            _id: userId,
            avatar: image.path,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const removeImageFromCloudinary = async (req, res) => {
    try {
        const imgUrl = req.query.img;
        const urlArr = imgUrl.split('/');
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split('.')[0];

        if (imageName) {
            const result = await cloudinary.uploader.destroy(imageName);
            if (result) {
                return res.status(200).json({
                    success: true,
                    message: 'Xoá ảnh thành công',
                });
            }
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const updateInfoUser = async (req, res) => {
    try {
        const { _id } = req.user;
        const { name, password, phoneNumber } = req.body;

        const userExist = await UserModel.findById(_id);
        if (!userExist) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy người dùng!',
            });
        }
        let hashPassword = '';
        if (password) {
            const salt = await bcryptjs.genSalt(10);
            hashPassword = await bcryptjs.hash(password, salt);
        } else {
            hashPassword = userExist.password;
        }

        const updateUser = await UserModel.findByIdAndUpdate(
            _id,
            {
                name,
                phoneNumber,
                password: hashPassword,
            },
            { new: true },
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: updateUser,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ',
            });
        }
        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const updateUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                otp: verifyCode,
                otpExpires: Date.now() + 600000,
            },
            { new: true },
        );

        const message = 'xin cấp lại mật khẩu mới';
        await sendAccountConfirmationEmail(
            email,
            '[From RubyStore] Xác minh địa chỉ email',
            '',
            verifyEmailHtml(user?.name, message, verifyCode),
        );

        return res.status(200).json({
            success: true,
            message: 'Mã OTP đã được gửi. Kiểm tra email',
            user: updateUser,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};
const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ',
            });
        }

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Điền đầy đủ thông tin email, otp',
            });
        }

        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ! Kiểm tra lại',
            });
        }

        const currentTime = new Date().toISOString();
        if (user.otpExpires < currentTime) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn',
            });
        }
        user.otp = '';
        user.otpExpires = '';
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Xác minh OTP thành công',
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};
const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;
        if (!email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Điền đầy đủ email, mật khẩu mới, xác nhận mật khẩu',
            });
        }
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ',
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu và xác nhận mật khẩu cần giống nhau!',
            });
        }
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        await UserModel.findOneAndUpdate(user._id, {
            password: hashPassword,
        });

        return res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công. Bạn đã có thể đăng nhập!',
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { email, oldPassword, password, confirmPassword } = req.body;

        if (!email || !oldPassword || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu.',
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email không tồn tại.',
            });
        }

        const isMatch = await bcryptjs.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu cũ không đúng.',
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        await UserModel.findByIdAndUpdate(user._id, {
            password: hashPassword,
        });

        return res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công!',
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { _id } = req.user;
        const user = await UserModel.findById(_id).select('-password -refreshToken');
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Thông tin người dùng',
            user,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(' ')[1];
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ',
            });
        }

        const verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        if (!verifyToken) {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
            });
        }
        const userId = verifyToken?._id;
        // ✅ Lấy role từ DB
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const newAccessToken = await generateAccessToken(userId, user.role);

        const cookiesOption = {
            secure: true,
            sameSite: 'Strict',
        };
        res.cookie('accessToken', newAccessToken, cookiesOption);
        return res.status(200).json({
            success: true,
            message: 'Access token mới đã được tạo',
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const checkLogin = async (req, res) => {
    const accessToken = req.cookies.accessToken; // Lấy token từ cookie
    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: 'Người dùng chưa đăng nhập',
        });
    }
    try {
        jwt.verify(accessToken, process.env.SECRET_KEY_ACCESS_TOKEN);
        return res.status(200).json({
            success: true,
            message: 'Người dùng đã đăng nhập',
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ',
        });
    }
};

const checkIsRefreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Lấy token từ cookie
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Chưa có refreshToken trong cookies',
        });
    }
    try {
        // Xác thực token
        jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        return res.status(200).json({
            success: true,
            message: 'Đã có refreshToken trong cookies',
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ',
        });
    }
};

// CART
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
        const userId = req.user._id;
        const { productId } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        const index = user.shoppingCart.findIndex((item) => item.product.toString() === productId);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại trong giỏ hàng',
            });
        }

        if (user.shoppingCart[index].quantity > 1) {
            user.shoppingCart[index].quantity -= 1;
        } else {
            // Nếu quantity = 1 => xóa khỏi giỏ
            user.shoppingCart.splice(index, 1);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            shoppingCart: user.shoppingCart,
            message: 'Giảm số lượng sản phẩm giỏ hàng',
        });
    } catch (error) {
        console.error('Lỗi decreaseQuantityCart:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const removeProductCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productId',
            });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    shoppingCart: { product: productId },
                },
            },
            { new: true },
        );

        return res.status(200).json({
            success: true,
            message: 'Xoá sản phẩm khỏi giỏ hàng',
            cart: updatedUser.shoppingCart,
        });
    } catch (error) {
        console.error('Lỗi khi xoá sản phẩm khỏi giỏ hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId).select('shoppingCart').populate({
            path: 'shoppingCart.product',
        });
        return res.status(200).json({
            success: true,
            cart: user,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

// WISHLIST
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID sản phẩm!',
            });
        }

        const user = await UserModel.findById(userId);

        const alreadyExists = user.wishlist.some((item) => item.product.toString() === productId);
        console.log('alreadyExists: ', alreadyExists);
        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm đã có trong wishlist!',
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại!',
            });
        }

        const wishlistItem = {
            product: product._id,
            productName: product.name,
            image: product.image || '',
            rating: product.rating || 0,
            price: product.price,
            oldPrice: product.oldPrice,
            brand: product.brand,
            discount: product.discount || 0,
        };

        user.wishlist.push(wishlistItem);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Đã thêm vào wishlist!',
            wishlist: wishlistItem,
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ!',
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    wishlist: { product: productId },
                },
            },
            { new: true },
        );

        return res.status(200).json({
            success: true,
            message: 'Đã xoá sản phẩm khỏi wishlist!',
            wishlist: updatedUser.wishlist,
        });
    } catch (error) {
        console.error('Remove wishlist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ!',
        });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);

        return res.status(200).json({
            success: true,
            wishlist: user.wishlist || [],
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ!',
        });
    }
};

const updateAddress = async (req, res) => {
    try {
        const userId = req.user._id; // userId lấy từ token sau khi verify
        const { streetLine, city, district, ward, country } = req.body;

        // Kiểm tra người dùng có tồn tại không
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        // Update address
        user.address = {
            streetLine: streetLine || user.address?.streetLine || '',
            city: city || user.address?.city || '',
            district: district || user.address?.district || '',
            ward: ward || user.address?.ward || '',
            country: country || user.address?.country || 'Việt Nam',
        };

        await user.save();

        res.status(200).json({ success: true, message: 'Cập nhật địa chỉ thành công', address: user.address });
    } catch (error) {
        console.error('Lỗi khi cập nhật địa chỉ:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật địa chỉ', error });
    }
};

export {
    register,
    verifyEmail,
    login,
    logout,
    uploadAvatar,
    removeImageFromCloudinary,
    updateInfoUser,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    changePassword,
    refreshToken,
    getUserDetails,
    checkLogin,
    checkIsRefreshToken,
    // cart
    addToCart,
    decreaseQuantityCart,
    removeProductCart,
    getCart,
    // wishlist
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    // address
    updateAddress,
};
