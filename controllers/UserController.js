import UserModel from '../models/UserModel.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../config/emailService.js';
import sendAccountConfirmationEmail from '../config/sendEmail.js';
import verifyEmailHtml from '../utils/verifyEmailHtml.js';

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

        user = new UserModel({
            name,
            email,
            password: hashPassword,
            otp: verifyCode,
            otpExpires: Date.now() + 600000, // 10 minutes
        });
        await user.save();

        // Send verification email
        await sendAccountConfirmationEmail(email, 'Xác minh email từ RubyStore', '', verifyEmailHtml(name, verifyCode));

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

export { register, verifyEmail };
