import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Provide full name'],
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
        verifyEmail: {
            type: Boolean,
            default: false,
        },
        lastLoginDate: {
            type: Date,
            default: '',
        },
        status: {
            type: String,
            enum: ['active', 'unactive', 'suspended'],
            default: '',
        },
        address: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'address',
            },
        ],
        shoppingCart: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'cart',
            },
        ],
        orderHistory: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'order',
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
            enum: ['admin', 'staff', 'user'],
            default: 'user',
        },
    },
    {
        timestamps: true,
    },
);

const UserModel = mongoose.model('User', userSchema);
export default UserModel;
