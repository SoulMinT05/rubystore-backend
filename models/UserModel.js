import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
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
        wishlist: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'product',
                },
                productName: {
                    type: String,
                    required: true,
                },
                image: String,
                rating: Number,
                price: Number,
                oldPrice: Number,
                brand: String,
                discount: Number,
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        shoppingCart: [
            {
                product: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'product',
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        orderHistory: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'order',
            },
        ],
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
            enum: ['admin', 'staff', 'user'],
            default: 'user',
        },
        signUpWithGoogle: {
            type: Boolean,
            default: false,
        },
        signInWithFacebook: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

const UserModel = mongoose.model('user', userSchema);
export default UserModel;
