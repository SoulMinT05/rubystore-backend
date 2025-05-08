import mongoose from 'mongoose';

const staffSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Provide name'],
        },
        email: {
            type: String,
            required: [true, 'Provide email'],
        },
        password: {
            type: String,
            required: [true, 'Provide password'],
        },
        avatar: {
            type: String,
            default: '',
        },
        phoneNumber: {
            type: String,
            default: null,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
            default: '',
        },
        lastLoginDate: {
            type: Date,
            default: '',
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['active', 'unactive', 'suspended'],
            default: 'active',
        },
        address: {
            streetLine: { type: String, default: '' },
            city: { type: String, default: '' },
            district: { type: String, default: '' },
            ward: { type: String, default: '' },
            country: { type: String, default: 'Việt Nam' },
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        forgotPasswordOtp: {
            type: String,
            default: null,
        },
        forgotPasswordExpiry: {
            type: Date,
            default: '',
        },
        role: {
            type: String,
            enum: ['admin', 'staff'],
            default: 'staff',
        },
        signUpWithGoogle: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

const StaffModel = mongoose.model('staff', staffSchema);
export default StaffModel;
