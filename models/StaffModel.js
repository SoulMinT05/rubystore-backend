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
        isVerifyEmail: {
            type: Boolean,
            default: false,
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
        address: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'address',
            },
        ],
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
    },
    {
        timestamps: true,
    },
);

const StaffModel = mongoose.model('staff', staffSchema);
export default StaffModel;
