import UserModel from '../models/UserModel.js';
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
        console.log(name, email, password);

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Cần nhập đủ thông tin tên, email, password!',
                success: false,
            });
        }

        user = await UserModel.findOne({ email });
        if (user) {
            return res.json({
                success: false,
                message: 'Email này đã đựoc đăng ký! Vui lòng dùng email khác',
            });
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        // Send verification email
        await sendAccountConfirmationEmail(
            email,
            '[From RubyStore] Xác minh địa chỉ email',
            '',
            verifyEmailHtml(name, verifyCode),
        );

        user = new UserModel({
            name,
            email,
            password: hashPassword,
            otp: verifyCode,
            otpExpires: Date.now() + 600000, // 10 minutes
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
        const { email, otp } = req.body;
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
                message: 'Xác thực email thành công!',
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

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        };
        res.cookie('accessToken', accessToken, cookiesOption);
        res.cookie('refreshToken', refreshToken, cookiesOption);

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
            sameSite: 'none',
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
        const image = req?.file;
        console.log('image ', image);

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

        await sendAccountConfirmationEmail(
            email,
            '[From RubyStore] Xác minh địa chỉ email',
            '',
            verifyEmailHtml(user?.name, verifyCode),
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
            message: 'Đặt lại mật khẩu thành công',
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

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
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

        const newAccessToken = generateAccessToken(userId, user.role);

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
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
    refreshToken,
    getUserDetails,
};
